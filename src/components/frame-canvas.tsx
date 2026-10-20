"use client";

import { useEffect, useRef, useState } from "react";
import type { Caption, Design } from "@/lib/design/model";
import { renderFrame } from "@/lib/design/render";
import { useCaptionFont, useShot } from "@/lib/design/client-assets";
import { CAPTION_FONT_FAMILIES } from "@/lib/fonts";

type Props = {
  design: Design;
  caption: Caption;
  fileId?: string;
  size: { width: number; height: number };
  className?: string;
};

/** Renders one frame at the size of its container, sharp on high density screens. */
export function FrameCanvas({ design, caption, fileId, size, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cssWidth, setCssWidth] = useState(0);
  const shot = useShot(fileId);
  const fontReady = useCaptionFont(design.font);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => setCssWidth(entry.contentRect.width));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssWidth === 0) return;
    const scale = (cssWidth * window.devicePixelRatio) / size.width;
    canvas.width = Math.round(size.width * scale);
    canvas.height = Math.round(size.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    renderFrame(ctx, {
      width: size.width,
      height: size.height,
      design,
      caption,
      screenshot: shot,
      fontFamily: fontReady ? CAPTION_FONT_FAMILIES[design.font] : "system-ui, sans-serif",
    });
  }, [cssWidth, size.width, size.height, design, caption, shot, fontReady]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ aspectRatio: `${size.width} / ${size.height}`, width: "100%", display: "block" }}
    />
  );
}
