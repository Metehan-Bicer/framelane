import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Checks an HTTP Basic Authorization header. Comparing hashes keeps the comparison constant
 * time even when the lengths differ.
 */
export function isAuthorized(header: string | null, username: string, password: string) {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  return same(user, username) && same(pass, password);
}

function same(a: string, b: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}
