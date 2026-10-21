import "server-only";

import { isDemo } from "@/lib/demo/mode";
import { currentWorkspace, type Store } from "@/lib/demo/workspaces";
import { dataDir, uploadsDir } from "@/lib/paths";
import { openDb, type Db } from "./open";

export { openDb, type Db, type Store };

// Opened on first use so builds never touch the database. Kept on globalThis to
// survive hot reloads in development.
const globalForDb = globalThis as unknown as { framelaneDb?: Db };

/** The instance database. Outside the public demo this is the only one. */
export function getDb() {
  globalForDb.framelaneDb ??= openDb(dataDir);
  return globalForDb.framelaneDb;
}

/**
 * The database and upload folder for the current request. In the public demo every visitor has
 * their own workspace (src/lib/demo/workspaces.ts); everywhere else it is the instance database.
 */
export async function currentStore(): Promise<Store> {
  return isDemo() ? currentWorkspace() : { db: getDb(), uploadsDir };
}

export async function currentDb() {
  return (await currentStore()).db;
}
