import { describe, expect, it } from "vitest";
import { fromEasConfig, fromFastlane, toEasConfig, toFastlane } from "./formats";
import { EMPTY_LISTING } from "./listing";

const daybook = {
  ...EMPTY_LISTING,
  name: "Daybook",
  subtitle: "Prompts, moods and streaks",
  keywords: "journal,mood,streak",
  supportUrl: "https://example.com/daybook",
};

describe("fastlane", () => {
  it("writes one file per filled field", () => {
    expect(toFastlane({ "en-US": daybook })).toEqual({
      "metadata/en-US/name.txt": "Daybook\n",
      "metadata/en-US/subtitle.txt": "Prompts, moods and streaks\n",
      "metadata/en-US/keywords.txt": "journal,mood,streak\n",
      "metadata/en-US/support_url.txt": "https://example.com/daybook\n",
    });
  });

  it("round trips and ignores non-locale folders", () => {
    const files = {
      ...Object.fromEntries(Object.entries(toFastlane({ tr: daybook })).map(([path, text]) => [`fastlane/${path}`, text])),
      "fastlane/metadata/review_information/email_address.txt": "me@example.com",
      "fastlane/metadata/copyright.txt": "2026",
    };
    expect(fromFastlane(files)).toEqual({ tr: daybook });
  });
});

describe("EAS", () => {
  it("round trips through store.config.json", () => {
    const config = toEasConfig({ "en-US": daybook });
    expect(config.apple.info["en-US"]).toEqual({
      title: "Daybook",
      subtitle: "Prompts, moods and streaks",
      keywords: ["journal", "mood", "streak"],
      supportUrl: "https://example.com/daybook",
    });
    expect(fromEasConfig(config)).toEqual({ "en-US": daybook });
  });

  it("keeps the rest of an existing config", () => {
    const base = { configVersion: 0, apple: { copyright: "2026 Metehan", info: { tr: { title: "Eski" } } } };
    const config = toEasConfig({ "en-US": daybook }, base);
    expect(config.apple.copyright).toBe("2026 Metehan");
    expect(config.apple.info.tr).toEqual({ title: "Eski" });
  });

  it("rejects other JSON", () => {
    expect(() => fromEasConfig({ hello: true })).toThrow();
  });
});
