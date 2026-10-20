"use client";

import { useEffect, useState } from "react";
import type { CaptionFontId } from "./model";
import { CAPTION_FONT_FAMILIES } from "@/lib/fonts";

export type LoadedShot = { image: HTMLImageElement; width: number; height: number };

const images = new Map<string, Promise<LoadedShot>>();

export function loadShot(fileId: string): Promise<LoadedShot> {
  let pending = images.get(fileId);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve({ image, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => {
        images.delete(fileId);
        reject(new Error(`Could not load screenshot ${fileId}`));
      };
      image.src = `/api/files/${fileId}`;
    });
    images.set(fileId, pending);
  }
  return pending;
}

export function useShot(fileId: string | undefined): LoadedShot | null {
  const [state, setState] = useState<{ id: string; shot: LoadedShot } | null>(null);
  useEffect(() => {
    if (!fileId) return;
    let alive = true;
    loadShot(fileId).then(
      (shot) => alive && setState({ id: fileId, shot }),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [fileId]);
  return fileId && state?.id === fileId ? state.shot : null;
}

const fonts = new Map<CaptionFontId, Promise<unknown>>();

export function loadCaptionFont(font: CaptionFontId) {
  let pending = fonts.get(font);
  if (!pending) {
    const family = CAPTION_FONT_FAMILIES[font];
    pending = Promise.all(["500", "600", "800"].map((weight) => document.fonts.load(`${weight} 48px ${family}`)));
    fonts.set(font, pending);
  }
  return pending;
}

/** Returns true once the caption font can be drawn onto a canvas. */
export function useCaptionFont(font: CaptionFontId) {
  const [ready, setReady] = useState<CaptionFontId | null>(null);
  useEffect(() => {
    let alive = true;
    loadCaptionFont(font).then(() => alive && setReady(font));
    return () => {
      alive = false;
    };
  }, [font]);
  return ready === font;
}
