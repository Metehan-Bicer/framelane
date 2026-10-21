import { EMPTY_LISTING, type Listing, type ListingField } from "./listing";

/**
 * Converters between Framelane listings and the two formats mobile teams already use:
 * fastlane `deliver` metadata folders and Expo EAS `store.config.json`.
 */

export type Listings = Record<string, Listing>;

// fastlane deliver: metadata/<locale>/<file>.txt
const FASTLANE_FILES: Record<ListingField, string> = {
  name: "name.txt",
  subtitle: "subtitle.txt",
  promotionalText: "promotional_text.txt",
  description: "description.txt",
  keywords: "keywords.txt",
  whatsNew: "release_notes.txt",
  supportUrl: "support_url.txt",
  marketingUrl: "marketing_url.txt",
  privacyPolicyUrl: "privacy_url.txt",
};

const FASTLANE_FIELD_BY_FILE = Object.fromEntries(
  Object.entries(FASTLANE_FILES).map(([field, file]) => [file, field as ListingField]),
);

export function toFastlane(listings: Listings): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [locale, listing] of Object.entries(listings)) {
    for (const [field, file] of Object.entries(FASTLANE_FILES) as [ListingField, string][]) {
      if (listing[field].trim()) files[`metadata/${locale}/${file}`] = `${listing[field].trim()}\n`;
    }
  }
  return files;
}

/** Accepts paths with or without a leading folder, like `fastlane/metadata/en-US/name.txt`. */
export function fromFastlane(files: Record<string, string>): Listings {
  const listings: Listings = {};
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/").filter(Boolean);
    const field = FASTLANE_FIELD_BY_FILE[parts.at(-1) ?? ""];
    const locale = parts.at(-2);
    if (!field || !locale || locale === "metadata" || locale === "default" || locale === "review_information") continue;
    listings[locale] ??= { ...EMPTY_LISTING };
    listings[locale][field] = content.replace(/\r\n/g, "\n").trim();
  }
  return listings;
}

// Expo EAS Metadata: store.config.json, apple.info.<locale>
type EasInfo = {
  title?: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  releaseNotes?: string;
  promoText?: string;
  marketingUrl?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
};

export type EasConfig = { configVersion: 0; apple: { info: Record<string, EasInfo> } & Record<string, unknown> };

export function toEasConfig(listings: Listings, base?: unknown): EasConfig {
  const config = (isEasConfig(base) ? structuredClone(base) : { configVersion: 0, apple: { info: {} } }) as EasConfig;
  config.apple.info ??= {};
  for (const [locale, listing] of Object.entries(listings)) {
    const info: EasInfo = {
      title: listing.name,
      subtitle: listing.subtitle,
      description: listing.description,
      keywords: splitKeywords(listing.keywords),
      releaseNotes: listing.whatsNew,
      promoText: listing.promotionalText,
      marketingUrl: listing.marketingUrl,
      supportUrl: listing.supportUrl,
      privacyPolicyUrl: listing.privacyPolicyUrl,
    };
    config.apple.info[locale] = dropEmpty({ ...config.apple.info[locale], ...info });
  }
  return config;
}

export function fromEasConfig(value: unknown): Listings {
  if (!isEasConfig(value)) throw new Error("Not an EAS store.config.json: apple.info is missing");
  const listings: Listings = {};
  for (const [locale, info] of Object.entries(value.apple.info)) {
    listings[locale] = {
      name: info.title ?? "",
      subtitle: info.subtitle ?? "",
      description: info.description ?? "",
      keywords: (info.keywords ?? []).join(","),
      whatsNew: info.releaseNotes ?? "",
      promotionalText: info.promoText ?? "",
      marketingUrl: info.marketingUrl ?? "",
      supportUrl: info.supportUrl ?? "",
      privacyPolicyUrl: info.privacyPolicyUrl ?? "",
    };
  }
  return listings;
}

function isEasConfig(value: unknown): value is EasConfig {
  const apple = (value as { apple?: { info?: unknown } } | null)?.apple;
  return typeof apple?.info === "object" && apple.info !== null;
}

function splitKeywords(keywords: string) {
  return keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function dropEmpty(info: EasInfo): EasInfo {
  return Object.fromEntries(
    Object.entries(info).filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value))),
  ) as EasInfo;
}
