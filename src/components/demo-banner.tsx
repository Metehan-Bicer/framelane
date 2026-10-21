import { connection } from "next/server";
import { startOver } from "@/lib/demo/actions";
import { isDemo } from "@/lib/demo/mode";
import { WORKSPACE_TTL_DAYS } from "@/lib/demo/workspaces";

/** Thin strip shown only on the public demo. Reads the environment at request time. */
export async function DemoBanner() {
  await connection();
  if (!isDemo()) return null;
  return (
    <div data-demo-banner className="flex h-8 shrink-0 items-center justify-center gap-3 bg-accent px-4 text-xs text-accent-ink">
      <span className="truncate">
        <span className="font-medium">Public demo.</span>{" "}
        <span className="hidden opacity-90 sm:inline">
          This copy is yours alone and is kept for {WORKSPACE_TTL_DAYS} days after your last visit. App Store Connect is turned off.
        </span>
      </span>
      <form action={startOver} className="shrink-0">
        <button type="submit" className="font-medium underline underline-offset-2">
          Start over
        </button>
      </form>
      <a href="https://github.com/Metehan-Bicer/framelane#quick-start" className="shrink-0 font-medium underline underline-offset-2">
        Run your own
      </a>
    </div>
  );
}
