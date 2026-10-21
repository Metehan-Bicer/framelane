"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { removeFrame, saveCaption, saveDesign, saveFrameOrder, saveLocales } from "@/app/apps/[id]/actions";
import type { DisplayType } from "@/lib/app-store/display-sizes";
import type { Caption, Design } from "@/lib/design/model";
import { Artboard } from "./artboard";
import { exportScreenshots } from "./export";
import { Filmstrip } from "./filmstrip";
import { Inspector } from "./inspector";
import { TemplateRail } from "./template-rail";
import { DisplaySwitch, PrimaryButton, Topbar } from "./topbar";
import { captionFor, EXPORTABLE_DISPLAYS, shotFor, type EditorApp, type EditorFrame } from "./types";
import { useAutosave } from "./use-autosave";

type Props = {
  app: EditorApp;
  initialDesign: Design;
  initialFrames: EditorFrame[];
};

export function Editor({ app, initialDesign, initialFrames }: Props) {
  const [design, setDesign] = useState(initialDesign);
  const [frames, setFrames] = useState(initialFrames);
  const [locales, setLocales] = useState(app.locales);
  const [locale, setLocale] = useState(app.primaryLocale);
  const [selectedId, setSelectedId] = useState<string | null>(initialFrames[0]?.id ?? null);
  const [displayType, setDisplayType] = useState<DisplayType>("APP_IPHONE_67");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const { status, schedule, run } = useAutosave();

  const display = EXPORTABLE_DISPLAYS.find((d) => d.type === displayType) ?? EXPORTABLE_DISPLAYS[0];
  const size = display.sizes[0];
  const selectedIndex = frames.findIndex((frame) => frame.id === selectedId);
  const selected = selectedIndex >= 0 ? frames[selectedIndex] : null;

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? null : current)), 3200);
  }, []);

  const updateDesign = useCallback(
    (patch: Partial<Design>) => {
      const next = { ...design, ...patch };
      setDesign(next);
      schedule("design", () => saveDesign(app.id, next));
    },
    [app.id, design, schedule],
  );

  const updateCaption = useCallback(
    (frameId: string, patch: Partial<Caption>) => {
      const frame = frames.find((item) => item.id === frameId);
      if (!frame) return;
      const caption = { ...captionFor(frame, locale), ...patch };
      setFrames((current) =>
        current.map((item) =>
          item.id === frameId ? { ...item, captions: { ...item.captions, [locale]: caption } } : item,
        ),
      );
      schedule(`caption:${frameId}:${locale}`, () => saveCaption(app.id, frameId, locale, caption));
    },
    [app.id, frames, locale, schedule],
  );

  const upload = useCallback(
    async (files: File[], frameId?: string) => {
      const images = files.filter((file) => /^image\/(png|jpeg)$/.test(file.type));
      if (images.length === 0) return flash("Only PNG and JPEG screenshots can be added");
      const body = new FormData();
      body.set("locale", locale);
      if (frameId) body.set("frameId", frameId);
      for (const file of frameId ? images.slice(0, 1) : images) body.append("files", file);
      setUploading(true);
      try {
        const response = await fetch(`/api/apps/${app.id}/frames`, { method: "POST", body });
        const result = await response.json();
        if (!response.ok) return flash(result.error ?? "Upload failed");
        const changed: EditorFrame[] = result.frames;
        setFrames((current) => {
          const byId = new Map(current.map((frame) => [frame.id, frame]));
          for (const frame of changed) byId.set(frame.id, { ...byId.get(frame.id), ...frame });
          return [...byId.values()];
        });
        if (!frameId) setSelectedId(changed[0]?.id ?? null);
        flash(frameId ? `Screenshot replaced for ${locale}` : `${changed.length} frame${changed.length > 1 ? "s" : ""} added`);
      } finally {
        setUploading(false);
      }
    },
    [app.id, flash, locale],
  );

  const reorder = useCallback((next: EditorFrame[]) => setFrames(next), []);
  const commitOrder = useCallback(() => {
    void run(() => saveFrameOrder(app.id, frames.map((frame) => frame.id)));
  }, [app.id, frames, run]);

  const remove = useCallback(
    (frameId: string) => {
      const index = frames.findIndex((frame) => frame.id === frameId);
      const next = frames.filter((frame) => frame.id !== frameId);
      setFrames(next);
      if (selectedId === frameId) setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
      void run(() => removeFrame(app.id, frameId));
    },
    [app.id, frames, run, selectedId],
  );

  const addLocale = useCallback(
    (code: string) => {
      const next = [...locales, code];
      setLocales(next);
      setLocale(code);
      void run(() => saveLocales(app.id, next));
    },
    [app.id, locales, run],
  );

  const startExport = useCallback(async () => {
    if (frames.length === 0) return flash("Add a screenshot before exporting");
    setExportProgress({ done: 0, total: frames.length * locales.length });
    try {
      await exportScreenshots({
        app,
        frames,
        locales,
        design,
        display,
        onProgress: (done, total) => setExportProgress({ done, total }),
      });
      flash(`Exported ${frames.length * locales.length} screenshots`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExportProgress(null);
    }
  }, [app, design, display, flash, frames, locales]);

  // Arrow keys move between frames when focus is not in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const step = event.key === "ArrowLeft" ? -1 : 1;
      const next = frames[selectedIndex + step];
      if (next) setSelectedId(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frames, selectedIndex]);

  const missingCaptions = useMemo(
    () => frames.filter((frame) => !captionFor(frame, locale).title.trim()).length,
    [frames, locale],
  );

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-bg"
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.relatedTarget === null) setDragging(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        setDragging(false);
        void upload([...event.dataTransfer.files]);
      }}
    >
      <Topbar
        app={app}
        section="screenshots"
        locales={locales}
        locale={locale}
        onLocale={setLocale}
        onAddLocale={addLocale}
        status={status}
      >
        <DisplaySwitch value={displayType} onChange={setDisplayType} />
        <PrimaryButton
          onClick={startExport}
          disabled={exportProgress !== null}
          progress={exportProgress ? exportProgress.done / exportProgress.total : null}
        >
          {exportProgress ? `${exportProgress.done}/${exportProgress.total}` : "Export"}
        </PrimaryButton>
      </Topbar>

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <TemplateRail
          design={design}
          onDesign={updateDesign}
          caption={selected ? captionFor(selected, locale) : undefined}
          fileId={selected ? shotFor(selected, locale, app.primaryLocale) : undefined}
          size={size}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Artboard
            design={design}
            frame={selected}
            index={selectedIndex}
            count={frames.length}
            locale={locale}
            primaryLocale={app.primaryLocale}
            display={display}
            uploading={uploading}
            onUpload={upload}
            onStep={(step) => {
              const next = frames[selectedIndex + step];
              if (next) setSelectedId(next.id);
            }}
          />
          {frames.length > 0 && (
            <Filmstrip
              frames={frames}
              design={design}
              locale={locale}
              primaryLocale={app.primaryLocale}
              size={size}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReorder={reorder}
              onReorderEnd={commitOrder}
              onRemove={remove}
              onUpload={upload}
            />
          )}
        </main>

        <Inspector
          design={design}
          onDesign={updateDesign}
          frame={selected}
          locale={locale}
          primaryLocale={app.primaryLocale}
          onCaption={updateCaption}
          onReplaceShot={(file) => selected && upload([file], selected.id)}
          missingCaptions={missingCaptions}
          frameCount={frames.length}
        />
      </div>

      <AnimatePresence>
        {dragging && (
          <motion.div
            className="pointer-events-none fixed inset-3 z-40 grid place-items-center rounded-3xl border-2 border-dashed border-accent/60 bg-accent-soft/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="rounded-full bg-panel px-5 py-2.5 text-sm font-medium text-ink shadow-float">
              Drop to add frames
            </p>
          </motion.div>
        )}
        {notice && (
          <motion.div
            key={notice}
            role="status"
            className="fixed left-1/2 top-[72px] z-50 -translate-x-1/2 rounded-full border border-line bg-panel px-4 py-2 text-sm text-ink shadow-float"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
