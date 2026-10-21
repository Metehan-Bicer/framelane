import { createPrivateKey, sign } from "node:crypto";

export type AscCredentials = {
  issuerId: string;
  keyId: string;
  /** Contents of the AuthKey_<keyId>.p8 file. */
  privateKey: string;
};

/**
 * App Store Connect API token: an ES256 JWT that lives at most 20 minutes.
 * https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests
 */
export function createAscToken({ issuerId, keyId, privateKey }: AscCredentials, now = Date.now()) {
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const issuedAt = Math.floor(now / 1000);
  const payload = { iss: issuerId, iat: issuedAt, exp: issuedAt + 15 * 60, aud: "appstoreconnect-v1" };
  const input = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = sign("sha256", Buffer.from(input), {
    key: createPrivateKey(privateKey),
    // JWT wants the raw r||s signature, not DER.
    dsaEncoding: "ieee-p1363",
  });
  return `${input}.${signature.toString("base64url")}`;
}

/** Throws a readable error when the .p8 contents are not a P-256 private key. */
export function assertValidPrivateKey(privateKey: string) {
  let key;
  try {
    key = createPrivateKey(privateKey);
  } catch {
    throw new Error("The key is not a valid .p8 private key");
  }
  if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
    throw new Error("App Store Connect keys use the P-256 curve; this key does not");
  }
}

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}
