/**
 * Renders every template side by side with Node and @napi-rs/canvas, which checks that the
 * renderer works outside the browser. Usage:
 *   npm run render:sheet -- <folder with screenshots> <out.png> [font file]
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { DEFAULT_DESIGN, PALETTES, TEMPLATES, type Design } from "../src/lib/design/model";
import { renderFrame } from "../src/lib/design/render";

const [dir, out, fontFile] = process.argv.slice(2);
if (!dir || !out) {
  console.error("Usage: npm run render:sheet -- <folder with screenshots> <out.png> [font file]");
  process.exit(1);
}

const family = fontFile ? (GlobalFonts.registerFromPath(fontFile, "Sheet"), "Sheet") : "sans-serif";
const shots = fs.readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name));
const W = 1320;
const H = 2868;
const scale = 0.25;
const gap = 12;

const sheet = createCanvas(TEMPLATES.length * (W * scale + gap) + gap, H * scale + gap * 2);
const sheetCtx = sheet.getContext("2d");
sheetCtx.fillStyle = "#1c1c1f";
sheetCtx.fillRect(0, 0, sheet.width, sheet.height);

for (const [index, template] of TEMPLATES.entries()) {
  const file = shots[index % Math.max(shots.length, 1)];
  const image = file ? await loadImage(fs.readFileSync(path.join(dir, file))) : null;
  const canvas = createCanvas(W, H);
  const design: Design = { ...DEFAULT_DESIGN, ...PALETTES[index % PALETTES.length].patch, template: template.id };
  renderFrame(canvas.getContext("2d") as unknown as CanvasRenderingContext2D, {
    width: W,
    height: H,
    design,
    caption: { badge: "Framelane", title: `The *${template.name}* template`, subtitle: template.hint },
    screenshot: image ? { image: image as unknown as CanvasImageSource, width: image.width, height: image.height } : null,
    fontFamily: family,
  });
  sheetCtx.drawImage(canvas, gap + index * (W * scale + gap), gap, W * scale, H * scale);
}

fs.writeFileSync(out, sheet.toBuffer("image/png"));
console.log(`Wrote ${out}`);
