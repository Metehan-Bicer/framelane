import { z } from "zod";
import { countCharacters, METADATA_LIMITS, type MetadataField } from "./metadata";

/** Everything App Store Connect shows on a product page for one language. */
export const LISTING_TEXT_FIELDS = [
  "name",
  "subtitle",
  "promotionalText",
  "description",
  "keywords",
  "whatsNew",
] as const satisfies readonly MetadataField[];

export const LISTING_URL_FIELDS = ["supportUrl", "marketingUrl", "privacyPolicyUrl"] as const;

export type ListingTextField = (typeof LISTING_TEXT_FIELDS)[number];
export type ListingUrlField = (typeof LISTING_URL_FIELDS)[number];
export type ListingField = ListingTextField | ListingUrlField;
export type Listing = Record<ListingField, string>;

export const EMPTY_LISTING: Listing = {
  name: "",
  subtitle: "",
  promotionalText: "",
  description: "",
  keywords: "",
  whatsNew: "",
  supportUrl: "",
  marketingUrl: "",
  privacyPolicyUrl: "",
};

export const FIELD_INFO: Record<ListingField, { label: string; hint: string }> = {
  name: { label: "App name", hint: "Shown under the icon and in search results." },
  subtitle: { label: "Subtitle", hint: "One short line under the name. Searchable." },
  promotionalText: { label: "Promotional text", hint: "Above the description. Can change without a new build." },
  description: { label: "Description", hint: "Not used for search ranking, write it for people." },
  keywords: { label: "Keywords", hint: "Comma separated, no spaces needed. Hidden from users." },
  whatsNew: { label: "What's new", hint: "Release notes for this version." },
  supportUrl: { label: "Support URL", hint: "Required by App Store Connect." },
  marketingUrl: { label: "Marketing URL", hint: "Optional." },
  privacyPolicyUrl: { label: "Privacy policy URL", hint: "Required for every app." },
};

// URLs are stored as typed, so autosave never fails halfway through typing one.
// The editor warns about invalid values with `isValidUrl`.
const url = z.string().max(2000);

export function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const listingSchema = z.object({
  name: z.string().max(METADATA_LIMITS.name * 2),
  subtitle: z.string().max(METADATA_LIMITS.subtitle * 2),
  promotionalText: z.string().max(METADATA_LIMITS.promotionalText * 2),
  description: z.string().max(METADATA_LIMITS.description * 2),
  keywords: z.string().max(METADATA_LIMITS.keywords * 2),
  whatsNew: z.string().max(METADATA_LIMITS.whatsNew * 2),
  supportUrl: url,
  marketingUrl: url,
  privacyPolicyUrl: url,
});

/** Fields that must be filled before App Store Connect accepts a submission. */
export const REQUIRED_FIELDS: readonly ListingField[] = ["name", "description", "keywords", "supportUrl", "privacyPolicyUrl"];

export type ListingCheck = {
  /** Required fields that are filled, out of all required fields. */
  filled: number;
  required: number;
  overLimit: ListingTextField[];
};

export function checkListing(listing: Listing): ListingCheck {
  return {
    filled: REQUIRED_FIELDS.filter((field) => listing[field].trim()).length,
    required: REQUIRED_FIELDS.length,
    overLimit: LISTING_TEXT_FIELDS.filter((field) => countCharacters(listing[field]) > METADATA_LIMITS[field]),
  };
}

export function withDefaults(value: Partial<Listing> | undefined): Listing {
  return { ...EMPTY_LISTING, ...value };
}
