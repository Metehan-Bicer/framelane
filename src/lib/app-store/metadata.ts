/** Character limits App Store Connect enforces per localization. */
export const METADATA_LIMITS = {
  name: 30,
  subtitle: 30,
  keywords: 100,
  promotionalText: 170,
  description: 4000,
  whatsNew: 4000,
} as const;

export type MetadataField = keyof typeof METADATA_LIMITS;
export type Metadata = Partial<Record<MetadataField, string>>;

export type MetadataIssue = {
  field: MetadataField;
  length: number;
  limit: number;
};

/** Counts user-perceived characters, so emoji and combined letters count once. */
export function countCharacters(value: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].length;
}

export function validateMetadata(metadata: Metadata): MetadataIssue[] {
  const issues: MetadataIssue[] = [];
  for (const field of Object.keys(METADATA_LIMITS) as MetadataField[]) {
    const value = metadata[field];
    if (value === undefined) continue;
    const length = countCharacters(value);
    const limit = METADATA_LIMITS[field];
    if (length > limit) issues.push({ field, length, limit });
  }
  return issues;
}

/**
 * Keywords are a single comma separated string. Apple ignores spaces after commas,
 * so removing them frees up characters for more keywords.
 */
export function normalizeKeywords(keywords: string): string {
  const seen = new Set<string>();
  return keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => {
      const key = keyword.toLocaleLowerCase();
      if (!keyword || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(",");
}
