import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apps } from "@/db/schema";
import { storeScreenshot, UploadError } from "@/lib/files/storage";
import { createFrame, setFrameShot } from "@/lib/frames/queries";

/**
 * Uploads raw screenshots. Without `frameId`, every file becomes a new frame for `locale`.
 * With `frameId`, the single file replaces that frame's screenshot for `locale`.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/apps/[id]/frames">) {
  const { id: appId } = await ctx.params;
  const app = getDb().select().from(apps).where(eq(apps.id, appId)).get();
  if (!app) return Response.json({ error: "App not found" }, { status: 404 });

  const form = await request.formData();
  const locale = String(form.get("locale") ?? app.primaryLocale);
  if (!app.locales.includes(locale)) return Response.json({ error: "Unknown locale" }, { status: 400 });
  const frameId = form.get("frameId");
  const uploads = form.getAll("files").filter((value): value is File => value instanceof File);
  if (uploads.length === 0) return Response.json({ error: "No files" }, { status: 400 });

  try {
    if (typeof frameId === "string" && frameId) {
      const file = await storeScreenshot(appId, uploads[0]);
      const frame = setFrameShot(appId, frameId, locale, file.id);
      if (!frame) return Response.json({ error: "Frame not found" }, { status: 404 });
      return Response.json({ frames: [frame], files: [file] });
    }

    const created = [];
    const stored = [];
    for (const upload of uploads) {
      const file = await storeScreenshot(appId, upload);
      stored.push(file);
      created.push(createFrame(appId, locale, file.id));
    }
    return Response.json({ frames: created, files: stored });
  } catch (error) {
    if (error instanceof UploadError) return Response.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
