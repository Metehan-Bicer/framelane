import { connection } from "next/server";
import { isDemo } from "@/lib/demo/mode";

/** Thin strip shown only on the public demo. Reads the environment at request time. */
export async function DemoBanner() {
  await connection();
  if (!isDemo()) return null;
  return (
    <div data-demo-banner className="flex h-8 shrink-0 items-center justify-center gap-2 bg-accent px-4 text-xs text-accent-ink">
      <span className="font-medium">Public demo.</span>
      <span className="opacity-90">Changes reset every night and App Store Connect is turned off.</span>
      <a href="https://github.com/Metehan-Bicer/framelane#quick-start" className="font-medium underline underline-offset-2">
        Run your own
      </a>
    </div>
  );
}
