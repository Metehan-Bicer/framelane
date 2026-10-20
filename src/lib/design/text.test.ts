import { describe, expect, it } from "vitest";
import { parseHighlights, toWords, wrapWords } from "./text";

describe("parseHighlights", () => {
  it("marks words between asterisks", () => {
    expect(parseHighlights("Focus with a *cat* by your side")).toEqual([
      { text: "Focus with a ", highlight: false },
      { text: "cat", highlight: true },
      { text: " by your side", highlight: false },
    ]);
  });

  it("keeps unmatched asterisks as text", () => {
    expect(parseHighlights("5* rated")).toEqual([{ text: "5* rated", highlight: false }]);
  });
});

describe("wrapWords", () => {
  const measure = (text: string) => text.length * 10;

  it("wraps greedily and keeps highlights per word", () => {
    const lines = wrapWords(toWords(parseHighlights("Breaks feel like *breaks*")), 110, measure);
    expect(lines.map((line) => line.map((w) => w.text).join(" "))).toEqual(["Breaks feel", "like breaks"]);
    expect(lines[1][1].highlight).toBe(true);
  });

  it("honours explicit line breaks", () => {
    const lines = wrapWords(toWords(parseHighlights("No ads.\nNo account.")), 1000, measure);
    expect(lines).toHaveLength(2);
  });

  it("puts a word longer than the line on its own line", () => {
    expect(wrapWords(toWords([{ text: "a verylongword b", highlight: false }]), 50, measure)).toHaveLength(3);
  });
});
