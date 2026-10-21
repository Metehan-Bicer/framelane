import { describe, expect, it } from "vitest";
import { isAuthorized } from "./basic";

const header = (value: string) => `Basic ${Buffer.from(value).toString("base64")}`;

describe("isAuthorized", () => {
  it("accepts the right user and password, including colons in the password", () => {
    expect(isAuthorized(header("admin:pa:ss"), "admin", "pa:ss")).toBe(true);
  });

  it("rejects wrong or malformed credentials", () => {
    expect(isAuthorized(header("admin:nope"), "admin", "pa:ss")).toBe(false);
    expect(isAuthorized(header("adminpass"), "admin", "pass")).toBe(false);
    expect(isAuthorized("Bearer token", "admin", "pass")).toBe(false);
    expect(isAuthorized(null, "admin", "pass")).toBe(false);
  });
});
