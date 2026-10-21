"use client";

import { zipSync } from "fflate";
import type { DisplaySize } from "@/lib/app-store/display-sizes";
import type { Design } from "@/lib/design/model";
import { renderFrame } from "@/lib/design/render";
import { loadCaptionFont, loadShot } from "@/lib/design/client-assets";
import { CAPTION_FONT_FAMILIES } from "@/lib/fonts";
import { captionFor, shotFor, type EditorApp, type EditorFrame } from "./types";
import { slug } from "@/lib/slug";

type ExportInput = {
  app: EditorApp;
  frames: EditorFrame[];
  locales: string[];
  design: Design;
  display: DisplaySize;
  onProgress: (done: number, total: number) => void;
};

type SetInput = {
  app: EditorApp;
  frames: EditorFrame[];
  locale: string;
  design: Design;
  display: DisplaySize;
  onFrame?: () => void;
};

/** Renders one language's frames as PNGs at the exact App Store size, in order. */
export async function renderScreenshotSet({ app, frames, locale, design, display, onFrame }: SetInput) {
  const size = display.sizes[0];
  await loadCaptionFont(design.font);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const pngs: Blob[] = [];
  for (const frame of frames) {
    const fileId = shotFor(frame, locale, app.primaryLocale);
    renderFrame(ctx, {
      width: size.width,
      height: size.height,
      design,
      caption: captionFor(frame, locale),
      screenshot: fileId ? await loadShot(fileId) : null,
      fontFamily: CAPTION_FONT_FAMILIES[design.font],
    });
    pngs.push(
      await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG encoding failed"))), "image/png"),
      ),
    );
    onFrame?.();
  }
  return pngs;
}

/**
 * Renders every frame for every locale and downloads a zip laid out as
 * `<locale>/<display>/01.png`.
 */
export async function exportScreenshots({ app, frames, locales, design, display, onProgress }: ExportInput) {
  const entries: Record<string, Uint8Array> = {};
  const total = frames.length * locales.length;
  let done = 0;
  for (const locale of locales) {
    const pngs = await renderScreenshotSet({
      app,
      frames,
      locale,
      design,
      display,
      onFrame: () => onProgress(++done, total),
    });
    for (const [index, png] of pngs.entries()) {
      entries[`${locale}/${display.type}/${String(index + 1).padStart(2, "0")}.png`] = new Uint8Array(await png.arrayBuffer());
    }
  }

  // PNGs are already compressed, storing them keeps the zip fast to build.
  const zip = zipSync(entries, { level: 0 });
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug(app.name)}-${display.type.toLowerCase()}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
