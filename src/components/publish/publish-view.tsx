"use client";

import { AlertTriangle, ArrowRight, Check, CloudUpload, Loader2, Lock, RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { disconnectAsc, loadPublish, pushMetadata, type PublishView as View } from "@/app/apps/[id]/publish/actions";
import { renderScreenshotSet } from "@/components/editor/export";
import { DisplaySwitch, Topbar } from "@/components/editor/topbar";
import { EXPORTABLE_DISPLAYS, type EditorApp, type EditorFrame } from "@/components/editor/types";
import type { DisplayType } from "@/lib/app-store/display-sizes";
import { FIELD_INFO } from "@/lib/app-store/listing";
import { APP_STORE_LOCALES } from "@/lib/app-store/locales";
import type { ApplyResult } from "@/lib/asc/publish";
import type { LocalePlan } from "@/lib/asc/plan";
import type { Design } from "@/lib/design/model";
import { ConnectForm } from "./connect-form";

type Props = { app: EditorApp; design: Design; frames: EditorFrame[] };

type UploadStatus = { state: "waiting" | "rendering" | "uploading" | "done" | "error"; message?: string };

export function PublishView({ app, design, frames }: Props) {
  const [view, setView] = useState<View | null>(null);
  const [loading, startLoading] = useTransition();
  const [pushing, startPushing] = useTransition();
  const [pushResult, setPushResult] = useState<ApplyResult[] | string | null>(null);
  const [displayType, setDisplayType] = useState<DisplayType>("APP_IPHONE_67");
  const [uploads, setUploads] = useState<Record<string, UploadStatus>>({});
  const display = EXPORTABLE_DISPLAYS.find((item) => item.type === displayType) ?? EXPORTABLE_DISPLAYS[0];

  const refresh = useCallback(() => {
    startLoading(async () => setView(await loadPublish(app.id)));
  }, [app.id]);

  useEffect(refresh, [refresh]);

  const state = view?.connected ? view.state : undefined;
  const plan = state?.status === "ready" ? state.plan : [];
  const changeCount = plan.reduce(
    (sum, entry) =>
      sum + entry.version.changes.length + (["create", "update"].includes(entry.info.action) ? entry.info.changes.length : 0),
    0,
  );
  const uploading = Object.values(uploads).some((item) => ["rendering", "uploading"].includes(item.state));

  const uploadScreenshots = async () => {
    setUploads(Object.fromEntries(app.locales.map((locale) => [locale, { state: "waiting" }])));
    for (const locale of app.locales) {
      const set = (next: UploadStatus) => setUploads((current) => ({ ...current, [locale]: next }));
      try {
        set({ state: "rendering" });
        const pngs = await renderScreenshotSet({ app, frames, locale, design, display });
        const post = async (fields: Record<string, string | Blob>, fileName?: string) => {
          const body = new FormData();
          for (const [key, value] of Object.entries(fields)) {
            if (value instanceof Blob) body.set(key, value, fileName);
            else body.set(key, value);
          }
          const response = await fetch(`/api/apps/${app.id}/asc/screenshots`, { method: "POST", body });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "Upload failed");
          return result;
        };
        const { setId, removed } = await post({ step: "prepare", locale, displayType: display.type });
        const ids: string[] = [];
        for (const [index, png] of pngs.entries()) {
          set({ state: "uploading", message: `${index + 1} of ${pngs.length}` });
          const name = `${String(index + 1).padStart(2, "0")}.png`;
          ids.push((await post({ step: "upload", setId, displayType: display.type, file: png }, name)).id);
        }
        await post({ step: "order", setId, ids: JSON.stringify(ids) });
        set({ state: "done", message: `${ids.length} uploaded${removed ? `, ${removed} replaced` : ""}` });
      } catch (error) {
        set({ state: "error", message: error instanceof Error ? error.message : "Upload failed" });
      }
    }
    refresh();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <Topbar app={app} section="publish">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm shadow-soft transition hover:bg-hover disabled:opacity-60"
        >
          <RefreshCw className={`size-4 text-ink-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </Topbar>

      <main className="scrollbar-none flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-3xl gap-4 px-6 py-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Publish to App Store Connect</h1>
            <p className="mt-1 text-sm text-ink-2">
              Review what changes, then send text and screenshots. Nothing is submitted for review.
            </p>
          </div>

          {!view ? (
            <Card>
              <p className="flex items-center gap-2 text-sm text-ink-3">
                <Loader2 className="size-4 animate-spin" /> Checking App Store Connect…
              </p>
            </Card>
          ) : !view.connected ? (
            <Card title="Connect App Store Connect">
              <ConnectForm onConnected={refresh} />
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-[#e8f7ef] text-ok">
                      <Check className="size-4" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Connected to App Store Connect</p>
                      <p className="font-mono text-xs text-ink-3">Key {view.keyId}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Remove the App Store Connect key from this server?")) return;
                      await disconnectAsc();
                      refresh();
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-ink-2 transition hover:bg-hover hover:text-danger"
                  >
                    <Unplug className="size-3.5" /> Disconnect
                  </button>
                </div>
                {state?.status === "ready" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
                    <span className="font-medium">{state.target.ascAppName}</span>
                    <span className="text-ink-3">·</span>
                    <span>Version {state.target.versionString}</span>
                    <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {humanize(state.target.versionState)}
                    </span>
                  </div>
                )}
              </Card>

              {view.error && <Notice tone="danger">{view.error}</Notice>}
              {state?.status === "app-not-found" && (
                <Notice tone="warn">
                  No app with bundle ID <span className="font-mono">{state.bundleId}</span> in this account. Create the app
                  in App Store Connect with the same bundle ID.
                </Notice>
              )}
              {state?.status === "no-editable-version" && (
                <Notice tone="warn">
                  {state.ascAppName} has no version in preparation. Add a new version in App Store Connect, then refresh.
                </Notice>
              )}

              {state?.status === "ready" && (
                <>
                  <Card
                    title="Text"
                    action={
                      <button
                        onClick={() =>
                          startPushing(async () => {
                            const result = await pushMetadata(app.id);
                            setPushResult("error" in result ? result.error : result.results);
                            refresh();
                          })
                        }
                        disabled={pushing || changeCount === 0}
                        className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105 disabled:bg-line-strong disabled:text-ink-3 disabled:shadow-none"
                      >
                        {pushing ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
                        {changeCount === 0 ? "Up to date" : `Push ${changeCount} ${changeCount === 1 ? "change" : "changes"}`}
                      </button>
                    }
                  >
                    {pushResult && <PushResult result={pushResult} />}
                    <div className="grid gap-3">
                      {plan.length === 0 && <p className="text-sm text-ink-3">Write metadata first, then come back.</p>}
                      {plan.map((entry) => (
                        <LocaleChanges key={entry.locale} entry={entry} />
                      ))}
                    </div>
                  </Card>

                  <Card
                    title="Screenshots"
                    action={
                      <div className="flex items-center gap-2">
                        <DisplaySwitch value={displayType} onChange={setDisplayType} />
                        <button
                          onClick={uploadScreenshots}
                          disabled={uploading || frames.length === 0}
                          className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105 disabled:bg-line-strong disabled:text-ink-3 disabled:shadow-none"
                        >
                          {uploading ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
                          Upload
                        </button>
                      </div>
                    }
                  >
                    <p className="mb-3 text-sm text-ink-2">
                      Each language&apos;s {display.label} set is replaced with your {frames.length}{" "}
                      {frames.length === 1 ? "frame" : "frames"}, rendered at {display.sizes[0].width} ×{" "}
                      {display.sizes[0].height}.
                    </p>
                    <ul className="divide-y divide-line rounded-xl border border-line">
                      {app.locales.map((locale) => {
                        const existing = state.screenshots[locale]?.[display.type] ?? 0;
                        const upload = uploads[locale];
                        return (
                          <li key={locale} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                            <span>
                              <span className="font-medium">{languageName(locale)}</span>{" "}
                              <span className="font-mono text-xs text-ink-3">{locale}</span>
                            </span>
                            <span className="flex items-center gap-2 text-ink-2">
                              {upload ? (
                                <UploadBadge status={upload} />
                              ) : (
                                <>
                                  <span className="text-ink-3">{existing} in App Store Connect</span>
                                  <ArrowRight className="size-3.5 text-ink-3" />
                                  <span className="font-medium text-ink">{frames.length}</span>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function LocaleChanges({ entry }: { entry: LocalePlan }) {
  const changes = [
    ...entry.version.changes,
    ...(["create", "update"].includes(entry.info.action) ? entry.info.changes : []),
  ];
  const label =
    entry.version.action === "create" || entry.info.action === "create" ? "New language" : changes.length ? "Update" : "No changes";

  return (
    <details className="group rounded-xl border border-line" open={changes.length > 0 && changes.length <= 4}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm">
          <span className="font-medium">{languageName(entry.locale)}</span>{" "}
          <span className="font-mono text-xs text-ink-3">{entry.locale}</span>
        </span>
        <span className="flex items-center gap-2">
          {entry.info.action === "blocked" && (
            <span className="flex items-center gap-1 rounded-md bg-raised px-2 py-0.5 text-xs text-ink-2" title="Name and subtitle change only with a new version">
              <Lock className="size-3" /> Name locked
            </span>
          )}
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${changes.length ? "bg-accent-soft text-accent" : "bg-raised text-ink-3"}`}
          >
            {label}
            {changes.length > 0 && ` · ${changes.length}`}
          </span>
        </span>
      </summary>
      {changes.length > 0 && (
        <dl className="grid gap-3 border-t border-line px-4 py-3">
          {changes.map((change) => (
            <div key={change.field} className="grid gap-1 text-sm">
              <dt className="text-xs font-medium text-ink-3">{FIELD_INFO[change.field].label}</dt>
              {change.from && <dd className="line-clamp-2 text-ink-3 line-through decoration-ink-3/40">{change.from}</dd>}
              <dd className="line-clamp-3 whitespace-pre-line">{change.to}</dd>
            </div>
          ))}
        </dl>
      )}
    </details>
  );
}

function PushResult({ result }: { result: ApplyResult[] | string }) {
  if (typeof result === "string") return <Notice tone="danger">{result}</Notice>;
  return (
    <ul className="mb-4 grid gap-1 rounded-xl bg-raised/70 p-3 text-sm" role="status">
      {result.length === 0 && <li className="text-ink-2">Nothing needed to change.</li>}
      {result.map((item) => (
        <li key={item.locale} className={item.ok ? "text-ink-2" : "text-danger"}>
          <span className="font-mono text-xs">{item.locale}</span> {item.ok ? "✓" : "✕"} {item.message}
        </li>
      ))}
    </ul>
  );
}

function UploadBadge({ status }: { status: UploadStatus }) {
  const text = {
    waiting: "Waiting",
    rendering: "Rendering…",
    uploading: status.message ? `Uploading ${status.message}…` : "Uploading…",
    done: status.message ?? "Done",
    error: status.message ?? "Failed",
  }[status.state];
  const tone =
    status.state === "done" ? "text-ok" : status.state === "error" ? "text-danger" : "text-ink-3";
  return <span className={`text-xs ${tone}`}>{text}</span>;
}

function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-soft">
      {title && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Notice({ tone, children }: { tone: "warn" | "danger"; children: React.ReactNode }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${tone === "danger" ? "bg-[#fdecec] text-danger" : "bg-[#fdf3e3] text-[#8a520a]"}`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function languageName(locale: string) {
  return APP_STORE_LOCALES[locale as keyof typeof APP_STORE_LOCALES] ?? locale;
}

function humanize(state: string) {
  return state.toLowerCase().replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
