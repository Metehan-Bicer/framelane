import { describe, expect, it } from "vitest";
import { fromEasConfig, fromFastlane, toEasConfig, toFastlane } from "./formats";
import { EMPTY_LISTING } from "./listing";

const odaq = {
  ...EMPTY_LISTING,
  name: "Odaq",
  subtitle: "Pomodoro with a cat",
  keywords: "focus,pomodoro,timer",
  supportUrl: "https://metehanbicer.com/odaq",
};

describe("fastlane", () => {
  it("writes one file per filled field", () => {
    expect(toFastlane({ "en-US": odaq })).toEqual({
      "metadata/en-US/name.txt": "Odaq\n",
      "metadata/en-US/subtitle.txt": "Pomodoro with a cat\n",
      "metadata/en-US/keywords.txt": "focus,pomodoro,timer\n",
      "metadata/en-US/support_url.txt": "https://metehanbicer.com/odaq\n",
    });
  });

  it("round trips and ignores non-locale folders", () => {
    const files = {
      ...Object.fromEntries(Object.entries(toFastlane({ tr: odaq })).map(([path, text]) => [`fastlane/${path}`, text])),
      "fastlane/metadata/review_information/email_address.txt": "me@example.com",
      "fastlane/metadata/copyright.txt": "2026",
    };
    expect(fromFastlane(files)).toEqual({ tr: odaq });
  });
});

describe("EAS", () => {
  it("round trips through store.config.json", () => {
    const config = toEasConfig({ "en-US": odaq });
    expect(config.apple.info["en-US"]).toEqual({
      title: "Odaq",
      subtitle: "Pomodoro with a cat",
      keywords: ["focus", "pomodoro", "timer"],
      supportUrl: "https://metehanbicer.com/odaq",
    });
    expect(fromEasConfig(config)).toEqual({ "en-US": odaq });
  });

  it("keeps the rest of an existing config", () => {
    const base = { configVersion: 0, apple: { copyright: "2026 Metehan", info: { tr: { title: "Eski" } } } };
    const config = toEasConfig({ "en-US": odaq }, base);
    expect(config.apple.copyright).toBe("2026 Metehan");
    expect(config.apple.info.tr).toEqual({ title: "Eski" });
  });

  it("rejects other JSON", () => {
    expect(() => fromEasConfig({ hello: true })).toThrow();
  });
});
