import "server-only";

import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { apps } from "@/db/schema";
import type { Design } from "@/lib/design/model";
import type { NewAppInput } from "./input";

export async function listApps() {
  // better-sqlite3 is synchronous, so opt out of prerendering explicitly.
  await connection();
  return getDb().select().from(apps).orderBy(desc(apps.createdAt)).all();
}

export async function getApp(id: string) {
  await connection();
  return getDb().select().from(apps).where(eq(apps.id, id)).get();
}

export function insertApp(input: NewAppInput) {
  return getDb()
    .insert(apps)
    .values({ id: crypto.randomUUID(), ...input })
    .returning()
    .get();
}

export function updateAppDesign(id: string, design: Design) {
  getDb().update(apps).set({ design }).where(eq(apps.id, id)).run();
}

export function updateAppLocales(id: string, locales: string[]) {
  getDb().update(apps).set({ locales }).where(eq(apps.id, id)).run();
}
