import path from "node:path";
import { getDb } from "@/db";
import { uploadsDir } from "@/lib/paths";
import { isDemo } from "./mode";
import { resetDemo } from "./seed";

/** In the public demo, reset to Daybook when the server starts and every night at 03:00. */
export function startDemoResets() {
  if (!isDemo()) return;
  const reset = () => resetDemo(getDb(), uploadsDir, path.join(process.cwd(), "demo/screens"));
  reset();
  const scheduleNext = () => {
    const next = new Date();
    next.setHours(3, 0, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    setTimeout(() => {
      reset();
      scheduleNext();
    }, next.getTime() - Date.now());
  };
  scheduleNext();
}
