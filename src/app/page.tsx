import { Suspense } from "react";
import { NewAppForm } from "@/components/new-app-form";
import { APP_STORE_LOCALES, isAppStoreLocale } from "@/lib/app-store/locales";
import { listApps } from "@/lib/apps/queries";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
        <p className="mt-1 text-sm text-muted">
          Each app holds its screenshots and store metadata for every language you ship.
        </p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Suspense fallback={<p className="text-sm text-muted">Loading apps…</p>}>
          <AppList />
        </Suspense>
        <NewAppForm />
      </div>
    </div>
  );
}

async function AppList() {
  const apps = await listApps();

  if (apps.length === 0) {
    return (
      <div className="grid content-center place-items-center rounded-xl border border-dashed border-border p-12 text-center">
        <p className="font-medium">No apps yet</p>
        <p className="mt-1 text-sm text-muted">Add your first app to start designing its screenshots.</p>
      </div>
    );
  }

  return (
    <ul className="grid content-start gap-3" aria-label="Apps">
      {apps.map((app) => (
        <li key={app.id} className="rounded-xl border border-border bg-surface p-4">
          <p className="font-medium">{app.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">{app.bundleId}</p>
          <p className="mt-3 text-xs text-muted">
            {app.locales
              .map((code) => (isAppStoreLocale(code) ? APP_STORE_LOCALES[code] : code))
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
