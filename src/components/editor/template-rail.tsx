"use client";

import { motion } from "motion/react";
import { FrameCanvas } from "@/components/frame-canvas";
import { PALETTES, TEMPLATES, type Caption, type Design } from "@/lib/design/model";

type Props = {
  design: Design;
  onDesign: (patch: Partial<Design>) => void;
  caption?: Caption;
  fileId?: string;
  size: { width: number; height: number };
};

const SAMPLE: Caption = { badge: "New", title: "Your *headline* here", subtitle: "A short line that sells it." };

/** Live previews of the current frame in every template, plus one-click palettes. */
export function TemplateRail({ design, onDesign, caption, fileId, size }: Props) {
  // Empty captions would make every preview look the same, so fill the gaps with sample text.
  const previewCaption = caption?.title.trim() ? caption : { ...SAMPLE, ...(caption ? nonEmpty(caption) : {}) };

  return (
    <aside className="scrollbar-none w-[248px] shrink-0 overflow-y-auto rounded-2xl border border-line bg-panel px-4 py-5 shadow-soft">
      <SectionTitle>Template</SectionTitle>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
        {TEMPLATES.map((template) => {
          const active = template.id === design.template;
          return (
            <button
              key={template.id}
              onClick={() => onDesign({ template: template.id })}
              className="group flex flex-col items-center"
              aria-pressed={active}
              title={template.hint}
            >
              <div className="relative w-[82px] overflow-hidden rounded-[10px] shadow-soft">
                <FrameCanvas
                  design={{ ...design, template: template.id }}
                  caption={previewCaption}
                  fileId={fileId}
                  size={size}
                  className="transition duration-300 group-hover:scale-[1.03]"
                />
                {active && (
                  <motion.span
                    layoutId="template-ring"
                    className="pointer-events-none absolute inset-0 rounded-[10px] ring-2 ring-accent ring-inset"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </div>
              <p className={`mt-1.5 text-xs ${active ? "text-ink" : "text-ink-3 group-hover:text-ink-2"}`}>
                {template.name}
              </p>
            </button>
          );
        })}
      </div>

      <SectionTitle className="mt-7">Palette</SectionTitle>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PALETTES.map((palette) => {
          const bg =
            palette.patch.background.kind === "solid"
              ? palette.patch.background.color
              : `linear-gradient(${palette.patch.background.angle}deg, ${palette.patch.background.from}, ${palette.patch.background.to})`;
          const active =
            JSON.stringify(palette.patch.background) === JSON.stringify(design.background) &&
            palette.patch.accentColor === design.accentColor;
          return (
            <button
              key={palette.name}
              onClick={() => onDesign(palette.patch)}
              aria-pressed={active}
              className="group rounded-xl border border-line p-1 text-left transition hover:border-line-strong aria-pressed:border-accent aria-pressed:ring-4 aria-pressed:ring-accent-soft"
            >
              <span className="flex h-10 items-end justify-between rounded-lg p-1.5" style={{ background: bg }}>
                <span className="text-[13px] font-bold leading-none" style={{ color: palette.patch.textColor }}>
                  Aa
                </span>
                <span className="size-2 rounded-full" style={{ background: palette.patch.accentColor }} />
              </span>
              <span className="mt-1 block px-0.5 text-[11px] text-ink-3 group-aria-pressed:text-ink">{palette.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xs font-semibold text-ink ${className}`}>{children}</h2>;
}

function nonEmpty(caption: Caption): Partial<Caption> {
  return Object.fromEntries(Object.entries(caption).filter(([, value]) => value.trim())) as Partial<Caption>;
}
