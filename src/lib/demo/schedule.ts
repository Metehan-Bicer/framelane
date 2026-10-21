import { isDemo } from "./mode";
import { cleanUpWorkspaces } from "./workspaces";

/** In the public demo, remove unused visitor workspaces on start and every hour. */
export function startDemoCleanup() {
  if (!isDemo()) return;
  cleanUpWorkspaces();
  setInterval(() => cleanUpWorkspaces(), 60 * 60 * 1000).unref();
}
