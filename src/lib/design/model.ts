import { z } from "zod";

export const TEMPLATES = [
  { id: "headline", name: "Headline", hint: "Caption on top, device rises from the bottom" },
  { id: "footnote", name: "Footnote", hint: "Device hangs from the top, caption below" },
  { id: "tilt", name: "Tilt", hint: "Angled device with a left aligned caption" },
  { id: "bleed", name: "Full bleed", hint: "Screenshot edge to edge, caption on a fade" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const CAPTION_FONTS = [
  { id: "inter", name: "Inter" },
  { id: "bricolage", name: "Bricolage" },
  { id: "jakarta", name: "Jakarta" },
  { id: "space", name: "Space Grotesk" },
  { id: "fraunces", name: "Fraunces" },
] as const;

export type CaptionFontId = (typeof CAPTION_FONTS)[number]["id"];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const backgroundSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("solid"), color: hex }),
  z.object({ kind: z.literal("gradient"), from: hex, to: hex, angle: z.number().min(0).max(360) }),
]);

export type Background = z.infer<typeof backgroundSchema>;

export const designSchema = z.object({
  template: z.enum(TEMPLATES.map((t) => t.id) as [TemplateId, ...TemplateId[]]),
  background: backgroundSchema,
  textColor: hex,
  accentColor: hex,
  font: z.enum(CAPTION_FONTS.map((f) => f.id) as [CaptionFontId, ...CaptionFontId[]]),
  device: z.enum(["midnight", "silver", "none"]),
  showBadge: z.boolean(),
});

export type Design = z.infer<typeof designSchema>;

export const DEFAULT_DESIGN: Design = {
  template: "headline",
  background: { kind: "gradient", from: "#1d3b36", to: "#0b1715", angle: 180 },
  textColor: "#f4f1ea",
  accentColor: "#ff9f5a",
  font: "bricolage",
  device: "midnight",
  showBadge: true,
};

/** Hand picked palettes shown as one-click swatches in the inspector. */
export const PALETTES: ReadonlyArray<{ name: string; patch: Pick<Design, "background" | "textColor" | "accentColor"> }> =
  [
    {
      name: "Pine",
      patch: {
        background: { kind: "gradient", from: "#1d3b36", to: "#0b1715", angle: 180 },
        textColor: "#f4f1ea",
        accentColor: "#ff9f5a",
      },
    },
    {
      name: "Apricot",
      patch: {
        background: { kind: "gradient", from: "#ffe3cf", to: "#f6b38f", angle: 160 },
        textColor: "#3a1d10",
        accentColor: "#e0531f",
      },
    },
    {
      name: "Paper",
      patch: { background: { kind: "solid", color: "#f3efe6" }, textColor: "#16130f", accentColor: "#2f6bff" },
    },
    {
      name: "Ink",
      patch: {
        background: { kind: "gradient", from: "#22262e", to: "#0a0b0d", angle: 200 },
        textColor: "#ffffff",
        accentColor: "#c7f36b",
      },
    },
    {
      name: "Lilac",
      patch: {
        background: { kind: "gradient", from: "#e9e2ff", to: "#b9a8f5", angle: 170 },
        textColor: "#1f1442",
        accentColor: "#6a3df0",
      },
    },
    {
      name: "Ocean",
      patch: {
        background: { kind: "gradient", from: "#0f4c81", to: "#061a33", angle: 190 },
        textColor: "#eaf4ff",
        accentColor: "#5ee1ff",
      },
    },
  ];

export const captionSchema = z.object({
  badge: z.string().max(40).default(""),
  title: z.string().max(80).default(""),
  subtitle: z.string().max(160).default(""),
});

export type Caption = z.infer<typeof captionSchema>;

export const EMPTY_CAPTION: Caption = { badge: "", title: "", subtitle: "" };

export function parseDesign(value: unknown): Design {
  const parsed = designSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_DESIGN;
}
