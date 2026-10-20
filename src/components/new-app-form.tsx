"use client";

import { useActionState, useEffect, useRef } from "react";
import { createApp, type CreateAppState } from "@/app/actions";
import { APP_STORE_LOCALES } from "@/lib/app-store/locales";

const locales = Object.entries(APP_STORE_LOCALES);

export function NewAppForm() {
  const [state, action, pending] = useActionState<CreateAppState, FormData>(createApp, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold">Add an app</h2>
      <Field label="Name" error={state.errors?.name}>
        <input name="name" placeholder="Odaq" maxLength={30} required className={inputClass} />
      </Field>
      <Field label="Bundle ID" error={state.errors?.bundleId}>
        <input name="bundleId" placeholder="com.example.odaq" required className={`${inputClass} font-mono`} />
      </Field>
      <Field label="Primary language" error={state.errors?.primaryLocale}>
        <select name="primaryLocale" defaultValue="en-US" className={inputClass}>
          {locales.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add app"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error && <span className="text-danger">{error}</span>}
    </label>
  );
}
