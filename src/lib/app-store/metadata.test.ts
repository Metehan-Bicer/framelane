import { describe, expect, it } from "vitest";
import { countCharacters, normalizeKeywords, validateMetadata } from "./metadata";

describe("countCharacters", () => {
  it("counts emoji and combined letters once", () => {
    expect(countCharacters("Odaq 🍅")).toBe(6);
    expect(countCharacters("👨‍👩‍👧")).toBe(1);
    expect(countCharacters("ışığı")).toBe(5);
  });
});

describe("validateMetadata", () => {
  it("accepts values within limits", () => {
    expect(validateMetadata({ name: "Odaq", subtitle: "Focus timer" })).toEqual([]);
  });

  it("reports fields over the limit", () => {
    expect(validateMetadata({ name: "x".repeat(31) })).toEqual([
      { field: "name", length: 31, limit: 30 },
    ]);
  });
});

describe("normalizeKeywords", () => {
  it("trims spaces, drops empty entries and duplicates", () => {
    expect(normalizeKeywords(" focus, pomodoro ,, Focus,timer ")).toBe("focus,pomodoro,timer");
  });
});
