import { DISPLAY_SIZES } from "@/lib/app-store/display-sizes";
import { isAppStoreLocale } from "@/lib/app-store/locales";
import { getApp } from "@/lib/apps/queries";
import { ascClient } from "@/lib/asc/connection";
import { describeError, replaceScreenshots } from "@/lib/asc/publish";
import { readImageInfo } from "@/lib/files/image-size";

/**
 * Replaces one App Store Connect screenshot set with the PNGs rendered in the browser.
 * The browser renders so uploads match the preview exactly, fonts included.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/apps/[id]/asc/screenshots">) {
  const { id } = await ctx.params;
  const app = await getApp(id);
  const client = ascClient();
  if (!app) return Response.json({ error: "App not found" }, { status: 404 });
  if (!client) return Response.json({ error: "Connect App Store Connect first" }, { status: 400 });

  const form = await request.formData();
  const locale = String(form.get("locale") ?? "");
  const displayType = String(form.get("displayType") ?? "");
  const display = DISPLAY_SIZES.find((item) => item.type === displayType);
  if (!isAppStoreLocale(locale) || !app.locales.includes(locale)) {
    return Response.json({ error: "Unknown locale" }, { status: 400 });
  }
  if (!display) return Response.json({ error: "Unknown display type" }, { status: 400 });

  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0 || files.length > 10) {
    return Response.json({ error: "Send between 1 and 10 screenshots" }, { status: 400 });
  }
  const images = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const info = readImageInfo(bytes);
    const fits = info && display.sizes.some((size) => size.width === info.width && size.height === info.height);
    if (!fits) return Response.json({ error: `${file.name} is not a ${display.label} screenshot` }, { status: 400 });
    images.push({ name: file.name, bytes });
  }

  try {
    return Response.json(await replaceScreenshots(client, app.bundleId, locale, displayType, images));
  } catch (error) {
    return Response.json({ error: describeError(error) }, { status: 502 });
  }
}
