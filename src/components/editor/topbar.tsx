"use client";

import { ArrowLeft, Download, Plus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { DisplayType } from "@/lib/app-store/display-sizes";
import { APP_STORE_LOCALES } from "@/lib/app-store/locales";
import { FrameMark } from "@/components/wordmark";
import { EXPORTABLE_DISPLAYS, type EditorApp } from "./types";
import type { SaveStatus } from "./use-autosave";

type Props = {
  app: EditorApp;
  locales: string[];
  locale: string;
  onLocale: (code: string) => void;
  onAddLocale: (code: string) => void;
  displayType: DisplayType;
  onDisplay: (type: DisplayType) => void;
  status: SaveStatus;
  exportProgress: { done: number; total: number } | null;
  onExport: () => void;
};

export function Topbar(props: Props) {
  const { app, locales, locale, onLocale, displayType, onDisplay, status, exportProgress, onExport } = props;

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-panel px-3">
      <div className="flex w-[240px] items-center gap-2">
        <Link
          href="/"
          aria-label="Back to apps"
          className="grid size-8 place-items-center rounded-lg text-ink-2 transition hover:bg-hover hover:text-ink"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <FrameMark className="size-7" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{app.name}</p>
          <p className="truncate font-mono text-[10px] text-ink-3">{app.bundleId}</p>
        </div>
      </div>

      <nav aria-label="Languages" className="flex min-w-0 flex-1 items-center justify-center gap-1">
        <div className="flex items-center gap-0.5 rounded-xl bg-raised p-1">
        {locales.map((code) => (
          <button
            key={code}
            onClick={() => onLocale(code)}
            className="relative rounded-lg px-3 py-1.5 text-xs font-medium text-ink-3 transition hover:text-ink aria-pressed:text-ink"
            aria-pressed={code === locale}
            title={APP_STORE_LOCALES[code as keyof typeof APP_STORE_LOCALES] ?? code}
          >
            {code === locale && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 rounded-lg bg-panel shadow-soft"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{code}</span>
            {code === app.primaryLocale && <span className="relative ml-1 text-ink-3">·</span>}
          </button>
        ))}
        </div>
        <AddLocale existing={locales} onAdd={props.onAddLocale} />
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex gap-0.5 rounded-xl bg-raised p-1" role="radiogroup" aria-label="Display size">
          {EXPORTABLE_DISPLAYS.map((display) => (
            <button
              key={display.type}
              role="radio"
              aria-checked={display.type === displayType}
              onClick={() => onDisplay(display.type)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-3 transition aria-checked:bg-panel aria-checked:text-ink aria-checked:shadow-soft"
              title={`${display.sizes[0].width} × ${display.sizes[0].height}`}
            >
              {display.label.replace("iPhone ", "")}
            </button>
          ))}
        </div>

        <SaveIndicator status={status} />

        <button
          onClick={onExport}
          disabled={exportProgress !== null}
          className="relative flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105 disabled:cursor-progress"
        >
          {exportProgress && (
            <span
              className="absolute inset-y-0 left-0 bg-white/25 transition-[width]"
              style={{ width: `${(exportProgress.done / exportProgress.total) * 100}%` }}
            />
          )}
          <Download className="relative size-4" />
          <span className="relative tabular-nums">
            {exportProgress ? `${exportProgress.done}/${exportProgress.total}` : "Export"}
          </span>
        </button>
      </div>
    </header>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = { saved: "Saved", saving: "Saving", error: "Not saved" }[status];
  const color = { saved: "bg-ok", saving: "bg-ink-3 animate-pulse", error: "bg-danger" }[status];
  return (
    <span className="flex w-20 items-center gap-1.5 text-xs text-ink-3" aria-live="polite">
      <span className={`size-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function AddLocale({ existing, onAdd }: { existing: string[]; onAdd: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = Object.entries(APP_STORE_LOCALES).filter(([code]) => !existing.includes(code));
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Add language"
        className="grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-hover hover:text-ink"
      >
        <Plus className="size-3.5" />
      </button>
    );
  }
  return (
    <select
      autoFocus
      aria-label="Add language"
      defaultValue=""
      onBlur={() => setOpen(false)}
      onChange={(event) => {
        if (event.target.value) onAdd(event.target.value);
        setOpen(false);
      }}
      className="h-8 rounded-lg border border-line bg-panel px-2 text-xs text-ink shadow-soft outline-none"
    >
      <option value="" disabled>
        Add language…
      </option>
      {options.map(([code, name]) => (
        <option key={code} value={code}>
          {name} · {code}
        </option>
      ))}
    </select>
  );
}
