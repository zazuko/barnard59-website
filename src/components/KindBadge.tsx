import type { OperationKind } from "~/data/types.ts";
import { cn } from "~/lib/format.ts";

/**
 * Where an operation sits in a pipeline. Each kind keeps its own hue across
 * the whole site, so the colour alone identifies it once you have seen it —
 * always paired with the word, never colour on its own.
 */
export const KINDS: Record<
  OperationKind,
  { label: string; dot: string; text: string; soft: string; border: string }
> = {
  source: {
    label: "source",
    dot: "bg-source",
    text: "text-source",
    soft: "bg-source-soft",
    border: "border-source/30",
  },
  transform: {
    label: "transform",
    dot: "bg-transform",
    text: "text-transform",
    soft: "bg-transform-soft",
    border: "border-transform/30",
  },
  sink: {
    label: "sink",
    dot: "bg-sink",
    text: "text-sink",
    soft: "bg-sink-soft",
    border: "border-sink/30",
  },
  unknown: {
    label: "step",
    dot: "bg-faint",
    text: "text-faint",
    soft: "bg-hover",
    border: "border-line",
  },
};

export function KindBadge({
  kind,
  size = "sm",
  className,
}: {
  kind: OperationKind;
  size?: "sm" | "md";
  className?: string;
}) {
  const style = KINDS[kind];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium",
        style.soft,
        style.text,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", style.dot)}
      />
      {style.label}
    </span>
  );
}

/**
 * Miniature pipeline diagram: which side of the stream the operation touches.
 * Filled dots are the ends it connects to.
 */
export function FlowGlyph({
  kind,
  className,
}: {
  kind: OperationKind;
  className?: string;
}) {
  const style = KINDS[kind];
  const readable = kind === "source" || kind === "transform";
  const writable = kind === "sink" || kind === "transform";

  return (
    <svg
      viewBox="0 0 44 12"
      className={cn("h-3 w-11", className)}
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="4"
        y1="6"
        x2="40"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.25"
        className="text-line-strong"
      />
      <circle
        cx="6"
        cy="6"
        r="3.5"
        className={writable ? style.text : "text-line-strong"}
        fill={writable ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle
        cx="38"
        cy="6"
        r="3.5"
        className={readable ? style.text : "text-line-strong"}
        fill={readable ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
