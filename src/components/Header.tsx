import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { openCommandPalette } from "~/components/CommandPalette.tsx";
import { useTheme } from "~/lib/theme.ts";

const NAV = [
  { to: "/packages", label: "Packages" },
  { to: "/operations", label: "Operations" },
  { to: "/commands", label: "Commands" },
] as const;

/** Three nodes joined by two edges — a pipeline, and a fragment of a graph. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <title>barnard59</title>
      <path
        d="M7 8.5 14 14l7-5.5M7 19.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="6" cy="7.5" r="3" fill="currentColor" />
      <circle cx="6" cy="20.5" r="3" fill="currentColor" opacity="0.55" />
      <circle cx="14" cy="14" r="3.25" fill="currentColor" />
      <circle cx="22" cy="7.5" r="3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-9 cursor-pointer place-items-center rounded-control text-muted transition-colors hover:bg-hover hover:text-fg"
      aria-label={
        mounted
          ? `Switch to ${theme === "dark" ? "light" : "dark"} theme`
          : "Switch theme"
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path
          className="hidden dark:block"
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
          strokeLinejoin="round"
        />
        <g className="dark:hidden">
          <circle cx="12" cy="12" r="4.25" />
          <path
            d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.1 5.1l1.4 1.4m11 11 1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </button>
  );
}

function SearchTrigger() {
  const [shortcut, setShortcut] = useState("");

  useEffect(() => {
    setShortcut(
      navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl K",
    );
  }, []);

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-3 text-muted shadow-card transition-colors hover:border-line-strong hover:text-fg"
      aria-label="Search packages and operations"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <span className="hidden text-sm sm:inline">Search</span>
      <kbd className="hidden rounded-full bg-hover px-2 py-0.5 font-medium font-sans text-[0.6875rem] text-faint sm:inline">
        {shortcut || " "}
      </kbd>
    </button>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-line/70 border-b bg-bg/80 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-medium text-[1.0625rem] tracking-tight"
        >
          <Logo className="size-7 text-accent" />
          barnard59
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Main" className="flex items-center">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-control px-3 py-1.5 font-medium text-muted text-sm transition-colors hover:bg-hover hover:text-fg data-[status=active]:bg-accent-soft data-[status=active]:text-accent"
                activeOptions={{ exact: false }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SearchTrigger />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
