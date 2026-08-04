/** Join class names, dropping anything falsy. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/** Compact counts: 980 → "980", 9984 → "10k", 41357 → "41k", 1200000 → "1.2M". */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    // Only keep a decimal while it stays below 10 once rounded, so 9984
    // reads as "10k" rather than "10.0k".
    return thousands < 9.95
      ? `${thousands.toFixed(1)}k`
      : `${Math.round(thousands)}k`;
  }
  return `${(value / 1_000_000).toFixed(1)}M`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return count === 1 ? one : many;
}

/** Zero-padded index for the editorial numbering, e.g. 0 → "01". */
export function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Sentence-case a list slug for display: "official" → "Official". */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
