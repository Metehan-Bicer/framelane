import { Suspense } from "react";
import { AppCard, type AppCardData } from "@/components/library/app-card";
import { NewAppButton } from "@/components/library/new-app-dialog";
import { Wordmark } from "@/components/wordmark";
import { listApps } from "@/lib/apps/queries";
import { DEFAULT_DESIGN, parseDesign } from "@/lib/design/model";
import { listFrames } from "@/lib/frames/queries";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-panel/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Metehan-Bicer/framelane"
              className="rounded-lg px-3 py-2 text-sm text-ink-2 transition hover:bg-hover hover:text-ink"
            >
              GitHub
            </a>
            <NewAppButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-12">
        <Suspense fallback={<LibrarySkeleton />}>
          <Library />
        </Suspense>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6 text-xs text-ink-3">
          <span>Framelane is open source under the MIT license.</span>
          <a href="https://metehanbicer.com/" className="transition hover:text-ink">
            A project by <span className="font-medium text-ink-2">Metehan Biçer</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

async function Library() {
  const apps = await listApps();
  const cards: AppCardData[] = apps.map((app) => {
    const frames = listFrames(app.id);
    return {
      id: app.id,
      name: app.name,
      bundleId: app.bundleId,
      locales: app.locales,
      frameCount: frames.length,
      design: app.design ? parseDesign(app.design) : DEFAULT_DESIGN,
      previews: frames.slice(0, 3).map((frame) => ({
        caption: frame.captions[app.primaryLocale] ?? { badge: "", title: "", subtitle: "" },
        fileId: frame.shots[app.primaryLocale] ?? Object.values(frame.shots)[0],
      })),
    };
  });
  const frameTotal = cards.reduce((sum, card) => sum + card.frameCount, 0);
  const localeTotal = new Set(cards.flatMap((card) => card.locales)).size;

  if (cards.length === 0) return <EmptyLibrary />;

  return (
    <>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Apps</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          {cards.length} {cards.length === 1 ? "app" : "apps"}, {frameTotal} frames in {localeTotal}{" "}
          {localeTotal === 1 ? "language" : "languages"}
        </p>
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Apps">
        {cards.map((card) => (
          <AppCard key={card.id} app={card} />
        ))}
      </ul>
    </>
  );
}

function EmptyLibrary() {
  return (
    <section className="mx-auto grid max-w-lg place-items-center rounded-3xl border border-line bg-panel px-8 py-16 text-center shadow-soft">
      <div className="relative mb-10 h-40 w-56" aria-hidden>
        {[-8, 0, 8].map((rotate, index) => (
          <div
            key={rotate}
            className="absolute bottom-0 left-1/2 h-36 w-[66px] origin-bottom rounded-[10px] border border-line bg-gradient-to-b from-raised to-white shadow-soft"
            style={{ transform: `translateX(-50%) translateX(${(index - 1) * 46}px) rotate(${rotate}deg)`, zIndex: index === 1 ? 2 : 1 }}
          />
        ))}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Add your first app</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        Drop in raw screenshots, caption them in every language and export the exact sizes App Store Connect asks
        for.
      </p>
      <div className="mt-7">
        <NewAppButton />
      </div>
    </section>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-[352px] animate-pulse rounded-2xl border border-line bg-panel" />
      ))}
    </div>
  );
}
