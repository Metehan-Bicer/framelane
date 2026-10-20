export type Run = { text: string; highlight: boolean };

/** Splits a caption into runs; words wrapped in *asterisks* are highlighted. */
export function parseHighlights(input: string): Run[] {
  const runs: Run[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  for (const match of input.matchAll(pattern)) {
    if (match.index > last) runs.push({ text: input.slice(last, match.index), highlight: false });
    runs.push({ text: match[1], highlight: true });
    last = match.index + match[0].length;
  }
  if (last < input.length) runs.push({ text: input.slice(last), highlight: false });
  return runs.filter((run) => run.text.length > 0);
}

export type Word = { text: string; highlight: boolean };

/** Breaks runs into words, keeping each word's highlight state. Explicit newlines become `\n` words. */
export function toWords(runs: Run[]): Word[] {
  const words: Word[] = [];
  for (const run of runs) {
    for (const part of run.text.split(/( |\n)/)) {
      if (part === "" || part === " ") continue;
      words.push({ text: part, highlight: run.highlight });
    }
  }
  return words;
}

/**
 * Greedy line wrapping. `measure` returns the width of a string in the target font,
 * which keeps this function independent from any canvas implementation.
 */
export function wrapWords(words: Word[], maxWidth: number, measure: (text: string) => number): Word[][] {
  const lines: Word[][] = [];
  let line: Word[] = [];
  let width = 0;
  const space = measure(" ");
  for (const word of words) {
    if (word.text === "\n") {
      lines.push(line);
      line = [];
      width = 0;
      continue;
    }
    const w = measure(word.text);
    const next = line.length === 0 ? w : width + space + w;
    if (next > maxWidth && line.length > 0) {
      lines.push(line);
      line = [word];
      width = w;
    } else {
      line.push(word);
      width = next;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}
