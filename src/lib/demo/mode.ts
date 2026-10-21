/** The public demo: App Store Connect is disabled and data resets every night. */
export function isDemo() {
  return process.env.FRAMELANE_DEMO === "1" || process.env.FRAMELANE_DEMO === "true";
}

export const DEMO_DISABLED_MESSAGE =
  "Publishing is turned off in the public demo. Run your own copy with Docker to connect App Store Connect.";
