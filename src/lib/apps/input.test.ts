import { describe, expect, it } from "vitest";
import { newAppInput } from "./input";

describe("newAppInput", () => {
  it("puts the primary locale first and removes duplicates", () => {
    const result = newAppInput.parse({
      name: " Daybook ",
      bundleId: "com.example.daybook",
      primaryLocale: "en-US",
      locales: ["tr", "en-US"],
    });
    expect(result).toEqual({
      name: "Daybook",
      bundleId: "com.example.daybook",
      primaryLocale: "en-US",
      locales: ["en-US", "tr"],
    });
  });

  it("rejects invalid bundle IDs and locales", () => {
    const result = newAppInput.safeParse({ name: "Daybook", bundleId: "daybook", primaryLocale: "en" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["bundleId", "primaryLocale"]);
  });
});
