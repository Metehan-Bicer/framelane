import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { connections } from "@/db/schema";
import { dataDir } from "@/lib/paths";
import { AscClient } from "./client";
import type { AscCredentials } from "./jwt";
import { decrypt, encrypt, loadSecretKey } from "./secrets";

const ID = "app-store-connect";

export function getAscCredentials(): AscCredentials | null {
  const row = getDb().select().from(connections).where(eq(connections.id, ID)).get();
  if (!row) return null;
  return { issuerId: row.issuerId, keyId: row.keyId, privateKey: decrypt(row.encryptedKey, loadSecretKey(dataDir)) };
}

export function getAscConnectionSummary() {
  const row = getDb()
    .select({ issuerId: connections.issuerId, keyId: connections.keyId, createdAt: connections.createdAt })
    .from(connections)
    .where(eq(connections.id, ID))
    .get();
  return row ?? null;
}

export function saveAscCredentials(credentials: AscCredentials) {
  const values = {
    issuerId: credentials.issuerId,
    keyId: credentials.keyId,
    encryptedKey: encrypt(credentials.privateKey, loadSecretKey(dataDir)),
  };
  getDb()
    .insert(connections)
    .values({ id: ID, ...values })
    .onConflictDoUpdate({ target: connections.id, set: values })
    .run();
}

export function deleteAscCredentials() {
  getDb().delete(connections).where(eq(connections.id, ID)).run();
}

export function ascClient() {
  const credentials = getAscCredentials();
  return credentials ? new AscClient(credentials) : null;
}
