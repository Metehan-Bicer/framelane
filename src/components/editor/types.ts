import { DISPLAY_SIZES } from "@/lib/app-store/display-sizes";
import { EMPTY_CAPTION, type Caption, type Design } from "@/lib/design/model";

/** iPad needs its own screenshots and device art, so the editor exports iPhone sets for now. */
export const EXPORTABLE_DISPLAYS = DISPLAY_SIZES.filter((display) => display.device === "iphone");

export type EditorApp = {
  id: string;
  name: string;
  bundleId: string;
  primaryLocale: string;
  locales: string[];
};

export type EditorFrame = {
  id: string;
  captions: Record<string, Caption>;
  shots: Record<string, string>;
};

export type EditorState = {
  design: Design;
  frames: EditorFrame[];
  locales: string[];
  locale: string;
  selectedId: string | null;
};

export function captionFor(frame: EditorFrame, locale: string): Caption {
  return frame.captions[locale] ?? EMPTY_CAPTION;
}

/** A locale without its own screenshot reuses the primary one, then any other. */
export function shotFor(frame: EditorFrame, locale: string, primaryLocale: string): string | undefined {
  return frame.shots[locale] ?? frame.shots[primaryLocale] ?? Object.values(frame.shots)[0];
}
