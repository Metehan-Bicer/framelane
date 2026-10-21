import { describe, expect, it } from "vitest";
import { analyzeKeywords } from "./keywords";

describe("analyzeKeywords", () => {
  it("tidies and counts the characters it frees", () => {
    const report = analyzeKeywords("diary, mood,  diary, study", "Daybook", "");
    expect(report.tidy).toBe("diary,mood,study");
    expect(report.saved).toBe(10);
    expect(report.remaining).toBe(84);
  });

  it("flags keywords already covered by the name or subtitle", () => {
    const report = analyzeKeywords("prompts,mood journal,study", "Daybook", "Daily prompts and moods");
    expect(report.repeated).toEqual(["prompts"]);
  });

  it("matches Turkish words case-insensitively", () => {
    expect(analyzeKeywords("odak,İstanbul", "Odak sayacı", "").repeated).toEqual(["odak"]);
  });
});
