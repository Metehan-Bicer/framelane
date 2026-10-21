import "server-only";

import type { App } from "@/db/schema";
import type { Listing } from "@/lib/app-store/listing";
import { AscError, type AscClient } from "./client";
import { changedAttributes, planMetadata, type LocalePlan, type RemoteLocale } from "./plan";

export type PublishTarget = {
  ascAppId: string;
  ascAppName: string;
  versionId: string;
  versionString: string;
  versionState: string;
  appInfoId: string | null;
};

export type PublishState =
  | { status: "app-not-found"; bundleId: string }
  | { status: "no-editable-version"; ascAppName: string }
  | {
      status: "ready";
      target: PublishTarget;
      plan: LocalePlan[];
      /** Existing screenshot counts per locale and display type. */
      screenshots: Record<string, Record<string, number>>;
    };

type Blocked = Exclude<PublishState, { status: "ready" }>;

export async function findTarget(client: AscClient, bundleId: string): Promise<PublishTarget | Blocked> {
  const ascApp = await client.findApp(bundleId);
  if (!ascApp) return { status: "app-not-found", bundleId };
  const version = await client.findEditableVersion(ascApp.id);
  if (!version) return { status: "no-editable-version", ascAppName: ascApp.attributes.name };
  const appInfo = await client.findEditableAppInfo(ascApp.id);
  return {
    ascAppId: ascApp.id,
    ascAppName: ascApp.attributes.name,
    versionId: version.id,
    versionString: version.attributes.versionString,
    versionState: version.attributes.appVersionState ?? version.attributes.appStoreState ?? "",
    appInfoId: appInfo?.id ?? null,
  };
}

async function remoteLocales(client: AscClient, target: PublishTarget) {
  const [versionLocs, infoLocs] = await Promise.all([
    client.versionLocalizations(target.versionId),
    target.appInfoId ? client.infoLocalizations(target.appInfoId) : Promise.resolve([]),
  ]);
  const remote = new Map<string, RemoteLocale>();
  for (const loc of versionLocs) {
    const { locale, ...fields } = loc.attributes;
    remote.set(locale, { locale, version: { id: loc.id, fields } });
  }
  for (const loc of infoLocs) {
    const { locale, ...fields } = loc.attributes;
    remote.set(locale, { ...(remote.get(locale) ?? { locale }), info: { id: loc.id, fields } });
  }
  return { versionLocs, remote: [...remote.values()] };
}

export async function loadPublishState(
  client: AscClient,
  app: Pick<App, "bundleId" | "locales">,
  listings: Record<string, Listing>,
): Promise<PublishState> {
  const target = await findTarget(client, app.bundleId);
  if ("status" in target) return target;
  const { versionLocs, remote } = await remoteLocales(client, target);
  const local = Object.fromEntries(app.locales.filter((locale) => listings[locale]).map((locale) => [locale, listings[locale]]));
  const plan = planMetadata(local, remote, { infoEditable: target.appInfoId !== null });

  const screenshots: Record<string, Record<string, number>> = {};
  await Promise.all(
    versionLocs.map(async (loc) => {
      const sets = await client.screenshotSets(loc.id);
      screenshots[loc.attributes.locale] = {};
      await Promise.all(
        sets.map(async (set) => {
          screenshots[loc.attributes.locale][set.attributes.screenshotDisplayType] = (await client.screenshots(set.id)).length;
        }),
      );
    }),
  );

  return { status: "ready", target, plan, screenshots };
}

export type ApplyResult = { locale: string; ok: boolean; message: string };

/** Applies a fresh plan, so it never acts on a stale preview. */
export async function applyMetadata(
  client: AscClient,
  app: Pick<App, "bundleId" | "locales">,
  listings: Record<string, Listing>,
): Promise<ApplyResult[]> {
  const state = await loadPublishState(client, app, listings);
  if (state.status !== "ready") throw new Error(describeState(state));
  const results: ApplyResult[] = [];
  for (const entry of state.plan) {
    try {
      const done: string[] = [];
      if (entry.version.action === "update") {
        await client.updateVersionLocalization(entry.version.id!, changedAttributes(entry.version.changes));
        done.push(`${entry.version.changes.length} version fields`);
      } else if (entry.version.action === "create") {
        await client.createVersionLocalization(state.target.versionId, {
          locale: entry.locale,
          ...changedAttributes(entry.version.changes),
        });
        done.push("version localization created");
      }
      if (entry.info.action === "update") {
        await client.updateInfoLocalization(entry.info.id!, changedAttributes(entry.info.changes));
        done.push(`${entry.info.changes.length} app info fields`);
      } else if (entry.info.action === "create") {
        await client.createInfoLocalization(state.target.appInfoId!, {
          locale: entry.locale,
          ...changedAttributes(entry.info.changes),
        });
        done.push("app info localization created");
      }
      if (done.length) results.push({ locale: entry.locale, ok: true, message: done.join(", ") });
    } catch (error) {
      results.push({ locale: entry.locale, ok: false, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

/**
 * Replacing a screenshot set takes three steps so that every request carries at most one
 * full size PNG: prepare the set (removing what is there), upload each image, then order them.
 */
export async function prepareScreenshotSet(client: AscClient, bundleId: string, locale: string, displayType: string) {
  const target = await findTarget(client, bundleId);
  if ("status" in target) throw new Error(describeState(target));
  const localizations = await client.versionLocalizations(target.versionId);
  const localization =
    localizations.find((loc) => loc.attributes.locale === locale) ??
    (await client.createVersionLocalization(target.versionId, { locale }));
  const sets = await client.screenshotSets(localization.id);
  const set =
    sets.find((item) => item.attributes.screenshotDisplayType === displayType) ??
    (await client.createScreenshotSet(localization.id, displayType));
  const existing = await client.screenshots(set.id);
  for (const screenshot of existing) await client.deleteScreenshot(screenshot.id);
  return { setId: set.id, removed: existing.length };
}

export function describeState(state: Blocked) {
  return state.status === "app-not-found"
    ? `No app with bundle ID ${state.bundleId} in this App Store Connect account`
    : `${state.ascAppName} has no version that can be edited. Create a new version in App Store Connect first.`;
}

export function describeError(error: unknown) {
  if (error instanceof AscError && error.status === 401) return "App Store Connect rejected the key. Check the Issuer ID, Key ID and .p8 file.";
  if (error instanceof AscError && error.status === 403) return "This key does not have access. Use an App Manager or Admin key.";
  return error instanceof Error ? error.message : String(error);
}
