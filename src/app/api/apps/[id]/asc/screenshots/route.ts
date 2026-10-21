import { z } from "zod";
import { DISPLAY_SIZES } from "@/lib/app-store/display-sizes";
import { isAppStoreLocale } from "@/lib/app-store/locales";
import { getApp } from "@/lib/apps/queries";
import { ascClient } from "@/lib/asc/connection";
import { describeError, prepareScreenshotSet } from "@/lib/asc/publish";
import { DEMO_DISABLED_MESSAGE, isDemo } from "@/lib/demo/mode";
import { readImageInfo } from "@/lib/files/image-size";

/**
 * Replaces one App Store Connect screenshot set with PNGs rendered in the browser, so uploads
 * match the preview exactly. The browser calls three steps, one request each:
 *   step=prepare  locale, displayType → { setId, removed }
 *   step=upload   setId, displayType, file → { id }        (once per screenshot)
 *   step=order    setId, ids (JSON array) → { uploaded }
 */
export async function POST(request: Request, ctx: RouteContext<"/api/apps/[id]/asc/screenshots">) {
  if (isDemo()) return Response.json({ error: DEMO_DISABLED_MESSAGE }, { status: 403 });
  const { id } = await ctx.params;
  const app = await getApp(id);
  const client = ascClient();
  if (!app) return Response.json({ error: "App not found" }, { status: 404 });
  if (!client) return Response.json({ error: "Connect App Store Connect first" }, { status: 400 });

  const form = await request.formData();
  const step = form.get("step");
  const display = DISPLAY_SIZES.find((item) => item.type === form.get("displayType"));

  try {
    if (step === "prepare") {
      const locale = String(form.get("locale") ?? "");
      if (!isAppStoreLocale(locale) || !app.locales.includes(locale)) {
        return Response.json({ error: "Unknown locale" }, { status: 400 });
      }
      if (!display) return Response.json({ error: "Unknown display type" }, { status: 400 });
      return Response.json(await prepareScreenshotSet(client, app.bundleId, locale, display.type));
    }

    const setId = String(form.get("setId") ?? "");
    if (!setId) return Response.json({ error: "Missing setId" }, { status: 400 });

    if (step === "upload") {
      const file = form.get("file");
      if (!(file instanceof File)) return Response.json({ error: "Missing file" }, { status: 400 });
      if (!display) return Response.json({ error: "Unknown display type" }, { status: 400 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = readImageInfo(bytes);
      const fits = info && display.sizes.some((size) => size.width === info.width && size.height === info.height);
      if (!fits) return Response.json({ error: `${file.name} is not a ${display.label} screenshot` }, { status: 400 });
      return Response.json({ id: await client.uploadScreenshot(setId, file.name, bytes) });
    }

    if (step === "order") {
      const ids = z.array(z.string()).min(1).max(10).parse(JSON.parse(String(form.get("ids") ?? "[]")));
      await client.orderScreenshots(setId, ids);
      return Response.json({ uploaded: ids.length });
    }

    return Response.json({ error: "Unknown step" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: describeError(error) }, { status: 502 });
  }
}
