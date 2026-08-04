import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stats } from "~/data/registry.ts";
import { cn } from "~/lib/format.ts";
import { type SearchItem, search } from "~/lib/search.ts";
import { KindBadge } from "./KindBadge.tsx";

/** Lets the header button open the palette without a shared context. */
const OPEN_EVENT = "barnard59:open-search";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => search(query), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (item: SearchItem) => {
      close();
      if (item.kind === "package") {
        navigate({ to: "/packages/$pkg", params: { pkg: item.packageSlug } });
      } else if (item.kind === "command") {
        navigate({
          to: "/command/$pkg/$cmd",
          params: { pkg: item.packageSlug, cmd: item.commandSlug },
        });
      } else {
        navigate({
          to: "/operation/$pkg/$",
          params: { pkg: item.packageSlug, _splat: item.operationSlug },
        });
      }
    },
    [close, navigate],
  );

  // Global shortcuts: ⌘K / Ctrl-K to open, "/" when not already typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    }

    function onOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open]);

  // Focus the field and lock background scrolling while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the highlighted row in view as the selection moves.
  useEffect(() => {
    const item = results[active];
    if (!item) return;
    document
      .getElementById(`result-${item.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  if (!open) return null;

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) =>
        results.length ? (index - 1 + results.length) % results.length : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[active];
      if (item) go(item);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss, Escape is handled on the input */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss, Escape is handled on the input */}
      <div
        className="absolute inset-0 bg-fg/25 backdrop-blur-sm"
        onClick={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search packages and operations"
        className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-line bg-raised shadow-pop"
      >
        <div className="flex items-center gap-3 border-line border-b px-4">
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
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={`Search ${stats.packages} packages and ${stats.operations} operations…`}
            className="w-full bg-transparent py-4 text-base outline-none placeholder:text-faint"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={
              results[active] ? `result-${results[active].id}` : undefined
            }
          />
          <button
            type="button"
            onClick={close}
            className="shrink-0 cursor-pointer rounded-full bg-hover px-2.5 py-1 font-medium text-faint text-xs transition-colors hover:text-fg"
          >
            Esc
          </button>
        </div>

        {query.trim() && results.length === 0 && (
          <p className="px-4 py-10 text-center text-muted text-sm">
            Nothing matches “{query}”.
          </p>
        )}

        {results.length > 0 && (
          <div
            id="search-results"
            role="listbox"
            aria-label="Results"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {results.map((item, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handling lives on the combobox input
              <div
                key={item.id}
                id={`result-${item.id}`}
                role="option"
                // Focus stays on the input; aria-activedescendant points here.
                tabIndex={-1}
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item)}
                className={cn(
                  "mx-1.5 flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors",
                  index === active && "bg-hover",
                )}
              >
                <span className="w-9 shrink-0 font-medium text-[0.6875rem] text-faint uppercase tracking-wide">
                  {item.kind === "package"
                    ? "pkg"
                    : item.kind === "command"
                      ? "cli"
                      : "op"}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="block truncate text-muted text-xs">
                      {item.subtitle}
                    </span>
                  )}
                </span>

                {item.badge && <KindBadge kind={item.badge} />}
                <span className="hidden shrink-0 font-mono text-faint text-xs sm:block">
                  {item.meta}
                </span>
              </div>
            ))}
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-10 text-center">
            <p className="text-muted text-sm">
              Search across every package and operation.
            </p>
            <p className="mt-3 text-faint text-xs">
              ↑ ↓ to navigate · ↵ to open · esc to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
