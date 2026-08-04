import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageCard } from "~/components/Cards.tsx";
import { KINDS } from "~/components/KindBadge.tsx";
import { CopyButton, Snippet } from "~/components/Snippet.tsx";
import { allCommands, CLI_BIN, packages, stats } from "~/data/registry.ts";
import type { OperationKind } from "~/data/types.ts";
import { cn, plural } from "~/lib/format.ts";
import { GUIDE_URL } from "~/lib/links.ts";
import { seo } from "~/lib/seo.ts";

export const Route = createFileRoute("/")({
  component: Home,
  head: () =>
    seo({
      title: "barnard59",
      description:
        "A toolkit for building Linked Data pipelines in Node.js, assembled from small composable operations described in RDF.",
      path: "/",
    }),
});

const EXAMPLE = `<#pipeline> a p:Pipeline ;
  p:steps [
    p:stepList (
      <#readCsv>
      <#toQuads>
      <#writeGraph>
    )
  ] .`;

const STEP_KINDS: Array<{
  kind: OperationKind;
  title: string;
  copy: string;
  count: number;
}> = [
  {
    kind: "source",
    title: "Sources",
    copy: "Open a file, query an endpoint, fetch a URL. They start the stream.",
    count: stats.sources,
  },
  {
    kind: "transform",
    title: "Transforms",
    copy: "Map, filter, validate, split. They read the stream and pass it on.",
    count: stats.transforms,
  },
  {
    kind: "sink",
    title: "Sinks",
    copy: "Write to a store, a graph, a file. They end the stream.",
    count: stats.sinks,
  },
];

function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="aurora relative overflow-hidden">
        <div className="shell relative grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-muted text-xs shadow-card backdrop-blur">
              <span className="size-1.5 rounded-full bg-source" />
              {stats.packages} packages · {stats.operations} operations ·{" "}
              {stats.commands} commands
            </span>

            <h1 className="mt-6 text-display">
              Build data pipelines
              <br />
              out of <span className="text-accent">small pieces</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lead text-muted">
              barnard59 assembles RDF processing pipelines from composable
              steps. Every step is described in RDF, so a pipeline is data you
              can read, share and generate — not code you have to trust.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/operations"
                className="inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 font-medium text-accent-fg text-sm shadow-lift transition-opacity hover:opacity-90"
              >
                Explore operations
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href={GUIDE_URL}
                className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-5 py-2.5 font-medium text-sm shadow-card transition-colors hover:border-line-strong"
              >
                Read the guide
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Supporting detail, not a third call to action. */}
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-muted">Already convinced?</span>
              <code className="font-mono">npm i barnard59</code>
              <CopyButton value="npm i barnard59" label="" />
            </p>
          </div>

          {/* A pipeline, drawn as the thing it is. */}
          <div className="card p-6 lg:p-7">
            <p className="eyebrow text-faint">A pipeline is a list of steps</p>
            <Snippet
              code={EXAMPLE}
              caption="pipeline.ttl"
              className="mt-4 border-0 shadow-none [&>div]:bg-hover [&>pre]:bg-hover"
            />
            <div className="mt-5 flex items-center justify-between gap-2 text-xs">
              {["read", "transform", "write"].map((step, index) => (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      index === 0
                        ? "bg-source"
                        : index === 1
                          ? "bg-transform"
                          : "bg-sink",
                    )}
                  />
                  <span className="truncate text-muted">{step}</span>
                  {index < 2 && (
                    <span className="h-px flex-1 bg-line-strong" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Three kinds */}
      <section className="shell py-16 lg:py-20">
        <div className="reveal max-w-2xl">
          <p className="eyebrow text-accent">How it works</p>
          <h2 className="mt-3 text-title">
            Three kinds of step, and that is the whole model.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEP_KINDS.map((step) => {
            const style = KINDS[step.kind];
            return (
              <Link
                key={step.kind}
                to="/operations"
                search={{ kind: step.kind }}
                className="card card-interactive reveal p-6"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-medium text-xs",
                      style.soft,
                      style.text,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", style.dot)} />
                    {step.title}
                  </span>
                  <span className="font-display font-semibold text-2xl tabular-nums">
                    {step.count}
                  </span>
                </div>
                <p className="mt-4 text-muted text-sm leading-relaxed">
                  {step.copy}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ Packages */}
      <section className="border-line border-t bg-surface/40">
        <div className="shell py-16 lg:py-20">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-accent">The catalogue</p>
              <h2 className="mt-3 text-title">
                {stats.packages} packages. Nothing hidden.
              </h2>
            </div>
            <Link
              to="/packages"
              className="font-medium text-accent text-sm hover:underline"
            >
              Package details →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.name} pkg={pkg} className="reveal" />
            ))}
          </div>

          <p className="mt-8 text-center text-muted text-sm">
            {stats.operations} {plural(stats.operations, "operation")} in total.{" "}
            <Link to="/operations" className="text-accent hover:underline">
              Browse them all →
            </Link>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ Commands */}
      <section className="border-line border-t">
        <div className="shell py-16 lg:py-20">
          <div className="reveal grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow text-accent">No pipeline to write</p>
              <h2 className="mt-3 text-title">
                {stats.commands} of them already run from the terminal.
              </h2>
              <p className="mt-4 text-lead text-muted">
                Some packages ship complete pipelines as barnard59 subcommands.
                Install the package, run the command, done.
              </p>
            </div>
            <Link
              to="/commands"
              className="shrink-0 font-medium text-accent text-sm hover:underline"
            >
              All commands →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allCommands.slice(0, 6).map((command) => (
              <Link
                key={command.href}
                to="/command/$pkg/$cmd"
                params={{ pkg: command.packageSlug, cmd: command.slug }}
                className="card card-interactive reveal p-5"
              >
                <code className="font-mono text-sm">
                  <span className="text-faint">{CLI_BIN} </span>
                  {command.packageSlug}{" "}
                  <span className="font-medium text-accent">
                    {command.slug}
                  </span>
                </code>
                <p className="mt-3 line-clamp-2 text-muted text-sm leading-relaxed">
                  {command.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
