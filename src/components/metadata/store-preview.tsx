"use client";

import { useState } from "react";
import { FrameCanvas } from "@/components/frame-canvas";
import { captionFor, shotFor, type EditorFrame } from "@/components/editor/types";
import type { Listing } from "@/lib/app-store/listing";
import type { Design } from "@/lib/design/model";

type Props = {
  appName: string;
  listing: Listing;
  primary: Listing;
  design: Design;
  frames: EditorFrame[];
  locale: string;
  primaryLocale: string;
};

const SIZE = { width: 1320, height: 2868 };

/** An approximation of the App Store product page, to read the copy in context. */
export function StorePreview({ appName, listing, primary, design, frames, locale, primaryLocale }: Props) {
  const [expanded, setExpanded] = useState(false);
  const name = listing.name || primary.name || appName;
  const subtitle = listing.subtitle || primary.subtitle;
  const description = listing.description || primary.description;
  const background =
    design.background.kind === "solid"
      ? design.background.color
      : `linear-gradient(${design.background.angle}deg, ${design.background.from}, ${design.background.to})`;

  return (
    <aside className="scrollbar-none w-[340px] shrink-0 overflow-y-auto rounded-2xl border border-line bg-panel shadow-soft">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-xs font-semibold">Product page preview</h2>
        <span className="rounded-md bg-raised px-1.5 py-0.5 font-mono text-[10px] text-ink-2">{locale}</span>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <span
            className="grid size-[76px] shrink-0 place-items-center rounded-[18px] text-3xl font-bold shadow-soft ring-1 ring-black/5"
            style={{ background, color: design.textColor }}
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="line-clamp-2 text-[17px] font-semibold leading-tight">{name}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-3">{subtitle || "Subtitle"}</p>
            <span className="mt-auto w-fit rounded-full bg-accent px-4 py-1 text-[13px] font-semibold text-white">Get</span>
          </div>
        </div>

        <div className="mt-4 border-t border-line" />

        {listing.promotionalText && <p className="mt-3 text-[13px] leading-snug">{listing.promotionalText}</p>}

        {frames.length > 0 ? (
          <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {frames.slice(0, 6).map((frame) => (
              <div key={frame.id} className="w-[118px] shrink-0 overflow-hidden rounded-[12px] ring-1 ring-black/5">
                <FrameCanvas
                  design={design}
                  caption={captionFor(frame, locale)}
                  fileId={shotFor(frame, locale, primaryLocale)}
                  size={SIZE}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-raised p-4 text-center text-xs text-ink-3">
            Screenshots from the editor appear here.
          </p>
        )}

        <div className="mt-4 text-[13px] leading-relaxed text-ink-2">
          {description ? (
            <>
              <p className={`whitespace-pre-line ${expanded ? "" : "line-clamp-3"}`}>{description}</p>
              {description.length > 160 && (
                <button onClick={() => setExpanded(!expanded)} className="mt-1 font-medium text-accent">
                  {expanded ? "less" : "more"}
                </button>
              )}
            </>
          ) : (
            <p className="text-ink-3">The description shows here.</p>
          )}
        </div>

        {listing.whatsNew && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[15px] font-semibold">What&apos;s New</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-2">
              {listing.whatsNew}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
