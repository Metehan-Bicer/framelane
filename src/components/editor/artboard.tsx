"use client";

import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { FrameCanvas } from "@/components/frame-canvas";
import type { DisplaySize } from "@/lib/app-store/display-sizes";
import type { Design } from "@/lib/design/model";
import { captionFor, shotFor, type EditorFrame } from "./types";

type Props = {
  design: Design;
  frame: EditorFrame | null;
  index: number;
  count: number;
  locale: string;
  primaryLocale: string;
  display: DisplaySize;
  uploading: boolean;
  onUpload: (files: File[]) => void;
  onStep: (step: -1 | 1) => void;
};

export function Artboard({ design, frame, index, count, locale, primaryLocale, display, uploading, onUpload, onStep }: Props) {
  const size = display.sizes[0];

  return (
    <section className="relative flex min-h-0 flex-1 items-center justify-center" aria-label="Artboard">
      {frame ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-16 pb-5 pt-4">
          <p className="mb-3 flex items-center gap-2 text-xs text-ink-3">
            <span className="font-medium text-ink-2">
              Frame {index + 1} of {count}
            </span>
            <span className="size-1 rounded-full bg-line-strong" />
            <span className="font-mono text-[11px]">
              {size.width} × {size.height}
            </span>
          </p>

          <div className="relative min-h-0 flex-1" style={{ aspectRatio: `${size.width} / ${size.height}` }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={frame.id}
                className="absolute inset-0 overflow-hidden rounded-[18px] shadow-[0_2px_4px_rgba(16,24,40,0.06),0_24px_60px_-18px_rgba(16,24,40,0.28)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <FrameCanvas
                  design={design}
                  caption={captionFor(frame, locale)}
                  fileId={shotFor(frame, locale, primaryLocale)}
                  size={size}
                  className="h-full"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <StepButton side="left" disabled={index <= 0} onClick={() => onStep(-1)} />
          <StepButton side="right" disabled={index >= count - 1} onClick={() => onStep(1)} />
        </div>
      ) : (
        <EmptyArtboard uploading={uploading} onUpload={onUpload} />
      )}
    </section>
  );
}

function StepButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous frame" : "Next frame"}
      className={`absolute top-1/2 ${side === "left" ? "left-3" : "right-3"} grid size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-panel text-ink-2 shadow-soft transition hover:text-ink disabled:opacity-0`}
    >
      <Icon className="size-4" />
    </button>
  );
}

function EmptyArtboard({ uploading, onUpload }: { uploading: boolean; onUpload: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-line bg-panel px-10 py-14 text-center shadow-soft">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <ImagePlus className="size-5" />
      </span>
      <p className="mt-5 text-lg font-semibold tracking-tight">Add your screenshots</p>
      <p className="mt-2 max-w-72 text-sm leading-relaxed text-ink-2">
        Drop raw captures from the simulator or your phone. Each one becomes a frame you can caption per language.
      </p>
      <button
        onClick={() => input.current?.click()}
        disabled={uploading}
        className="mt-7 h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105 disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "Choose files"}
      </button>
      <p className="mt-4 text-xs text-ink-3">PNG or JPEG, up to 20 MB each</p>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) onUpload([...event.target.files]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
