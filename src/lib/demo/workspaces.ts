import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { openDb, type Db } from "@/db/open";
import { dataDir } from "@/lib/paths";
import { seedDemo } from "./seed";

/**
 * Public demo workspaces. Each visitor gets a private copy of the Daybook demo the first time
 * they open the site, keyed by a cookie (set in src/proxy.ts). Nobody sees anyone else's apps.
 * A workspace is removed after WORKSPACE_TTL_DAYS without use, or when its owner starts over.
 */
export const WORKSPACE_COOKIE = "framelane-demo";
export const WORKSPACE_TTL_DAYS = 7;
const TTL_MS = WORKSPACE_TTL_DAYS * 24 * 60 * 60 * 1000;
/** Upper bound on stored workspaces; the least recently used go first. */
const MAX_WORKSPACES = 2000;
/** Upload room per workspace, including the demo's own screenshots. */
export const WORKSPACE_UPLOAD_LIMIT = 100 * 1024 * 1024;
/** Open SQLite handles kept in memory; the least recently used are closed. */
const MAX_OPEN = 40;

const ID = /^[0-9a-f-]{36}$/;
/** The copy that first page views are read from; nothing writes to it. */
const SHARED = "shared";

export const isWorkspaceId = (id: string | undefined): id is string => !!id && ID.test(id);

export const workspacesDir = () => path.join(dataDir, "demo");
const dirOf = (id: string) => path.join(workspacesDir(), id);
const LAST_USED = ".last-used";

export type Store = { db: Db; uploadsDir: string };
type Open = Store & { touchedAt: number };
const globalForWorkspaces = globalThis as unknown as { framelaneWorkspaces?: Map<string, Open> };
const open = (globalForWorkspaces.framelaneWorkspaces ??= new Map());

export async function currentWorkspace(): Promise<Store> {
  // A first page view (marked by src/proxy.ts) is read from the shared copy; the visitor's own copy is
  // created on their next request, once the browser sends the cookie back.
  if ((await headers()).get("x-framelane-first-visit")) return workspace(SHARED);
  const id = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  return workspace(isWorkspaceId(id) ? id : SHARED);
}

export function workspace(id: string): Store {
  let entry = open.get(id);
  if (entry) {
    open.delete(id); // re-insert to keep the map in least-recently-used order
  } else {
    const dir = dirOf(id);
    const fresh = !fs.existsSync(path.join(dir, "framelane.db"));
    const db = openDb(dir);
    const uploadsDir = path.join(dir, "uploads");
    if (fresh) seedDemo(db, uploadsDir, path.join(process.cwd(), "demo/screens"));
    entry = { db, uploadsDir, touchedAt: 0 };
    while (open.size >= MAX_OPEN) close(open.keys().next().value!);
  }
  open.set(id, entry);
  // Record activity at most once a minute.
  if (Date.now() - entry.touchedAt > 60_000) {
    entry.touchedAt = Date.now();
    fs.writeFileSync(path.join(dirOf(id), LAST_USED), "");
  }
  return entry;
}

function close(id: string) {
  open.get(id)?.db.close();
  open.delete(id);
}

/** Bytes stored in a workspace's upload folder. */
export function uploadedBytes(uploadsDir: string) {
  if (!fs.existsSync(uploadsDir)) return 0;
  return fs.readdirSync(uploadsDir).reduce((sum, name) => sum + fs.statSync(path.join(uploadsDir, name)).size, 0);
}

/** Deletes a workspace; the next request from its owner starts again from Daybook. */
export function removeWorkspace(id: string) {
  close(id);
  fs.rmSync(dirOf(id), { recursive: true, force: true });
}

/** Removes workspaces unused for WORKSPACE_TTL_DAYS, and the oldest ones above MAX_WORKSPACES. */
export function cleanUpWorkspaces(root = workspacesDir(), now = Date.now(), remove = removeWorkspace) {
  if (!fs.existsSync(root)) return [];
  const all = fs
    .readdirSync(root)
    .map((id) => {
      const marker = path.join(root, id, LAST_USED);
      const used = fs.existsSync(marker) ? fs.statSync(marker).mtimeMs : fs.statSync(path.join(root, id)).mtimeMs;
      return { id, used };
    })
    .sort((a, b) => b.used - a.used);
  const expired = all.filter((w, i) => now - w.used > TTL_MS || i >= MAX_WORKSPACES).map((w) => w.id);
  for (const id of expired) remove(id);
  return expired;
}
