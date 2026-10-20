"use client";

import { Plus, X } from "lucide-react";
import { Reorder } from "motion/react";
import { useRef } from "react";
import { FrameCanvas } from "@/components/frame-canvas";
import type { Design } from "@/lib/design/model";
import { captionFor, shotFor, type EditorFrame } from "./types";

type Props = {
  frames: EditorFrame[];
  design: Design;
  locale: string;
  primaryLocale: string;
  size: { width: number; height: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (frames: EditorFrame[]) => void;
  onReorderEnd: () => void;
  onRemove: (id: string) => void;
  onUpload: (files: File[]) => void;
};

/** The set in store order, as a floating dock. Drag to reorder. */
export function Filmstrip(props: Props) {
  const { frames, design, locale, primaryLocale, size, selectedId } = props;
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex shrink-0 justify-center">
      <div className="flex max-w-full items-center gap-3 rounded-2xl border border-line bg-panel py-2.5 pl-4 pr-2.5 shadow-float">
        <div className="shrink-0 pr-1">
          <p className="text-xs font-semibold">Frames</p>
          <p className="mt-0.5 text-[11px] text-ink-3 tabular-nums">{frames.length} of 10</p>
        </div>

        <Reorder.Group
          as="ol"
          axis="x"
          values={frames}
          onReorder={props.onReorder}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto px-1 py-1"
          aria-label="Frames"
        >
          {frames.map((frame, index) => {
            const active = frame.id === selectedId;
            return (
              <Reorder.Item
                key={frame.id}
                value={frame}
                onDragEnd={props.onReorderEnd}
                className="group relative shrink-0 cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.08, zIndex: 10 }}
              >
                <button
                  onClick={() => props.onSelect(frame.id)}
                  aria-label={`Frame ${index + 1}`}
                  aria-current={active}
                  className={`block w-[38px] overflow-hidden rounded-[6px] transition ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : "opacity-80 hover:opacity-100"}`}
                >
                  <FrameCanvas
                    design={design}
                    caption={captionFor(frame, locale)}
                    fileId={shotFor(frame, locale, primaryLocale)}
                    size={size}
                  />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete frame ${index + 1}? Its captions in every language are removed too.`)) {
                      props.onRemove(frame.id);
                    }
                  }}
                  aria-label={`Delete frame ${index + 1}`}
                  className="absolute -right-1.5 -top-1.5 hidden size-[18px] place-items-center rounded-full border border-line bg-panel text-ink-2 shadow-soft hover:text-danger group-hover:grid"
                >
                  <X className="size-2.5" />
                </button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {frames.length < 10 && (
          <button
            onClick={() => input.current?.click()}
            aria-label="Add screenshots"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-raised text-ink-2 transition hover:bg-accent-soft hover:text-accent"
          >
            <Plus className="size-4" />
          </button>
        )}

        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) props.onUpload([...event.target.files]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
