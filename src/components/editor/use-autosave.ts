"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "saving" | "error";

/**
 * Debounced background saves keyed by what they write, so typing in one caption
 * never cancels the save of another. Exposes one status for the whole editor.
 */
export function useAutosave(delay = 450) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(0);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const run = useCallback(async (task: () => Promise<unknown>) => {
    inFlight.current += 1;
    setStatus("saving");
    try {
      await task();
      inFlight.current -= 1;
      if (inFlight.current === 0 && timers.current.size === 0) setStatus("saved");
    } catch {
      inFlight.current -= 1;
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (key: string, task: () => Promise<unknown>) => {
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      setStatus("saving");
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          void run(task);
        }, delay),
      );
    },
    [delay, run],
  );

  useEffect(() => {
    const pending = timers.current;
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.size > 0 || inFlight.current > 0) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { status, schedule, run };
}
