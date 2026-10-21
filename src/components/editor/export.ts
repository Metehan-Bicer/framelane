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

/**
 * Renders every frame for every locale at the exact App Store size and returns a zip:
 * `<locale>/<display>/01.png`, the layout fastlane `deliver` expects to upload.
 */
export async function exportScreenshots({ app, frames, locales, design, display, onProgress }: ExportInput) {
  const size = display.sizes[0];
  await loadCaptionFont(design.font);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const entries: Record<string, Uint8Array> = {};
  const total = frames.length * locales.length;
  let done = 0;

  for (const locale of locales) {
    for (const [index, frame] of frames.entries()) {
      const fileId = shotFor(frame, locale, app.primaryLocale);
      const screenshot = fileId ? await loadShot(fileId) : null;
      renderFrame(ctx, {
        width: size.width,
        height: size.height,
        design,
        caption: captionFor(frame, locale),
        screenshot,
        fontFamily: CAPTION_FONT_FAMILIES[design.font],
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG encoding failed"))), "image/png"),
      );
      const name = `${locale}/${display.type}/${String(index + 1).padStart(2, "0")}.png`;
      entries[name] = new Uint8Array(await blob.arrayBuffer());
      onProgress(++done, total);
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
