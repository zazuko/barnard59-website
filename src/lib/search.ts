import { allCommands, allOperations, packages } from "~/data/registry.ts";
import type { OperationKind } from "~/data/types.ts";

export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Extra text matched against, but not displayed. */
  terms: string;
  badge?: OperationKind;
  meta?: string;
} & (
  | { kind: "package"; packageSlug: string }
  | { kind: "operation"; packageSlug: string; operationSlug: string }
  | { kind: "command"; packageSlug: string; commandSlug: string }
);

/** Flat index of everything a visitor can navigate to. Built once at module load. */
export const searchIndex: SearchItem[] = [
  ...packages.map(
    (pkg): SearchItem => ({
      id: `package:${pkg.slug}`,
      kind: "package",
      title: pkg.name,
      subtitle: pkg.description,
      terms: [pkg.slug, ...pkg.keywords].join(" "),
      packageSlug: pkg.slug,
      meta: `${pkg.operations.length} ops`,
    }),
  ),
  ...allOperations.map(
    (operation): SearchItem => ({
      id: `operation:${operation.href}`,
      kind: "operation",
      title: operation.label,
      subtitle: operation.comment,
      terms: [
        operation.packageName,
        operation.packageSlug,
        operation.slug,
        operation.importPath ?? "",
        operation.exportName ?? "",
      ].join(" "),
      packageSlug: operation.packageSlug,
      operationSlug: operation.slug,
      badge: operation.kind,
      meta: operation.packageName,
    }),
  ),
  ...allCommands.map(
    (command): SearchItem => ({
      id: `command:${command.href}`,
      kind: "command",
      // The invocation is what people remember, so match and show that.
      title: command.cli,
      subtitle: command.label,
      terms: [command.packageName, command.slug, command.source ?? ""].join(
        " ",
      ),
      packageSlug: command.packageSlug,
      commandSlug: command.slug,
      meta: command.packageName,
    }),
  ),
];

/**
 * Score a single item against a lower-cased query. Higher is better; 0 means
 * no match. Matches early in the title beat matches buried in a description.
 */
function score(item: SearchItem, query: string): number {
  const title = item.title.toLowerCase();

  if (title === query) return 1000;
  if (title.startsWith(query)) return 900 - title.length;

  // Match at the start of any word in the title, e.g. "shacl" in "Validate SHACL".
  const wordStart = new RegExp(`\\b${escapeRegExp(query)}`).test(title);
  if (wordStart) return 700 - title.length;

  if (title.includes(query)) return 500 - title.length;
  if (item.terms.toLowerCase().includes(query)) return 300;
  if (item.subtitle?.toLowerCase().includes(query)) return 150;

  return 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function search(query: string, limit = 20): SearchItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return searchIndex
    .map((item) => ({ item, score: score(item, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title),
    )
    .slice(0, limit)
    .map((entry) => entry.item);
}
