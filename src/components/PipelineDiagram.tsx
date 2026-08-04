import { Link } from "@tanstack/react-router";
import { getOperationByIri } from "~/data/registry.ts";
import type { PipelineArgument, PipelineStep } from "~/data/types.ts";
import { cn } from "~/lib/format.ts";
import { KINDS } from "./KindBadge.tsx";

function Argument({ argument }: { argument: PipelineArgument }) {
  if (argument.steps?.length) return null;

  return (
    <span className="inline-flex items-baseline gap-1 rounded-md bg-hover px-2 py-0.5 font-mono text-[0.6875rem]">
      {argument.name && <span className="text-faint">{argument.name}</span>}
      {argument.name && <span className="text-faint">=</span>}
      <span className={argument.isVariable ? "text-accent" : "text-muted"}>
        {argument.isVariable ? `$${argument.value}` : argument.value}
      </span>
    </span>
  );
}

/**
 * One step, shown as a block. When the step names an operation this site
 * documents, the whole block links to that operation's page.
 */
function Step({
  step,
  index,
  path,
}: {
  step: PipelineStep;
  index: number;
  /** Position in the tree, e.g. "2.0" — a stable identity for React keys. */
  path: string;
}) {
  const operation = step.operation
    ? getOperationByIri(step.operation)
    : undefined;
  const kind = KINDS[operation?.kind ?? "unknown"];

  const nested = [
    ...(step.steps ?? []),
    ...(step.args ?? []).flatMap((argument) => argument.steps ?? []),
  ];
  const nestedTitle = step.steps?.length
    ? step.label
    : step.args.find((argument) => argument.steps?.length)?.value;

  const inline = (
    // The dot stays pinned to the first line when a long label wraps.
    <div className="flex gap-2.5">
      <span
        aria-hidden="true"
        className={cn("mt-[0.4375rem] size-2 shrink-0 rounded-full", kind.dot)}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-medium text-[0.9375rem]">
            {operation?.label ?? step.label ?? "step"}
          </span>

          {operation ? (
            <span className="font-mono text-faint text-xs">
              {operation.packageSlug}/{operation.slug}
            </span>
          ) : (
            <span className="rounded-full bg-hover px-2 py-0.5 text-faint text-[0.6875rem]">
              {step.steps?.length ? "sub-pipeline" : "not documented"}
            </span>
          )}
        </div>

        {step.args.some((argument) => !argument.steps?.length) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.args.map((argument, position) => (
              <Argument
                key={`${argument.name ?? "arg"}-${argument.value ?? position}`}
                argument={argument}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <li className="relative pl-10">
      {/* Connector rail and the step's index. */}
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-[0.9375rem] w-px bg-line"
      />
      <span
        aria-hidden="true"
        className="absolute top-3 left-0 grid size-8 place-items-center rounded-full border border-line bg-bg font-mono text-[0.6875rem] text-faint"
      >
        {index + 1}
      </span>

      <div className="pb-3">
        {operation ? (
          <Link
            to="/operations/$pkg/$"
            params={{ pkg: operation.packageSlug, _splat: operation.slug }}
            className="card card-interactive block px-4 py-3"
          >
            {inline}
          </Link>
        ) : (
          <div className="card px-4 py-3">{inline}</div>
        )}

        {nested.length > 0 && (
          <div className="mt-2 ml-2 border-line border-l pl-4">
            <p className="py-2 text-faint text-xs">
              runs{" "}
              <span className="font-mono">{nestedTitle ?? "a pipeline"}</span>
            </p>
            <ol className="space-y-0">
              {nested.map((child, position) => (
                <Step
                  // biome-ignore lint/suspicious/noArrayIndexKey: position in the pipeline is the step's identity; this list is immutable build-time data and the same operation may repeat
                  key={`${path}.${position}`}
                  path={`${path}.${position}`}
                  step={child}
                  index={position}
                />
              ))}
            </ol>
          </div>
        )}
      </div>
    </li>
  );
}

export function PipelineDiagram({ steps }: { steps: PipelineStep[] }) {
  if (steps.length === 0) return null;

  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <Step
          key={String(index)}
          path={String(index)}
          step={step}
          index={index}
        />
      ))}
      {/* Mask the rail below the final step. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[0.9375rem] h-3 w-px bg-bg"
      />
    </ol>
  );
}
