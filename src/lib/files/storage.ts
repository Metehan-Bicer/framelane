import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { files } from "@/db/schema";
import { uploadsDir } from "@/lib/paths";
import { readImageInfo } from "./image-size";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export class UploadError extends Error {}

export async function storeScreenshot(appId: string, file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name} is larger than 20 MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = readImageInfo(bytes);
  if (!info) throw new UploadError(`${file.name} is not a PNG or JPEG image`);

  const id = crypto.randomUUID();
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, id), bytes);
  return getDb()
    .insert(files)
    .values({ id, appId, ...info })
    .returning()
    .get();
}

export async function readStoredFile(id: string) {
  const record = getDb().select().from(files).where(eq(files.id, id)).get();
  if (!record) return null;
  const bytes = await fs.readFile(path.join(uploadsDir, record.id));
  return { record, bytes };
}

export function getFileRecords(appId: string) {
  return getDb().select().from(files).where(eq(files.appId, appId)).all();
}
