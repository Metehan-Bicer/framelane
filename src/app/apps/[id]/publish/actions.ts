"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApp } from "@/lib/apps/queries";
import { AscClient } from "@/lib/asc/client";
import {
  ascClient,
  deleteAscCredentials,
  getAscConnectionSummary,
  saveAscCredentials,
} from "@/lib/asc/connection";
import { assertValidPrivateKey } from "@/lib/asc/jwt";
import { applyMetadata, describeError, loadPublishState, type ApplyResult, type PublishState } from "@/lib/asc/publish";
import { DEMO_DISABLED_MESSAGE, isDemo } from "@/lib/demo/mode";
import { getListings } from "@/lib/listings/queries";

const credentialsInput = z.object({
  issuerId: z.string().trim().regex(/^[0-9a-f-]{36}$/i, "The Issuer ID is a UUID, shown above the keys table"),
  keyId: z.string().trim().regex(/^[A-Z0-9]{10}$/, "The Key ID is 10 letters and digits"),
  privateKey: z.string().trim().includes("PRIVATE KEY", { message: "Choose the AuthKey_….p8 file you downloaded" }),
});

export type ConnectResult = { ok: true } | { ok: false; errors: Partial<Record<"issuerId" | "keyId" | "privateKey" | "form", string>> };

export async function connectAsc(input: unknown): Promise<ConnectResult> {
  if (isDemo()) return { ok: false, errors: { form: DEMO_DISABLED_MESSAGE } };
  const parsed = credentialsInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])),
    };
  }
  try {
    assertValidPrivateKey(parsed.data.privateKey);
    await new AscClient(parsed.data).ping();
  } catch (error) {
    return { ok: false, errors: { form: describeError(error) } };
  }
  saveAscCredentials(parsed.data);
  revalidatePath("/apps/[id]/publish", "page");
  return { ok: true };
}

export async function disconnectAsc() {
  deleteAscCredentials();
  revalidatePath("/apps/[id]/publish", "page");
}

export type PublishView =
  | { connected: false; demo?: boolean }
  | {
      connected: true;
      keyId: string;
      state?: PublishState;
      error?: string;
    };

export async function loadPublish(appId: string): Promise<PublishView> {
  if (isDemo()) return { connected: false, demo: true };
  const summary = getAscConnectionSummary();
  const client = ascClient();
  if (!summary || !client) return { connected: false };
  const app = await getApp(appId);
  if (!app) throw new Error("App not found");
  try {
    return { connected: true, keyId: summary.keyId, state: await loadPublishState(client, app, await getListings(app.id)) };
  } catch (error) {
    return { connected: true, keyId: summary.keyId, error: describeError(error) };
  }
}

export async function pushMetadata(appId: string): Promise<{ results: ApplyResult[] } | { error: string }> {
  if (isDemo()) return { error: DEMO_DISABLED_MESSAGE };
  const client = ascClient();
  const app = await getApp(appId);
  if (!client || !app) return { error: "Connect App Store Connect first" };
  try {
    return { results: await applyMetadata(client, app, await getListings(app.id)) };
  } catch (error) {
    return { error: describeError(error) };
  }
}
