"use server";

import { z } from "zod";
import { listingSchema } from "@/lib/app-store/listing";
import { captionSchema, designSchema } from "@/lib/design/model";
import { isAppStoreLocale } from "@/lib/app-store/locales";
import { getApp, updateAppDesign, updateAppLocales } from "@/lib/apps/queries";
import { deleteFrame, reorderFrames, setFrameCaption } from "@/lib/frames/queries";
import { upsertListing } from "@/lib/listings/queries";

// Editor state lives on the client and is saved in the background, so these
// actions only validate and persist. They do not revalidate the page.

export async function saveDesign(appId: string, design: unknown) {
  updateAppDesign(appId, designSchema.parse(design));
}

export async function saveCaption(appId: string, frameId: string, locale: string, caption: unknown) {
  setFrameCaption(appId, frameId, z.string().refine(isAppStoreLocale).parse(locale), captionSchema.parse(caption));
}

export async function saveFrameOrder(appId: string, orderedIds: unknown) {
  reorderFrames(appId, z.array(z.string()).parse(orderedIds));
}

export async function removeFrame(appId: string, frameId: string) {
  deleteFrame(appId, frameId);
}

export async function saveLocales(appId: string, locales: unknown) {
  const app = await getApp(appId);
  if (!app) throw new Error("App not found");
  const parsed = z.array(z.string().refine(isAppStoreLocale)).min(1).parse(locales);
  // The primary locale always stays first.
  updateAppLocales(appId, [app.primaryLocale, ...parsed.filter((code) => code !== app.primaryLocale)]);
}

export async function saveListing(appId: string, locale: string, listing: unknown) {
  upsertListing(appId, z.string().refine(isAppStoreLocale).parse(locale), listingSchema.parse(listing));
}

/**
 * Replaces the listings for every locale in the import. Unknown locales are skipped and
 * reported back; locales the app does not have yet are added to it.
 */
export async function importListings(appId: string, imported: unknown) {
  const app = await getApp(appId);
  if (!app) throw new Error("App not found");
  const entries = Object.entries(z.record(z.string(), listingSchema).parse(imported));
  const accepted = entries.filter(([locale]) => isAppStoreLocale(locale));
  for (const [locale, listing] of accepted) upsertListing(appId, locale, listing);
  const locales = [...new Set([...app.locales, ...accepted.map(([locale]) => locale)])];
  if (locales.length !== app.locales.length) updateAppLocales(appId, locales);
  return {
    locales,
    imported: accepted.map(([locale]) => locale),
    skipped: entries.filter(([locale]) => !isAppStoreLocale(locale)).map(([locale]) => locale),
  };
}
