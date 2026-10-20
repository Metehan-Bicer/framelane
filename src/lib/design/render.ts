import type { Background, Caption, Design, TemplateId } from "./model";
import { parseHighlights, toWords, wrapWords } from "./text";

/**
 * Draws one store screenshot. Everything is expressed relative to the frame width, so the
 * same design renders identically at preview size and at the exact App Store export size.
 * Only the Canvas 2D API is used, which keeps this usable with `@napi-rs/canvas` on the server.
 */
export type RenderInput = {
  width: number;
  height: number;
  design: Design;
  caption: Caption;
  /** The raw app screenshot, or null to draw a placeholder screen. */
  screenshot: { image: CanvasImageSource; width: number; height: number } | null;
  fontFamily: string;
};

type Ctx = CanvasRenderingContext2D;

export function renderFrame(ctx: Ctx, input: RenderInput) {
  const { width: W, height: H, design } = input;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, design.background, W, H);

  TEMPLATE_RENDERERS[design.template](ctx, input);
  ctx.restore();
}

// Templates

function headline(ctx: Ctx, input: RenderInput) {
  const { width: W } = input;
  const y = drawCaption(ctx, input, { x: W / 2, y: W * 0.1, maxWidth: W * 0.86, align: "center" });
  const deviceWidth = W * 0.8;
  drawDevice(ctx, input, { x: (W - deviceWidth) / 2, y: y + W * 0.07, width: deviceWidth, rotate: 0 });
}

function footnote(ctx: Ctx, input: RenderInput) {
  const { width: W, height: H } = input;
  const captionHeight = measureCaption(ctx, input, W * 0.86);
  const captionTop = H - W * 0.1 - captionHeight;
  drawCaption(ctx, input, { x: W / 2, y: captionTop, maxWidth: W * 0.86, align: "center" });
  const deviceWidth = W * 0.8;
  const deviceHeight = deviceSize(input, deviceWidth).height;
  drawDevice(ctx, input, {
    x: (W - deviceWidth) / 2,
    y: captionTop - W * 0.08 - deviceHeight,
    width: deviceWidth,
    rotate: 0,
  });
}

function tilt(ctx: Ctx, input: RenderInput) {
  const { width: W } = input;
  const y = drawCaption(ctx, input, { x: W * 0.08, y: W * 0.11, maxWidth: W * 0.8, align: "left" });
  const deviceWidth = W * 0.78;
  drawDevice(ctx, input, { x: W * 0.2, y: y + W * 0.1, width: deviceWidth, rotate: -9 });
}

function bleed(ctx: Ctx, input: RenderInput) {
  const { width: W, height: H, design, screenshot } = input;
  if (screenshot) {
    const scale = Math.max(W / screenshot.width, H / screenshot.height);
    const w = screenshot.width * scale;
    const h = screenshot.height * scale;
    ctx.drawImage(screenshot.image, (W - w) / 2, (H - h) / 2, w, h);
  } else {
    drawPlaceholder(ctx, 0, 0, W, H, design.textColor);
  }
  const fadeColor = design.background.kind === "solid" ? design.background.color : design.background.to;
  const fade = ctx.createLinearGradient(0, H * 0.42, 0, H);
  fade.addColorStop(0, withAlpha(fadeColor, 0));
  fade.addColorStop(0.45, withAlpha(fadeColor, 0.88));
  fade.addColorStop(1, withAlpha(fadeColor, 1));
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  const captionHeight = measureCaption(ctx, input, W * 0.84);
  drawCaption(ctx, input, { x: W / 2, y: H - W * 0.12 - captionHeight, maxWidth: W * 0.84, align: "center" });
}

const TEMPLATE_RENDERERS: Record<TemplateId, (ctx: Ctx, input: RenderInput) => void> = {
  headline,
  footnote,
  tilt,
  bleed,
};

// Caption

type CaptionBox = { x: number; y: number; maxWidth: number; align: "left" | "center" };

function captionMetrics(W: number) {
  return {
    badgeSize: W * 0.032,
    badgeHeight: W * 0.068,
    badgeGap: W * 0.045,
    titleSize: W * 0.088,
    titleLeading: 1.06,
    subtitleGap: W * 0.035,
    subtitleSize: W * 0.04,
    subtitleLeading: 1.36,
  };
}

function measureCaption(ctx: Ctx, input: RenderInput, maxWidth: number) {
  ctx.save();
  const height = drawCaption(ctx, input, { x: 0, y: 0, maxWidth, align: "left" }, false);
  ctx.restore();
  return height;
}

/** Draws badge, title and subtitle. Returns the y coordinate below the caption. */
function drawCaption(ctx: Ctx, input: RenderInput, box: CaptionBox, paint = true): number {
  const { design, caption, fontFamily, width: W } = input;
  const m = captionMetrics(W);
  let y = box.y;

  if (design.showBadge && caption.badge.trim()) {
    ctx.font = `600 ${m.badgeSize}px ${fontFamily}`;
    const dot = m.badgeHeight * 0.22;
    const padX = m.badgeHeight * 0.42;
    const textWidth = ctx.measureText(caption.badge).width;
    const badgeWidth = padX * 2 + dot * 2 + textWidth;
    const bx = box.align === "center" ? box.x - badgeWidth / 2 : box.x;
    if (paint) {
      ctx.beginPath();
      ctx.roundRect(bx, y, badgeWidth, m.badgeHeight, m.badgeHeight / 2);
      ctx.fillStyle = withAlpha(design.textColor, 0.1);
      ctx.fill();
      ctx.lineWidth = Math.max(1, W * 0.0015);
      ctx.strokeStyle = withAlpha(design.textColor, 0.16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx + padX + dot / 2, y + m.badgeHeight / 2, dot / 2, 0, Math.PI * 2);
      ctx.fillStyle = design.accentColor;
      ctx.fill();
      ctx.fillStyle = design.textColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(caption.badge, bx + padX + dot * 2, y + m.badgeHeight / 2 + m.badgeSize * 0.04);
    }
    y += m.badgeHeight + m.badgeGap;
  }

  if (caption.title.trim()) {
    y = drawRichText(ctx, caption.title, {
      ...box,
      y,
      size: m.titleSize,
      weight: 800,
      leading: m.titleLeading,
      color: design.textColor,
      accent: design.accentColor,
      fontFamily,
      tracking: -0.02,
      paint,
    });
  }

  if (caption.subtitle.trim()) {
    y += m.subtitleGap;
    y = drawRichText(ctx, caption.subtitle, {
      ...box,
      maxWidth: box.maxWidth * 0.92,
      y,
      size: m.subtitleSize,
      weight: 500,
      leading: m.subtitleLeading,
      color: withAlpha(design.textColor, 0.74),
      accent: design.textColor,
      fontFamily,
      tracking: 0,
      paint,
    });
  }

  return y;
}

type RichTextOptions = CaptionBox & {
  size: number;
  weight: number;
  leading: number;
  color: string;
  accent: string;
  fontFamily: string;
  tracking: number;
  paint: boolean;
};

function drawRichText(ctx: Ctx, text: string, o: RichTextOptions): number {
  ctx.font = `${o.weight} ${o.size}px ${o.fontFamily}`;
  ctx.letterSpacing = `${o.tracking * o.size}px`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  const measure = (value: string) => ctx.measureText(value).width;
  const lines = wrapWords(toWords(parseHighlights(text)), o.maxWidth, measure);
  const space = measure(" ");
  const lineHeight = o.size * o.leading;

  lines.forEach((line, index) => {
    if (!o.paint) return;
    const lineWidth = line.reduce((sum, word) => sum + measure(word.text), 0) + space * (line.length - 1);
    let x = o.align === "center" ? o.x - lineWidth / 2 : o.x;
    const baseline = o.y + lineHeight * index + o.size * 0.86;
    for (const word of line) {
      ctx.fillStyle = word.highlight ? o.accent : o.color;
      ctx.fillText(word.text, x, baseline);
      x += measure(word.text) + space;
    }
  });

  ctx.letterSpacing = "0px";
  return o.y + lineHeight * lines.length;
}

// Device

const SCREEN_FALLBACK = { width: 1320, height: 2868 };

function deviceSize(input: RenderInput, width: number) {
  const shot = input.screenshot ?? SCREEN_FALLBACK;
  if (input.design.device === "none") return { width, height: width * (shot.height / shot.width), bezel: 0 };
  const bezel = width * 0.04;
  const screenWidth = width - bezel * 2;
  return { width, height: screenWidth * (shot.height / shot.width) + bezel * 2, bezel };
}

type DeviceBox = { x: number; y: number; width: number; rotate: number };

function drawDevice(ctx: Ctx, input: RenderInput, box: DeviceBox) {
  const { design, screenshot } = input;
  const { width, height, bezel } = deviceSize(input, box.width);
  const radius = width * (design.device === "none" ? 0.085 : 0.165);

  ctx.save();
  ctx.translate(box.x + width / 2, box.y + height / 2);
  ctx.rotate((box.rotate * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  // Soft drop shadow under the whole body.
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = width * 0.09;
  ctx.shadowOffsetY = width * 0.035;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = design.device === "silver" ? "#c9ccd2" : "#0d0e10";
  ctx.fill();
  ctx.restore();

  if (design.device !== "none") {
    const metal = design.device === "silver" ? ["#f4f5f7", "#aeb2ba"] : ["#4a4d55", "#17181b"];
    const band = width * 0.011;

    // Side buttons sit just outside the band.
    ctx.fillStyle = metal[1];
    const button = (x: number, y: number, h: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, band * 1.1, h, band * 0.5);
      ctx.fill();
    };
    button(-band * 0.8, height * 0.17, height * 0.045);
    button(-band * 0.8, height * 0.25, height * 0.075);
    button(-band * 0.8, height * 0.34, height * 0.075);
    button(width - band * 0.3, height * 0.27, height * 0.11);

    const edge = ctx.createLinearGradient(0, 0, width, height);
    edge.addColorStop(0, metal[0]);
    edge.addColorStop(0.5, metal[1]);
    edge.addColorStop(1, metal[0]);
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fillStyle = edge;
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(band, band, width - band * 2, height - band * 2, radius - band);
    ctx.fillStyle = "#050506";
    ctx.fill();
  }

  const sx = bezel;
  const sy = bezel;
  const sw = width - bezel * 2;
  const sh = height - bezel * 2;
  const screenRadius = design.device === "none" ? radius : radius - bezel * 0.92;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, screenRadius);
  ctx.clip();
  if (screenshot) ctx.drawImage(screenshot.image, sx, sy, sw, sh);
  else drawPlaceholder(ctx, sx, sy, sw, sh, design.textColor);
  ctx.restore();

  if (design.device !== "none") {
    // Dynamic Island.
    const islandWidth = sw * 0.3;
    const islandHeight = sw * 0.088;
    ctx.beginPath();
    ctx.roundRect(sx + (sw - islandWidth) / 2, sy + sw * 0.03, islandWidth, islandHeight, islandHeight / 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
  }

  ctx.restore();
}

function drawPlaceholder(ctx: Ctx, x: number, y: number, w: number, h: number, ink: string) {
  ctx.save();
  ctx.fillStyle = "#16171a";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = withAlpha(ink, 0.07);
  ctx.lineWidth = w * 0.012;
  for (let i = -h; i < w + h; i += w * 0.09) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }
  ctx.fillStyle = withAlpha("#ffffff", 0.45);
  ctx.font = `500 ${w * 0.05}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Drop a screenshot", x + w / 2, y + h / 2);
  ctx.restore();
}

// Helpers

function paintBackground(ctx: Ctx, background: Background, W: number, H: number) {
  if (background.kind === "solid") {
    ctx.fillStyle = background.color;
  } else {
    // CSS angle convention: 0deg points up, 180deg points down.
    const rad = ((background.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
    const gradient = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
    gradient.addColorStop(0, background.from);
    gradient.addColorStop(1, background.to);
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, W, H);
}

export function withAlpha(hex: string, alpha: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
