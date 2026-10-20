import "server-only";

import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { apps } from "@/db/schema";
import type { NewAppInput } from "./input";

export async function listApps() {
  // better-sqlite3 is synchronous, so opt out of prerendering explicitly.
  await connection();
  return getDb().select().from(apps).orderBy(desc(apps.createdAt)).all();
}

export function insertApp(input: NewAppInput) {
  return getDb()
    .insert(apps)
    .values({ id: crypto.randomUUID(), ...input })
    .returning()
    .get();
}
