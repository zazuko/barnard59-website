import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PrevNext, PrevNextLabel, prevNextClass } from "~/components/Cards.tsx";
import { PipelineDiagram } from "~/components/PipelineDiagram.tsx";
import { CommandLine, Snippet } from "~/components/Snippet.tsx";
import {
  getCommand,
  getCommandNeighbours,
  getPackage,
} from "~/data/registry.ts";
import { buildCommandLine, isOverridden, missingRequired } from "~/lib/cli.ts";
import { cn, plural } from "~/lib/format.ts";
import { seo } from "~/lib/seo.ts";

type PipelineView = "blocks" | "source";

export const Route = createFileRoute("/command/$pkg/$cmd")({
  loader: ({ params }) => {
    const command = getCommand(params.pkg, params.cmd);
    if (!command) throw notFound();
    return {
      command,
      pkg: getPackage(params.pkg),
      neighbours: getCommandNeighbours(command),
    };
  },
  component: CommandPage,
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { command } = loaderData;
    return seo({
      title: `${command.cli}`,
      description: command.label,
      path: command.href,
      type: "article",
    });
  },
});

function Row({
  label,
  stacked = false,
  children,
}: {
  label: string;
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "gap-1 border-line border-b px-5 py-3.5 last:border-b-0",
        !stacked && "grid sm:grid-cols-[8rem_1fr] sm:items-baseline sm:gap-4",
      )}
    >
      <dt className="text-faint text-xs">{label}</dt>
      <dd className={cn("min-w-0", stacked && "mt-1.5")}>{children}</dd>
    </div>
  );
}

function CommandPage() {
  const { command, pkg, neighbours } = Route.useLoaderData();

  const [values, setValues] = useState<Record<string, string>>({});
  const [view, setView] = useState<PipelineView>("blocks");

  // Navigating between commands reuses this component: drop the previous
  // command's variable values rather than carrying them over.
  const shown = useRef(command.href);
  if (shown.current !== command.href) {
    shown.current = command.href;
    setValues({});
    setView("blocks");
  }

  const cli = buildCommandLine(command.cli, command.variables, values);
  const missing = missingRequired(command.variables, values);
  const overrides = cli !== command.cli;

  const sourceUrl = command.source
    ? `https://unpkg.com/${command.source}`
    : undefined;

  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <Link to="/commands" className="hover:text-fg">
              Commands
            </Link>
            <span className="px-1.5">/</span>
            <Link
              to="/packages/$pkg"
              params={{ pkg: command.packageSlug }}
              className="hover:text-fg"
            >
              {command.packageSlug}
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page" className="font-mono">
              {command.slug}
            </span>
          </nav>

          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent text-xs">
            <span className="size-1.5 rounded-full bg-accent" />
            CLI command
          </span>

          <h1 className="mt-4 text-title">{command.label}</h1>

          {command.comment && (
            <p className="mt-4 max-w-2xl text-lead text-muted">
              {command.comment}
            </p>
          )}

          <div className="mt-7 max-w-3xl">
            <CommandLine command={cli} />

            {(overrides || missing.length > 0) && (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {overrides && (
                  <button
                    type="button"
                    onClick={() => setValues({})}
                    className="cursor-pointer text-accent hover:underline"
                  >
                    Reset variables
                  </button>
                )}
                {missing.length > 0 && (
                  <span className="text-faint">
                    Still need the following{" "}
                    {plural(missing.length, "variable")}:{" "}
                    {missing.map((name, index) => (
                      <span key={name}>
                        {index > 0 && ", "}
                        <code className="font-mono">{name}</code>
                      </span>
                    ))}
                  </span>
                )}
              </p>
            )}
          </div>

          <p className="mt-6 text-muted text-sm">
            Provided by{" "}
            <Link
              to="/packages/$pkg"
              params={{ pkg: command.packageSlug }}
              className="font-medium text-accent hover:underline"
            >
              {command.packageName}
            </Link>
            {pkg && <span className="text-faint"> · v{pkg.version}</span>}
          </p>
        </div>
      </header>

      <div className="shell grid gap-8 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <section>
          <h2 className="eyebrow text-faint">Reference</h2>
          <dl className="card mt-3">
            <Row label="Identifier" stacked>
              <span className="block font-mono text-[0.8125rem] text-accent [overflow-wrap:anywhere]">
                {command.iri}
              </span>
            </Row>
            <Row label="Subcommand">
              <span className="font-mono text-[0.8125rem]">{command.slug}</span>
            </Row>
            {pkg && (
              <Row label="Install">
                <CommandLine command={`npm i ${pkg.name}`} />
              </Row>
            )}
            {command.source && (
              <Row label="Pipeline file" stacked>
                <a
                  href={sourceUrl}
                  className="block font-mono text-[0.8125rem] text-accent hover:underline [overflow-wrap:anywhere]"
                >
                  {command.source} ↗
                </a>
              </Row>
            )}
            {command.pipeline && (
              <Row label="Pipeline IRI" stacked>
                <span className="block font-mono text-[0.8125rem] [overflow-wrap:anywhere]">
                  {command.pipeline}
                </span>
              </Row>
            )}
          </dl>

          <p className="mt-4 text-muted text-sm leading-relaxed">
            Commands are complete pipelines shipped with the package. Install
            it, then run the command — there is nothing to wire up yourself.
          </p>

          {command.variables.length > 0 && (
            <>
              <h2 className="eyebrow mt-8 text-faint">Variables</h2>
              <p className="mt-2 text-muted text-sm">
                Fill these in and the command above updates. Anything left blank
                — or matching the default — is omitted.
              </p>

              <div className="card mt-3">
                {command.variables.map((variable) => {
                  const value = values[variable.name] ?? "";
                  const active = isOverridden(variable, value);
                  const inputId = `variable-${variable.name}`;

                  return (
                    <div
                      key={variable.name}
                      className={cn(
                        "border-line border-b px-5 py-4 transition-colors last:border-b-0",
                        active && "bg-accent-soft/50",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={inputId}
                          className="font-mono text-[0.8125rem] text-accent"
                        >
                          {variable.name}
                        </label>
                        {!variable.required && (
                          <span className="rounded-full bg-hover px-2 py-0.5 text-faint text-[0.6875rem]">
                            optional
                          </span>
                        )}
                        {active && (
                          <span className="ml-auto text-accent text-[0.6875rem]">
                            in command ↑
                          </span>
                        )}
                      </div>

                      {variable.label && (
                        <p className="mt-1 text-muted text-sm">
                          {variable.label}
                        </p>
                      )}

                      <input
                        id={inputId}
                        type="text"
                        value={value}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [variable.name]: event.target.value,
                          }))
                        }
                        placeholder={variable.value ?? "value"}
                        className="mt-2.5 w-full rounded-control border border-line bg-bg px-2.5 py-1.5 font-mono text-xs outline-none placeholder:text-faint focus:border-accent"
                      />

                      {variable.value && (
                        <p className="mt-1.5 font-mono text-faint text-[0.6875rem] [overflow-wrap:anywhere]">
                          default: {variable.value}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow text-faint">The pipeline it runs</h2>

            {/* Only offer the switch when there is something on both sides. */}
            {command.steps.length > 0 && command.sourceCode && (
              <fieldset className="flex rounded-full border border-line bg-surface p-0.5">
                <legend className="sr-only">Pipeline view</legend>
                {(
                  [
                    ["blocks", "Blocks"],
                    ["source", "Turtle"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setView(value)}
                    aria-pressed={view === value}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 font-medium text-xs transition-colors",
                      view === value
                        ? "bg-fg text-bg"
                        : "text-muted hover:text-fg",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </fieldset>
            )}
          </div>

          {command.steps.length === 0 && !command.sourceCode ? (
            <div className="card mt-3 px-5 py-8 text-center">
              <p className="text-muted text-sm">
                This package does not publish its pipeline definition.
              </p>
              {command.source && (
                <p className="mt-2 font-mono text-faint text-xs">
                  {command.source}
                </p>
              )}
            </div>
          ) : view === "blocks" && command.steps.length > 0 ? (
            <>
              <p className="mt-2 text-muted text-sm">
                {command.steps.length} {plural(command.steps.length, "step")},
                top to bottom. Steps that map to a documented operation link to
                it.
              </p>
              <div className="mt-4">
                <PipelineDiagram steps={command.steps} />
              </div>
            </>
          ) : (
            command.sourceCode && (
              <Snippet
                code={command.sourceCode}
                caption={command.source ?? "pipeline.ttl"}
                className="mt-3"
              />
            )
          )}
        </section>
      </div>

      <div className="shell pb-12">
        <PrevNext
          label={`Other commands in ${command.packageName}`}
          previous={
            neighbours.previous && (
              <Link
                to="/command/$pkg/$cmd"
                params={{
                  pkg: neighbours.previous.packageSlug,
                  cmd: neighbours.previous.slug,
                }}
                className={prevNextClass}
              >
                <PrevNextLabel
                  direction="previous"
                  title={neighbours.previous.cli}
                />
              </Link>
            )
          }
          next={
            neighbours.next && (
              <Link
                to="/command/$pkg/$cmd"
                params={{
                  pkg: neighbours.next.packageSlug,
                  cmd: neighbours.next.slug,
                }}
                className={cn(prevNextClass, "sm:text-right")}
              >
                <PrevNextLabel direction="next" title={neighbours.next.cli} />
              </Link>
            )
          }
        />
      </div>
    </>
  );
}
