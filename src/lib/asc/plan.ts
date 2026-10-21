import type { Listing, ListingField } from "@/lib/app-store/listing";

/** Which App Store Connect resource each Framelane field is stored on. */
export const VERSION_FIELDS = ["description", "keywords", "marketingUrl", "promotionalText", "supportUrl", "whatsNew"] as const;
export const INFO_FIELDS = ["name", "subtitle", "privacyPolicyUrl"] as const;

type VersionField = (typeof VERSION_FIELDS)[number];
type InfoField = (typeof INFO_FIELDS)[number];

export type RemoteLocale = {
  locale: string;
  version?: { id: string; fields: Partial<Record<VersionField, string | null>> };
  info?: { id: string; fields: Partial<Record<InfoField, string | null>> };
};

export type FieldChange = { field: ListingField; from: string; to: string };

export type LocalePlan = {
  locale: string;
  version: { action: "create" | "update" | "none"; id?: string; changes: FieldChange[] };
  /** `blocked` when the app has no editable app info, so name and subtitle cannot change now. */
  info: { action: "create" | "update" | "none" | "blocked"; id?: string; changes: FieldChange[] };
};

/**
 * Compares Framelane's text with what App Store Connect has. Empty local fields never
 * clear a remote value: publishing only adds or changes text, it does not erase.
 */
export function planMetadata(
  local: Record<string, Listing>,
  remote: RemoteLocale[],
  options: { infoEditable: boolean },
): LocalePlan[] {
  const byLocale = new Map(remote.map((entry) => [entry.locale, entry]));
  return Object.entries(local).map(([locale, listing]) => {
    const current = byLocale.get(locale);
    const versionChanges = diff(VERSION_FIELDS, listing, current?.version?.fields ?? {});
    const infoChanges = diff(INFO_FIELDS, listing, current?.info?.fields ?? {});
    return {
      locale,
      version: {
        action: versionChanges.length === 0 ? "none" : current?.version ? "update" : "create",
        id: current?.version?.id,
        changes: versionChanges,
      },
      info: {
        action:
          infoChanges.length === 0 ? "none" : !options.infoEditable ? "blocked" : current?.info ? "update" : "create",
        id: current?.info?.id,
        changes: infoChanges,
      },
    };
  });
}

export function hasChanges(plan: LocalePlan[]) {
  return plan.some((entry) => entry.version.action !== "none" || ["create", "update"].includes(entry.info.action));
}

function diff<F extends ListingField>(fields: readonly F[], listing: Listing, remote: Partial<Record<F, string | null>>) {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const to = listing[field].trim();
    const from = (remote[field] ?? "").trim();
    if (to && to !== from) changes.push({ field, from, to });
  }
  return changes;
}

export function changedAttributes(changes: FieldChange[]) {
  return Object.fromEntries(changes.map((change) => [change.field, change.to]));
}
