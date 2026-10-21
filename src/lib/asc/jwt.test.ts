import { generateKeyPairSync, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { assertValidPrivateKey, createAscToken } from "./jwt";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

describe("createAscToken", () => {
  it("creates a verifiable ES256 token with the App Store Connect claims", () => {
    const token = createAscToken({ issuerId: "issuer", keyId: "ABC123", privateKey: pem }, 1_700_000_000_000);
    const [header, payload, signature] = token.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "ES256", kid: "ABC123", typ: "JWT" });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iss: "issuer",
      iat: 1_700_000_000,
      exp: 1_700_000_900,
      aud: "appstoreconnect-v1",
    });
    const valid = verify(
      "sha256",
      Buffer.from(`${header}.${payload}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(signature, "base64url"),
    );
    expect(valid).toBe(true);
  });
});

describe("assertValidPrivateKey", () => {
  it("accepts P-256 keys and rejects anything else", () => {
    expect(() => assertValidPrivateKey(pem)).not.toThrow();
    expect(() => assertValidPrivateKey("nope")).toThrow("not a valid .p8");
    const rsa = generateKeyPairSync("rsa", { modulusLength: 1024 }).privateKey.export({ type: "pkcs8", format: "pem" });
    expect(() => assertValidPrivateKey(rsa.toString())).toThrow("P-256");
  });
});
