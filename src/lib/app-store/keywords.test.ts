import { describe, expect, it } from "vitest";
import { analyzeKeywords } from "./keywords";

describe("analyzeKeywords", () => {
  it("tidies and counts the characters it frees", () => {
    const report = analyzeKeywords("focus, timer,  focus, study", "Odaq", "");
    expect(report.tidy).toBe("focus,timer,study");
    expect(report.saved).toBe(10);
    expect(report.remaining).toBe(83);
  });

  it("flags keywords already covered by the name or subtitle", () => {
    const report = analyzeKeywords("pomodoro,cat timer,study", "Odaq", "Pomodoro with a cat");
    expect(report.repeated).toEqual(["pomodoro"]);
  });

  it("matches Turkish words case-insensitively", () => {
    expect(analyzeKeywords("odak,İstanbul", "Odak sayacı", "").repeated).toEqual(["odak"]);
  });
});
