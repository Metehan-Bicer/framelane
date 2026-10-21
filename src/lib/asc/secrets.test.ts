import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, loadSecretKey } from "./secrets";

describe("secrets", () => {
  it("round trips and rejects a different key", () => {
    const key = loadSecretKey("", "one");
    const sealed = encrypt("-----BEGIN PRIVATE KEY-----", key);
    expect(sealed).not.toContain("PRIVATE");
    expect(decrypt(sealed, key)).toBe("-----BEGIN PRIVATE KEY-----");
    expect(() => decrypt(sealed, loadSecretKey("", "two"))).toThrow();
  });

  it("creates a key file once and reuses it", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "framelane-"));
    const first = loadSecretKey(dir, "");
    expect(loadSecretKey(dir, "")).toEqual(first);
    expect(fs.statSync(path.join(dir, "secret.key")).mode & 0o777).toBe(0o600);
    fs.rmSync(dir, { recursive: true });
  });
});
