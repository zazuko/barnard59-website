import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDeferredValue, useMemo } from "react";
import { OperationRow } from "~/components/Cards.tsx";
import { KINDS } from "~/components/KindBadge.tsx";
import { allOperations, packages, stats } from "~/data/registry.ts";
import type { OperationKind } from "~/data/types.ts";
import { cn, plural } from "~/lib/format.ts";
import { seo } from "~/lib/seo.ts";

type OperationsSearch = {
  q?: string;
  kind?: OperationKind;
  pkg?: string;
};

const KIND_VALUES: OperationKind[] = ["source", "transform", "sink"];

/**
 * Hand-rolled so the filters live in the URL (and stay shareable) without
 * shipping a schema library to the browser.
 */
function validateSearch(search: Record<string, unknown>): OperationsSearch {
  const q = typeof search.q === "string" && search.q ? search.q : undefined;
  const kind = KIND_VALUES.find((value) => value === search.kind);
  const pkg =
    typeof search.pkg === "string" &&
    packages.some((p) => p.slug === search.pkg)
      ? search.pkg
      : undefined;

  return { q, kind, pkg };
}

export const Route = createFileRoute("/operations/")({
  validateSearch,
  component: OperationsIndex,
  head: () =>
    seo({
      title: "Operations",
      description: `Every barnard59 pipeline operation in one place — ${stats.operations} steps across ${stats.packages} packages, filterable by kind and package.`,
      path: "/operations",
    }),
});

function OperationsIndex() {
  const { q = "", kind, pkg } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Keeps typing responsive while the list re-filters.
  const deferredQuery = useDeferredValue(q);

  function setSearch(next: Partial<OperationsSearch>) {
    navigate({
      search: (current) => ({ ...current, ...next }),
      replace: true,
      resetScroll: false,
    });
  }

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return allOperations.filter((operation) => {
      if (kind && operation.kind !== kind) return false;
      if (pkg && operation.packageSlug !== pkg) return false;
      if (!needle) return true;

      return (
        operation.label.toLowerCase().includes(needle) ||
        operation.comment?.toLowerCase().includes(needle) ||
        operation.packageName.toLowerCase().includes(needle) ||
        operation.slug.toLowerCase().includes(needle) ||
        operation.importPath?.toLowerCase().includes(needle)
      );
    });
  }, [deferredQuery, kind, pkg]);

  const filtered = Boolean(q || kind || pkg);

  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page">Operations</span>
          </nav>

          <h1 className="mt-5 text-title">Every operation.</h1>
          <p className="mt-4 max-w-2xl text-lead text-muted">
            All {stats.operations} steps declared across {stats.packages}{" "}
            packages. Filter by kind or package, or search by name.
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------ Filters */}
      <div className="sticky top-16 z-30 border-line border-b bg-bg/85 backdrop-blur-xl">
        <div className="shell flex flex-wrap items-center gap-2.5 py-3.5">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 focus-within:border-accent">
            <span className="sr-only">Search operations</span>
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0 text-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(event) =>
                setSearch({ q: event.target.value || undefined })
              }
              placeholder="Search operations…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
            />
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearch({ kind: undefined })}
              aria-pressed={!kind}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
                kind
                  ? "text-muted hover:bg-hover hover:text-fg"
                  : "bg-fg text-bg",
              )}
            >
              All
            </button>
            {KIND_VALUES.map((value) => {
              const style = KINDS[value];
              const active = kind === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setSearch({ kind: active ? undefined : value })
                  }
                  aria-pressed={active}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
                    active
                      ? cn(style.soft, style.text)
                      : "text-muted hover:bg-hover hover:text-fg",
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", style.dot)}
                    aria-hidden="true"
                  />
                  {style.label}s
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 focus-within:border-accent">
            <span className="sr-only">Filter by package</span>
            <select
              value={pkg ?? ""}
              onChange={(event) =>
                setSearch({ pkg: event.target.value || undefined })
              }
              className="cursor-pointer bg-transparent text-sm outline-none"
            >
              <option value="">All packages</option>
              {packages
                .filter((entry) => entry.operations.length > 0)
                .map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.name}
                  </option>
                ))}
            </select>
          </label>

          <p
            aria-live="polite"
            className="ml-auto shrink-0 whitespace-nowrap text-faint text-xs"
          >
            {results.length} {plural(results.length, "result")}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------ Results */}
      <div className="shell py-8">
        {results.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <p className="text-lead text-muted">
              No operation matches those filters.
            </p>
            <button
              type="button"
              onClick={() =>
                setSearch({ q: undefined, kind: undefined, pkg: undefined })
              }
              className="mt-5 cursor-pointer rounded-control border border-line px-4 py-2 font-medium text-sm transition-colors hover:bg-hover"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {filtered && (
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSearch({ q: undefined, kind: undefined, pkg: undefined })
                  }
                  className="cursor-pointer text-accent text-xs hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
            <ul className="card divide-y divide-line p-1.5">
              {results.map((operation) => (
                <OperationRow
                  key={operation.href}
                  operation={operation}
                  showPackage
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
