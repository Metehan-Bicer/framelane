import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { currentDb } from "@/db";
import { frames } from "@/db/schema";
import type { Caption } from "@/lib/design/model";

export async function listFrames(appId: string) {
  return (await currentDb()).select().from(frames).where(eq(frames.appId, appId)).orderBy(asc(frames.position)).all();
}

export async function getFrame(appId: string, frameId: string) {
  return (await currentDb())
    .select()
    .from(frames)
    .where(and(eq(frames.appId, appId), eq(frames.id, frameId)))
    .get();
}

export async function createFrame(appId: string, locale: string, fileId: string) {
  const db = await currentDb();
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

export async function setFrameShot(appId: string, frameId: string, locale: string, fileId: string) {
  const frame = await getFrame(appId, frameId);
  if (!frame) return undefined;
  return (await currentDb())
    .update(frames)
    .set({ shots: { ...frame.shots, [locale]: fileId } })
    .where(eq(frames.id, frameId))
    .returning()
    .get();
}

export async function setFrameCaption(appId: string, frameId: string, locale: string, caption: Caption) {
  const frame = await getFrame(appId, frameId);
  if (!frame) return undefined;
  return (await currentDb())
    .update(frames)
    .set({ captions: { ...frame.captions, [locale]: caption } })
    .where(eq(frames.id, frameId))
    .returning()
    .get();
}

/** Rewrites positions in the given order. Ids that do not belong to the app are ignored. */
export async function reorderFrames(appId: string, orderedIds: string[]) {
  const db = await currentDb();
  db.transaction((tx) => {
    orderedIds.forEach((id, position) => {
      tx.update(frames)
        .set({ position })
        .where(and(eq(frames.appId, appId), eq(frames.id, id)))
        .run();
    });
  });
}

export async function deleteFrame(appId: string, frameId: string) {
  (await currentDb())
    .delete(frames)
    .where(and(eq(frames.appId, appId), eq(frames.id, frameId)))
    .run();
}
