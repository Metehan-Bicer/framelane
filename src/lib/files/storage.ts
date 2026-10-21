import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { currentStore } from "@/db";
import { isDemo } from "@/lib/demo/mode";
import { uploadedBytes, WORKSPACE_UPLOAD_LIMIT } from "@/lib/demo/workspaces";
import { files } from "@/db/schema";
import { readImageInfo } from "./image-size";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export class UploadError extends Error {}

export async function storeScreenshot(appId: string, file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name} is larger than 20 MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = readImageInfo(bytes);
  if (!info) throw new UploadError(`${file.name} is not a PNG or JPEG image`);

  const id = crypto.randomUUID();
  const { db, uploadsDir } = await currentStore();
  if (isDemo() && uploadedBytes(uploadsDir) + bytes.length > WORKSPACE_UPLOAD_LIMIT) {
    throw new UploadError("Your demo copy is full (100 MB of screenshots). Use Start over in the banner to begin again.");
  }
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, id), bytes);
  return db
    .insert(files)
    .values({ id, appId, ...info })
    .returning()
    .get();
}

export async function readStoredFile(id: string) {
  const { db, uploadsDir } = await currentStore();
  const record = db.select().from(files).where(eq(files.id, id)).get();
  if (!record) return null;
  const bytes = await fs.readFile(path.join(uploadsDir, record.id));
  return { record, bytes };
}

export async function getFileRecords(appId: string) {
  return (await currentStore()).db.select().from(files).where(eq(files.appId, appId)).all();
}
