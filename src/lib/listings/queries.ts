import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { listings } from "@/db/schema";
import { withDefaults, type Listing } from "@/lib/app-store/listing";

export function getListings(appId: string): Record<string, Listing> {
  const rows = getDb().select().from(listings).where(eq(listings.appId, appId)).all();
  return Object.fromEntries(rows.map((row) => [row.locale, withDefaults(row.fields)]));
}

export function upsertListing(appId: string, locale: string, fields: Listing) {
  getDb()
    .insert(listings)
    .values({ appId, locale, fields })
    .onConflictDoUpdate({
      target: [listings.appId, listings.locale],
      set: { fields, updatedAt: sql`(unixepoch())` },
    })
    .run();
}
