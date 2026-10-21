import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

/** Opens (and migrates) the database in `dir`. */
export function openDb(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(path.join(dir, "framelane.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return Object.assign(db, { close: () => sqlite.close() });
}

export type Db = ReturnType<typeof openDb>;
