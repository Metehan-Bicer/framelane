import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { frames } from "@/db/schema";
import type { Caption } from "@/lib/design/model";

export function listFrames(appId: string) {
  return getDb().select().from(frames).where(eq(frames.appId, appId)).orderBy(asc(frames.position)).all();
}

export function getFrame(appId: string, frameId: string) {
  return getDb()
    .select()
    .from(frames)
    .where(and(eq(frames.appId, appId), eq(frames.id, frameId)))
    .get();
}

export function createFrame(appId: string, locale: string, fileId: string) {
  const db = getDb();
  const { next } = db
    .select({ next: sql<number>`coalesce(max(${frames.position}) + 1, 0)` })
    .from(frames)
    .where(eq(frames.appId, appId))
    .get()!;
  return db
    .insert(frames)
    .values({ id: crypto.randomUUID(), appId, position: next, shots: { [locale]: fileId } })
    .returning()
    .get();
}

export function setFrameShot(appId: string, frameId: string, locale: string, fileId: string) {
  const frame = getFrame(appId, frameId);
  if (!frame) return undefined;
  return getDb()
    .update(frames)
    .set({ shots: { ...frame.shots, [locale]: fileId } })
    .where(eq(frames.id, frameId))
    .returning()
    .get();
}

export function setFrameCaption(appId: string, frameId: string, locale: string, caption: Caption) {
  const frame = getFrame(appId, frameId);
  if (!frame) return undefined;
  return getDb()
    .update(frames)
    .set({ captions: { ...frame.captions, [locale]: caption } })
    .where(eq(frames.id, frameId))
    .returning()
    .get();
}

/** Rewrites positions in the given order. Ids that do not belong to the app are ignored. */
export function reorderFrames(appId: string, orderedIds: string[]) {
  const db = getDb();
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(frames)
        .set({ position })
        .where(and(eq(frames.appId, appId), eq(frames.id, id)))
        .run();
    });
  });
}

export function deleteFrame(appId: string, frameId: string) {
  getDb()
    .delete(frames)
    .where(and(eq(frames.appId, appId), eq(frames.id, frameId)))
    .run();
}
