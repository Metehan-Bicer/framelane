import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/db/open", () => ({ openDb: vi.fn() }));
vi.mock("./seed", () => ({ seedDemo: vi.fn() }));

const { cleanUpWorkspaces, isWorkspaceId, WORKSPACE_TTL_DAYS } = await import("./workspaces");

const DAY = 24 * 60 * 60 * 1000;
let root = "";

function workspace(id: string, lastUsed: number) {
  fs.mkdirSync(path.join(root, id), { recursive: true });
  const marker = path.join(root, id, ".last-used");
  fs.writeFileSync(marker, "");
  fs.utimesSync(marker, lastUsed / 1000, lastUsed / 1000);
}

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("demo workspaces", () => {
  it("accepts only UUID-shaped ids", () => {
    expect(isWorkspaceId(crypto.randomUUID())).toBe(true);
    expect(isWorkspaceId("../data")).toBe(false);
    expect(isWorkspaceId(undefined)).toBe(false);
  });

  it("removes workspaces unused for longer than the TTL and keeps the rest", () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "framelane-ws-"));
    const now = Date.now();
    workspace("active", now - DAY);
    workspace("stale", now - (WORKSPACE_TTL_DAYS + 1) * DAY);
    const removed: string[] = [];
    expect(cleanUpWorkspaces(root, now, (id) => removed.push(id))).toEqual(["stale"]);
    expect(removed).toEqual(["stale"]);
  });

  it("does nothing when there are no workspaces yet", () => {
    root = path.join(os.tmpdir(), `framelane-missing-${Date.now()}`);
    expect(cleanUpWorkspaces(root)).toEqual([]);
  });
});
