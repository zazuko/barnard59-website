import { Fragment, type ReactNode, useEffect, useState } from "react";
import { cn } from "~/lib/format.ts";

/**
 * Tokens of the tiny Turtle subset that appears in operation snippets.
 * Order matters: the first pattern to match at a position wins.
 */
const TOKENS: Array<[RegExp, string]> = [
  [/^<[^>]*>/, "tok-iri"], // <node:barnard59-rdf/map.js#default>
  [/^"(?:[^"\\]|\\.)*"/, "tok-string"],
  [/^#[^\n]*/, "tok-punct"], // comment
  [/^[A-Za-z][\w-]*:[\w./#-]*/, "tok-prefix"], // code:implementedBy, p:Step
  [/^[[\];.,()]/, "tok-punct"],
  [/^\s+/, ""],
  [/^[^\s<"#[\];.,()]+/, ""],
];

function highlight(source: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = source;
  let key = 0;

  while (rest.length > 0) {
    let matched = false;

    for (const [pattern, className] of TOKENS) {
      const match = pattern.exec(rest);
      if (!match) continue;

      const text = match[0];
      nodes.push(
        className ? (
          <span key={key++} className={className}>
            {text}
          </span>
        ) : (
          text
        ),
      );
      rest = rest.slice(text.length);
      matched = true;
      break;
    }

    // Defensive: never loop forever on an unexpected character.
    if (!matched) {
      nodes.push(rest[0]);
      rest = rest.slice(1);
    }
  }

  return nodes;
}

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard blocked (insecure context or denied permission).
        }
      }}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-control px-2.5 py-1.5 font-medium text-muted text-xs transition-colors hover:bg-hover hover:text-fg",
        copied && "text-source",
        className,
      )}
      aria-label={copied ? "Copied to clipboard" : label}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        {copied ? (
          <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" />
        ) : (
          <>
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.75" />
            <path d="M10.5 3.5a1.5 1.5 0 0 0-1.5-1h-5a2 2 0 0 0-2 2v5a1.5 1.5 0 0 0 1 1.5" />
          </>
        )}
      </svg>
      {copied ? "Copied" : label}
    </button>
  );
}

/**
 * Split a command before each flag so that a long invocation wraps between
 * arguments rather than in the middle of one.
 */
function commandSegments(command: string): string[] {
  return command.split(/\s+(?=-{1,2}[A-Za-z])/);
}

/**
 * A shell command with a copy affordance, e.g. `npm i barnard59-ftp`.
 *
 * The box hugs its content and only grows to the width it needs, up to the
 * space available — so a short command stays short and a long one wraps.
 */
export function CommandLine({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const segments = commandSegments(command);

  return (
    <span
      className={cn(
        "flex w-fit max-w-full items-start gap-2 rounded-control border border-line bg-surface py-1.5 pr-1.5 pl-3.5",
        className,
      )}
    >
      {/* Real spaces between the segments, so selecting the text by hand still
          copies a single valid command line. */}
      <code className="min-w-0 py-1 font-mono text-sm leading-relaxed">
        <span className="text-faint">$ </span>
        {segments.map((segment, index) => (
          <Fragment key={String(index)}>
            {index > 0 && " "}
            <span className="inline-block whitespace-nowrap">{segment}</span>
          </Fragment>
        ))}
      </code>
      <CopyButton value={command} label="" className="mt-0.5 shrink-0" />
    </span>
  );
}

export function Snippet({
  code,
  caption,
  className,
}: {
  code: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-card border border-line",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-line border-b bg-surface px-4 py-2.5">
        <figcaption className="truncate font-medium text-faint text-xs">
          {caption ?? "Turtle"}
        </figcaption>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto bg-surface p-4 font-mono text-[0.8125rem] leading-relaxed">
        <code>{highlight(code)}</code>
      </pre>
    </figure>
  );
}
