"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { createApp, type CreateAppState } from "@/app/actions";
import { APP_STORE_LOCALES } from "@/lib/app-store/locales";

const locales = Object.entries(APP_STORE_LOCALES);

export function NewAppButton({ variant = "solid" }: { variant?: "solid" | "quiet" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className={
          variant === "solid"
            ? "flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105"
            : "flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel px-3.5 text-sm shadow-soft hover:bg-hover"
        }
      >
        <Plus className="size-4" />
        New app
      </button>
      <NewAppDialog ref={dialog} />
    </>
  );
}

function NewAppDialog({ ref }: { ref: React.RefObject<HTMLDialogElement | null> }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CreateAppState, FormData>(createApp, {});

  useEffect(() => {
    if (!state.createdId) return;
    // A modal dialog keeps the rest of the document inert, so close it before leaving.
    ref.current?.close();
    router.push(`/apps/${state.createdId}`);
  }, [ref, router, state.createdId]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="new-app-title"
      className="m-auto w-[420px] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-panel p-0 text-ink shadow-float backdrop:bg-[#15171c]/25 backdrop:backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <form action={action} className="grid gap-4 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="new-app-title" className="text-lg font-semibold tracking-tight">
              New app
            </h2>
            <p className="mt-2 text-sm text-ink-3">Use the same name and bundle ID as App Store Connect.</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <Field label="Name" error={state.errors?.name}>
          <input name="name" placeholder="Odaq" maxLength={30} required autoFocus className={inputClass} />
        </Field>
        <Field label="Bundle ID" error={state.errors?.bundleId}>
          <input name="bundleId" placeholder="com.example.odaq" required className={`${inputClass} font-mono`} />
        </Field>
        <Field label="Primary language" error={state.errors?.primaryLocale}>
          <select name="primaryLocale" defaultValue="en-US" className={inputClass}>
            {locales.map(([code, label]) => (
              <option key={code} value={code}>
                {label} · {code}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-10 rounded-lg bg-accent text-sm font-medium text-accent-ink transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create and open editor"}
        </button>
      </form>
    </dialog>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent-soft";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs text-ink-2">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
