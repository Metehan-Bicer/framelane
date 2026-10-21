"use client";

import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { connectAsc, type ConnectResult } from "@/app/apps/[id]/publish/actions";

type Errors = Extract<ConnectResult, { ok: false }>["errors"];

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent-soft";

/** Asks for an App Store Connect API key. The key is checked against Apple before it is saved. */
export function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [errors, setErrors] = useState<Errors>({});
  const [keyFile, setKeyFile] = useState<{ name: string; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await connectAsc({
            issuerId: form.get("issuerId"),
            keyId: form.get("keyId"),
            privateKey: keyFile?.text ?? "",
          });
          if (result.ok) onConnected();
          else setErrors(result.errors);
        });
      }}
    >
      <ol className="grid gap-2 rounded-xl bg-raised/70 p-4 text-sm text-ink-2">
        <li>
          1. In App Store Connect open{" "}
          <a
            href="https://appstoreconnect.apple.com/access/integrations/api"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent"
          >
            Users and Access → Integrations <ExternalLink className="size-3" />
          </a>
        </li>
        <li>2. Generate a Team Key with the App Manager role and download the .p8 file.</li>
        <li>3. Copy the Issuer ID and the Key ID shown next to it.</li>
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Issuer ID" error={errors.issuerId}>
          <input
            name="issuerId"
            placeholder="57246542-96fe-1a63-e053-0824d011072a"
            autoComplete="off"
            className={`${inputClass} font-mono text-[13px]`}
          />
        </Field>
        <Field label="Key ID" error={errors.keyId}>
          <input name="keyId" placeholder="2X9R4HXF34" autoComplete="off" className={`${inputClass} font-mono text-[13px]`} />
        </Field>
      </div>

      <Field label="Private key" error={errors.privateKey}>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex h-12 items-center gap-3 rounded-lg border border-dashed border-line-strong px-3 text-left text-sm transition hover:border-accent hover:bg-accent-soft/40"
        >
          <span className="grid size-7 place-items-center rounded-md bg-raised text-ink-2">
            <KeyRound className="size-3.5" />
          </span>
          {keyFile ? (
            <span className="font-mono text-[13px]">{keyFile.name}</span>
          ) : (
            <span className="text-ink-3">Choose AuthKey_….p8</span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".p8"
          hidden
          aria-label="Private key file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) setKeyFile({ name: file.name, text: await file.text() });
            event.target.value = "";
          }}
        />
      </Field>

      {errors.form && <p className="rounded-lg bg-[#fdecec] px-3 py-2 text-sm text-danger">{errors.form}</p>}

      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-xs text-ink-3">
          <ShieldCheck className="size-4 text-ok" />
          Encrypted and stored only on this server.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink shadow-soft transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Checking with Apple…" : "Connect"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
