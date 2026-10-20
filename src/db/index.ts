import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const dataDir = process.env.FRAMELANE_DATA_DIR ?? path.join(process.cwd(), "data");

function open() {
  fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(path.join(dataDir, "framelane.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

// Opened on first use so builds never touch the database. Kept on globalThis to
// survive hot reloads in development.
const globalForDb = globalThis as unknown as { framelaneDb?: ReturnType<typeof open> };

export function getDb() {
  globalForDb.framelaneDb ??= open();
  return globalForDb.framelaneDb;
}
