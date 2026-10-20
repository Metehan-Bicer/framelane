import { Bricolage_Grotesque, Fraunces, Geist, Geist_Mono, Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import type { CaptionFontId } from "@/lib/design/model";

// Interface fonts.
export const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
export const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Caption fonts drawn onto screenshots. Loaded on demand by the canvas renderer.
const inter = Inter({ subsets: ["latin", "latin-ext"], preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], preload: false });
const space = Space_Grotesk({ subsets: ["latin", "latin-ext"], preload: false });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], preload: false });

export const CAPTION_FONT_FAMILIES: Record<CaptionFontId, string> = {
  inter: inter.style.fontFamily,
  bricolage: bricolage.style.fontFamily,
  jakarta: jakarta.style.fontFamily,
  space: space.style.fontFamily,
  fraunces: fraunces.style.fontFamily,
};

/** Class names that make every caption font's @font-face available on the page. */
export const captionFontClasses = [inter, bricolage, jakarta, space, fraunces].map((font) => font.className).join(" ");
