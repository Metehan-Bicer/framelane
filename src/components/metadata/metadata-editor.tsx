"use client";

import { Check, Copy, FileJson, FolderDown, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { importListings, saveListing, saveLocales } from "@/app/apps/[id]/actions";
import { Topbar } from "@/components/editor/topbar";
import type { EditorApp, EditorFrame } from "@/components/editor/types";
import { useAutosave } from "@/components/editor/use-autosave";
import { APP_STORE_LOCALES } from "@/lib/app-store/locales";
import {
  checkListing,
  EMPTY_LISTING,
  LISTING_URL_FIELDS,
  withDefaults,
  type Listing,
  type ListingField as Field,
} from "@/lib/app-store/listing";
import type { Design } from "@/lib/design/model";
import { KeywordsField, ListingField } from "./fields";
import { StorePreview } from "./store-preview";
import { downloadEasConfig, downloadFastlane, readImport } from "./transfer";

type Props = {
  app: EditorApp;
  design: Design;
  frames: EditorFrame[];
  initialListings: Record<string, Listing>;
};

export function MetadataEditor({ app, design, frames, initialListings }: Props) {
  const [locales, setLocales] = useState(app.locales);
  const [locale, setLocale] = useState(app.primaryLocale);
  const [listings, setListings] = useState(initialListings);
  const [notice, setNotice] = useState<string | null>(null);
  const { status, schedule, run } = useAutosave();
  const importInput = useRef<HTMLInputElement>(null);

  const listing = withDefaults(listings[locale]);
  const primary = withDefaults(listings[app.primaryLocale]);
  const isPrimary = locale === app.primaryLocale;
  const placeholder = (field: Field) => (isPrimary ? undefined : primary[field] || undefined);

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? null : current)), 3600);
  }, []);

  const update = useCallback(
    (patch: Partial<Listing>) => {
      const next = { ...withDefaults(listings[locale]), ...patch };
      setListings((current) => ({ ...current, [locale]: next }));
      schedule(`listing:${locale}`, () => saveListing(app.id, locale, next));
    },
    [app.id, listings, locale, schedule],
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

  const onImport = useCallback(
    async (file: File) => {
      try {
        const imported = await readImport(file);
        const result = await importListings(app.id, imported);
        setListings((current) => ({ ...current, ...pick(imported, result.imported) }));
        setLocales(result.locales);
        const skipped = result.skipped.length ? `, skipped ${result.skipped.join(", ")}` : "";
        flash(`Imported ${result.imported.length} ${result.imported.length === 1 ? "language" : "languages"}${skipped}`);
      } catch (error) {
        flash(error instanceof Error ? error.message : "Import failed");
      }
    },
    [app.id, flash],
  );

  const filledListings = Object.fromEntries(locales.map((code) => [code, withDefaults(listings[code])]));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <Topbar
        app={app}
        section="metadata"
        languages={{ locales, locale, onLocale: setLocale, onAddLocale: addLocale }}
        status={status}
      >
        <button
          onClick={() => importInput.current?.click()}
          className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm shadow-soft transition hover:bg-hover"
        >
          <Upload className="size-4 text-ink-2" />
          Import
        </button>
        <ExportMenu
          onFastlane={() => downloadFastlane(filledListings, app.name)}
          onEas={() => downloadEasConfig(filledListings)}
        />
        <input
          ref={importInput}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImport(file);
            event.target.value = "";
          }}
        />
      </Topbar>

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <LanguageList
          locales={locales}
          primaryLocale={app.primaryLocale}
          listings={listings}
          locale={locale}
          onSelect={setLocale}
        />

        <main className="scrollbar-none min-w-0 flex-1 overflow-y-auto rounded-2xl border border-line bg-panel shadow-soft">
          <div className="mx-auto max-w-2xl px-8 py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {APP_STORE_LOCALES[locale as keyof typeof APP_STORE_LOCALES] ?? locale}
                </h1>
                <p className="mt-1 text-sm text-ink-2">
                  {isPrimary
                    ? "Primary language. Other languages show this text as a hint."
                    : `Empty fields show the ${app.primaryLocale} text as a hint.`}
                </p>
              </div>
              {!isPrimary && (
                <button
                  onClick={() =>
                    update(Object.fromEntries(LISTING_URL_FIELDS.map((field) => [field, listing[field] || primary[field]])))
                  }
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium shadow-soft transition hover:bg-hover"
                >
                  <Copy className="size-3.5" />
                  Copy URLs from {app.primaryLocale}
                </button>
              )}
            </div>

            <Group title="Product page">
              <ListingField field="name" value={listing.name} placeholder={placeholder("name") ?? app.name} onChange={(name) => update({ name })} />
              <ListingField field="subtitle" value={listing.subtitle} placeholder={placeholder("subtitle")} onChange={(subtitle) => update({ subtitle })} />
              <ListingField
                field="promotionalText"
                value={listing.promotionalText}
                placeholder={placeholder("promotionalText")}
                rows={2}
                onChange={(promotionalText) => update({ promotionalText })}
              />
              <ListingField
                field="description"
                value={listing.description}
                placeholder={placeholder("description")}
                rows={9}
                onChange={(description) => update({ description })}
              />
            </Group>

            <Group title="Search">
              <KeywordsField listing={listing} placeholder={placeholder("keywords")} onChange={(keywords) => update({ keywords })} />
            </Group>

            <Group title="This version">
              <ListingField
                field="whatsNew"
                value={listing.whatsNew}
                placeholder={placeholder("whatsNew")}
                rows={4}
                onChange={(whatsNew) => update({ whatsNew })}
              />
            </Group>

            <Group title="Links">
              {LISTING_URL_FIELDS.map((field) => (
                <ListingField
                  key={field}
                  field={field}
                  value={listing[field]}
                  placeholder={placeholder(field)}
                  onChange={(value) => update({ [field]: value })}
                />
              ))}
            </Group>
          </div>
        </main>

        <StorePreview
          appName={app.name}
          listing={listing}
          primary={primary}
          design={design}
          frames={frames}
          locale={locale}
          primaryLocale={app.primaryLocale}
        />
      </div>

      <AnimatePresence>
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</h2>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}

function LanguageList({
  locales,
  primaryLocale,
  listings,
  locale,
  onSelect,
}: {
  locales: string[];
  primaryLocale: string;
  listings: Record<string, Listing>;
  locale: string;
  onSelect: (code: string) => void;
}) {
  return (
    <aside className="scrollbar-none w-[248px] shrink-0 overflow-y-auto rounded-2xl border border-line bg-panel px-3 py-4 shadow-soft">
      <h2 className="px-2 text-xs font-semibold">Languages</h2>
      <ul className="mt-3 grid gap-1">
        {locales.map((code) => {
          const check = checkListing(withDefaults(listings[code] ?? EMPTY_LISTING));
          const done = check.filled === check.required && check.overLimit.length === 0;
          return (
            <li key={code}>
              <button
                onClick={() => onSelect(code)}
                aria-current={code === locale}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-hover aria-[current=true]:bg-accent-soft"
              >
                <Progress filled={check.filled} required={check.required} done={done} warn={check.overLimit.length > 0} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {APP_STORE_LOCALES[code as keyof typeof APP_STORE_LOCALES] ?? code}
                  </span>
                  <span className="block text-xs text-ink-3">
                    {code}
                    {code === primaryLocale && " · primary"}
                  </span>
                </span>
                {check.overLimit.length > 0 && (
                  <span className="rounded-md bg-[#fdecec] px-1.5 py-0.5 text-[10px] font-medium text-danger">
                    {check.overLimit.length} over
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 px-2 text-xs leading-relaxed text-ink-3">
        The ring fills as required fields are completed: name, description, keywords, support and privacy URLs.
      </p>
    </aside>
  );
}

function Progress({ filled, required, done, warn }: { filled: number; required: number; done: boolean; warn: boolean }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  if (done) {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white" aria-label="Complete">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0 -rotate-90" aria-label={`${filled} of ${required} required fields`}>
      <circle cx="12" cy="12" r={radius} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke={warn ? "var(--danger)" : "var(--accent)"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - filled / required)}
        className="transition-[stroke-dashoffset]"
      />
    </svg>
  );
}

function ExportMenu({ onFastlane, onEas }: { onFastlane: () => void; onEas: () => void }) {
  const [open, setOpen] = useState(false);
  const item =
    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-hover";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105"
      >
        <FolderDown className="size-4" />
        Export
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 z-50 w-72 origin-top-right rounded-xl border border-line bg-panel p-1.5 shadow-float"
            onMouseLeave={() => setOpen(false)}
          >
            <button role="menuitem" className={item} onClick={() => (onFastlane(), setOpen(false))}>
              <FolderDown className="mt-0.5 size-4 text-ink-2" />
              <span>
                <span className="block text-sm font-medium">fastlane metadata</span>
                <span className="block text-xs text-ink-3">A zip with metadata/&lt;locale&gt;/*.txt for deliver</span>
              </span>
            </button>
            <button role="menuitem" className={item} onClick={() => (onEas(), setOpen(false))}>
              <FileJson className="mt-0.5 size-4 text-ink-2" />
              <span>
                <span className="block text-sm font-medium">EAS store.config.json</span>
                <span className="block text-xs text-ink-3">For eas metadata:push in Expo projects</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function pick(listings: Record<string, Listing>, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, listings[key]]));
}
