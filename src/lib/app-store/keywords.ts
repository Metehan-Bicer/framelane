import { countCharacters, METADATA_LIMITS, normalizeKeywords } from "./metadata";

export type KeywordReport = {
  keywords: string[];
  /** Keywords in tidy form: trimmed, deduplicated, no spaces after commas. */
  tidy: string;
  /** Characters freed by tidying. */
  saved: number;
  /** Characters left after tidying. */
  remaining: number;
  /**
   * Keywords that repeat a word from the name or subtitle. App Store search already
   * indexes those, so the space is better used for new words.
   */
  repeated: string[];
};

export function analyzeKeywords(keywords: string, name: string, subtitle: string): KeywordReport {
  const tidy = normalizeKeywords(keywords);
  const indexed = new Set(words(`${name} ${subtitle}`));
  const list = tidy ? tidy.split(",") : [];
  return {
    keywords: list,
    tidy,
    saved: countCharacters(keywords) - countCharacters(tidy),
    remaining: METADATA_LIMITS.keywords - countCharacters(tidy),
    repeated: list.filter((keyword) => words(keyword).every((word) => indexed.has(word))),
  };
}

function words(value: string) {
  return value
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
