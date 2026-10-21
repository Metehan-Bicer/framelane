import "server-only";

import { eq, sql } from "drizzle-orm";
import { currentDb } from "@/db";
import { listings } from "@/db/schema";
import { withDefaults, type Listing } from "@/lib/app-store/listing";

export async function getListings(appId: string): Promise<Record<string, Listing>> {
  const rows = (await currentDb()).select().from(listings).where(eq(listings.appId, appId)).all();
  return Object.fromEntries(rows.map((row) => [row.locale, withDefaults(row.fields)]));
}

export async function upsertListing(appId: string, locale: string, fields: Listing) {
  (await currentDb())
    .insert(listings)
    .values({ appId, locale, fields })
    .onConflictDoUpdate({
      target: [listings.appId, listings.locale],
      set: { fields, updatedAt: sql`(unixepoch())` },
    })
    .run();
}
