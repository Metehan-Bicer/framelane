"use client";

import { RefreshCw } from "lucide-react";
import { useRef } from "react";
import { countCharacters } from "@/lib/app-store/metadata";
import { CAPTION_FONTS, type Background, type Caption, type Design } from "@/lib/design/model";
import { CAPTION_FONT_FAMILIES } from "@/lib/fonts";
import { SectionTitle } from "./template-rail";
import { captionFor, type EditorFrame } from "./types";

type Props = {
  design: Design;
  onDesign: (patch: Partial<Design>) => void;
  frame: EditorFrame | null;
  locale: string;
  primaryLocale: string;
  onCaption: (frameId: string, patch: Partial<Caption>) => void;
  onReplaceShot: (file: File) => void;
  missingCaptions: number;
  frameCount: number;
};

export function Inspector(props: Props) {
  const { design, onDesign, frame, locale, primaryLocale } = props;
  const caption = frame ? captionFor(frame, locale) : null;
  const primary = frame ? captionFor(frame, primaryLocale) : null;
  const ownShot = frame ? Boolean(frame.shots[locale]) : false;

  return (
    <aside className="scrollbar-none w-[300px] shrink-0 overflow-y-auto rounded-2xl border border-line bg-panel shadow-soft" aria-label="Inspector">
      <Section title="Caption" aside={<span className="rounded-md bg-raised px-1.5 py-0.5 font-mono text-[10px] text-ink-2">{locale}</span>}>
        {frame && caption ? (
          <div className="grid gap-3">
            <TextField
              label="Badge"
              value={caption.badge}
              max={40}
              placeholder={locale !== primaryLocale ? primary?.badge : "Daily prompts"}
              onChange={(badge) => props.onCaption(frame.id, { badge })}
            />
            <TextField
              label="Title"
              value={caption.title}
              max={80}
              multiline
              placeholder={locale !== primaryLocale ? primary?.title : "Write a little, *every day*"}
              hint="Wrap words in *asterisks* to highlight them"
              onChange={(title) => props.onCaption(frame.id, { title })}
            />
            <TextField
              label="Subtitle"
              value={caption.subtitle}
              max={160}
              multiline
              placeholder={locale !== primaryLocale ? primary?.subtitle : "One line that explains the screen"}
              onChange={(subtitle) => props.onCaption(frame.id, { subtitle })}
            />
            {props.missingCaptions > 0 && (
              <p className="text-xs text-ink-3">
                <span className="font-medium text-ink">{props.missingCaptions}</span> of {props.frameCount} frames have no
                title in {locale} yet.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-3">Add a screenshot to write its caption.</p>
        )}
      </Section>

      {frame && (
        <Section title="Screenshot">
          <ShotRow own={ownShot} locale={locale} primaryLocale={primaryLocale} onReplace={props.onReplaceShot} />
        </Section>
      )}

      <Section title="Background">
        <BackgroundControls background={design.background} onChange={(background) => onDesign({ background })} />
      </Section>

      <Section title="Type">
        <div className="grid grid-cols-5 gap-1">
          {CAPTION_FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => onDesign({ font: font.id })}
              aria-pressed={design.font === font.id}
              title={font.name}
              className="grid h-10 place-items-center rounded-lg border border-line text-lg text-ink-2 transition hover:border-line-strong aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
              style={{ fontFamily: CAPTION_FONT_FAMILIES[font.id], fontWeight: 700 }}
            >
              Aa
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ColorField label="Text" value={design.textColor} onChange={(textColor) => onDesign({ textColor })} />
          <ColorField label="Highlight" value={design.accentColor} onChange={(accentColor) => onDesign({ accentColor })} />
        </div>
        <label className="mt-3 flex items-center justify-between text-xs text-ink-2">
          Show badge
          <Toggle checked={design.showBadge} onChange={(showBadge) => onDesign({ showBadge })} />
        </label>
      </Section>

      <Section title="Device">
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ["midnight", "Midnight", "#1b1c20"],
              ["silver", "Silver", "#d4d7dc"],
              ["none", "Bare", "transparent"],
            ] as const
          ).map(([id, label, swatch]) => (
            <button
              key={id}
              onClick={() => onDesign({ device: id })}
              aria-pressed={design.device === id}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-line py-2.5 text-[11px] text-ink-2 transition hover:border-line-strong aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent"
            >
              <span
                className="h-6 w-3.5 rounded-[4px] border border-ink-3/40"
                style={{ background: swatch, borderStyle: id === "none" ? "dashed" : "solid" }}
              />
              {label}
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        {aside}
      </div>
      {children}
    </section>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function TextField({ label, value, max, placeholder, hint, multiline, onChange }: TextFieldProps) {
  const length = countCharacters(value);
  const className =
    "w-full resize-none rounded-lg border border-line bg-panel px-2.5 py-2 text-sm text-ink placeholder:text-ink-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between text-xs text-ink-2">
        {label}
        <span className={`font-mono text-[10px] tabular-nums ${length > max ? "text-danger" : "text-ink-3"}`}>
          {length}/{max}
        </span>
      </span>
      {multiline ? (
        <textarea
          rows={label === "Title" ? 2 : 3}
          value={value}
          placeholder={placeholder}
          maxLength={max}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          maxLength={max}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

function ShotRow({
  own,
  locale,
  primaryLocale,
  onReplace,
}: {
  own: boolean;
  locale: string;
  primaryLocale: string;
  onReplace: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-ink-3">
        {own ? (
          <>
            Own screenshot for <span className="font-mono text-ink-2">{locale}</span>
          </>
        ) : (
          <>
            Reusing <span className="font-mono text-ink-2">{primaryLocale}</span>. Upload a localized capture.
          </>
        )}
      </p>
      <button
        onClick={() => input.current?.click()}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium shadow-soft transition hover:bg-hover"
      >
        <RefreshCw className="size-3" />
        {own ? "Replace" : "Upload"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onReplace(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function BackgroundControls({ background, onChange }: { background: Background; onChange: (value: Background) => void }) {
  return (
    <div className="grid gap-3">
      <div className="flex gap-0.5 rounded-xl bg-raised p-1 text-xs" role="radiogroup" aria-label="Fill">
        {(["solid", "gradient"] as const).map((kind) => (
          <button
            key={kind}
            role="radio"
            aria-checked={background.kind === kind}
            onClick={() => {
              if (kind === background.kind) return;
              onChange(
                kind === "solid"
                  ? { kind, color: background.kind === "gradient" ? background.from : "#111111" }
                  : { kind, from: background.kind === "solid" ? background.color : "#222222", to: "#0a0a0a", angle: 180 },
              );
            }}
            className="flex-1 rounded-lg py-1 font-medium capitalize text-ink-3 transition aria-checked:bg-panel aria-checked:text-ink aria-checked:shadow-soft"
          >
            {kind}
          </button>
        ))}
      </div>
      {background.kind === "solid" ? (
        <ColorField label="Color" value={background.color} onChange={(color) => onChange({ ...background, color })} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="From" value={background.from} onChange={(from) => onChange({ ...background, from })} />
            <ColorField label="To" value={background.to} onChange={(to) => onChange({ ...background, to })} />
          </div>
          <label className="grid gap-1.5 text-xs text-ink-2">
            <span className="flex justify-between">
              Angle <span className="font-mono text-[10px] text-ink-3">{background.angle}°</span>
            </span>
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={background.angle}
              onChange={(event) => onChange({ ...background, angle: Number(event.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2 py-1.5 transition hover:border-line-strong">
      <span className="relative size-5 shrink-0 overflow-hidden rounded-md ring-1 ring-black/10" style={{ background: value }}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[10px] text-ink-3">{label}</span>
        <span className="block font-mono text-[11px] uppercase text-ink">{value}</span>
      </span>
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 rounded-full bg-line-strong transition aria-checked:bg-accent"
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left] ${checked ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}
