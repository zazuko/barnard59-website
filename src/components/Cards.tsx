import { Link } from "@tanstack/react-router";
import {
  CLI_BIN,
  type CommandEntry,
  type OperationEntry,
} from "~/data/registry.ts";
import type { Package } from "~/data/types.ts";
import { cn, formatCount, plural } from "~/lib/format.ts";
import { FlowGlyph, KindBadge } from "./KindBadge.tsx";

export function PackageCard({
  pkg,
  className,
}: {
  pkg: Package;
  className?: string;
}) {
  return (
    <Link
      to="/packages/$pkg"
      params={{ pkg: pkg.slug }}
      className={cn("card card-interactive group p-5", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate font-display font-semibold text-lg tracking-tight">
          {pkg.name}
        </h3>
        <span className="shrink-0 rounded-full bg-hover px-2 py-0.5 font-mono text-[0.6875rem] text-faint">
          v{pkg.version}
        </span>
      </div>

      {pkg.description && (
        <p className="mt-2.5 line-clamp-2 text-muted text-sm leading-relaxed">
          {pkg.description}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-faint">
          {pkg.operations.length} {plural(pkg.operations.length, "operation")}
          {pkg.commands.length > 0 && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
              {pkg.commands.length} CLI
            </span>
          )}
        </span>
        {pkg.downloadsLastMonth !== undefined && (
          <span className="shrink-0 text-faint">
            {formatCount(pkg.downloadsLastMonth)}/mo
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * One operation in a list. Used on the operations index and on package pages,
 * so the same row reads the same wherever it appears.
 */
export function OperationRow({
  operation,
  showPackage = false,
}: {
  operation: OperationEntry;
  showPackage?: boolean;
}) {
  return (
    <li>
      <Link
        to="/operations/$pkg/$"
        params={{ pkg: operation.packageSlug, _splat: operation.slug }}
        className="listrow flex items-center gap-4 py-3.5 pr-3 pl-4"
      >
        <FlowGlyph kind={operation.kind} className="hidden shrink-0 sm:block" />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-medium text-[0.9375rem]">
              {operation.label}
            </span>
            <span className="font-mono text-faint text-xs">
              {showPackage
                ? `${operation.packageSlug}/${operation.slug}`
                : operation.slug}
            </span>
          </span>
          {operation.comment && (
            <span className="mt-0.5 block truncate text-muted text-sm">
              {operation.comment}
            </span>
          )}
        </span>

        <KindBadge kind={operation.kind} className="hidden md:inline-flex" />

        <svg
          viewBox="0 0 16 16"
          className="size-4 shrink-0 text-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  );
}

/** One command in a list, led by the invocation you would actually type. */
export function CommandRow({ command }: { command: CommandEntry }) {
  return (
    <li>
      <Link
        to="/command/$pkg/$cmd"
        params={{ pkg: command.packageSlug, cmd: command.slug }}
        className="listrow flex items-center gap-4 py-3.5 pr-3 pl-4"
      >
        <span className="min-w-0 flex-1">
          <code className="font-mono text-[0.9375rem]">
            <span className="text-faint">{CLI_BIN} </span>
            {command.packageSlug}{" "}
            <span className="font-medium">{command.slug}</span>
          </code>
          <span className="mt-0.5 block truncate text-muted text-sm">
            {command.label}
          </span>
        </span>

        <svg
          viewBox="0 0 16 16"
          className="size-4 shrink-0 text-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </li>
  );
}

/**
 * Styling for one half of a prev/next pair. Callers wrap their own typed
 * <Link>, so the route and params stay checked against the route tree.
 */
export const prevNextClass =
  "card card-interactive flex min-w-0 flex-1 flex-col justify-center px-5 py-4";

export function PrevNextLabel({
  direction,
  title,
}: {
  direction: "previous" | "next";
  title: string;
}) {
  return (
    <>
      <span className="text-faint text-xs">
        {direction === "previous" ? "← Previous" : "Next →"}
      </span>
      <span className="mt-1 truncate font-medium">{title}</span>
    </>
  );
}

/** Wrapper that lays out the pair and keeps a single item on its own side. */
export function PrevNext({
  label,
  previous,
  next,
}: {
  label: string;
  previous?: React.ReactNode;
  next?: React.ReactNode;
}) {
  if (!previous && !next) return null;

  return (
    <nav aria-label={label} className="flex flex-col gap-3 sm:flex-row">
      {previous ?? <span className="hidden flex-1 sm:block" />}
      {next}
    </nav>
  );
}
