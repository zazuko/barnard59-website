import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PrevNext, PrevNextLabel, prevNextClass } from "~/components/Cards.tsx";
import { FlowGlyph, KindBadge } from "~/components/KindBadge.tsx";
import { CommandLine, Snippet } from "~/components/Snippet.tsx";
import {
  getOperation,
  getOperationNeighbours,
  getPackage,
} from "~/data/registry.ts";
import { cn } from "~/lib/format.ts";
import { seo } from "~/lib/seo.ts";

export const Route = createFileRoute("/operations/$pkg/$")({
  loader: ({ params }) => {
    const operation = getOperation(params.pkg, params._splat ?? "");
    if (!operation) throw notFound();
    return {
      operation,
      pkg: getPackage(params.pkg),
      neighbours: getOperationNeighbours(operation),
    };
  },
  component: OperationPage,
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { operation } = loaderData;
    return seo({
      title: `${operation.label} · ${operation.packageName}`,
      description:
        operation.comment ??
        `The ${operation.label} ${operation.kind} operation from ${operation.packageName}.`,
      path: operation.href,
      type: "article",
      turtle: true,
    });
  },
});

function Row({
  label,
  stacked = false,
  children,
}: {
  label: string;
  /** Puts the value on its own line — for long values like the IRI. */
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

function OperationPage() {
  const { operation, pkg, neighbours } = Route.useLoaderData();

  const stream =
    operation.readable && operation.writable
      ? "Readable and writable — reads the stream and passes it on"
      : operation.readable
        ? "Readable — produces a stream"
        : operation.writable
          ? "Writable — consumes a stream"
          : "Not declared";

  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <Link to="/operations" className="hover:text-fg">
              Operations
            </Link>
            <span className="px-1.5">/</span>
            <Link
              to="/packages/$pkg"
              params={{ pkg: operation.packageSlug }}
              className="hover:text-fg"
            >
              {operation.packageSlug}
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page" className="font-mono">
              {operation.slug}
            </span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <KindBadge kind={operation.kind} size="md" />
            <FlowGlyph kind={operation.kind} />
            {operation.objectMode && (
              <span className="rounded-full bg-hover px-2.5 py-1 text-faint text-xs">
                object mode
              </span>
            )}
          </div>

          <h1 className="mt-5 text-title">{operation.label}</h1>

          {operation.comment && (
            <p className="mt-4 max-w-2xl text-lead text-muted">
              {operation.comment}
            </p>
          )}

          <p className="mt-6 text-muted text-sm">
            From{" "}
            <Link
              to="/packages/$pkg"
              params={{ pkg: operation.packageSlug }}
              className="font-medium text-accent hover:underline"
            >
              {operation.packageName}
            </Link>
            {pkg && <span className="text-faint"> · v{pkg.version}</span>}
          </p>
        </div>
      </header>

      <div className="shell grid gap-8 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <section>
          <h2 className="eyebrow text-faint">Reference</h2>
          <dl className="card mt-3 py-0">
            <Row label="Identifier" stacked>
              {/* The IRI is long and has no spaces: let it break anywhere. */}
              <span className="block font-mono text-[0.8125rem] text-accent [overflow-wrap:anywhere]">
                {operation.iri}
              </span>
              <a
                href={`${operation.href}.ttl`}
                className="mt-1.5 inline-block text-muted text-xs hover:text-fg"
              >
                View as Turtle ↓
              </a>
            </Row>
            {operation.importPath && (
              <Row label="Module">
                <span className="font-mono text-[0.8125rem]">
                  {operation.importPath}
                </span>
              </Row>
            )}
            {operation.exportName && (
              <Row label="Export">
                <span className="font-mono text-[0.8125rem]">
                  {operation.exportName}
                </span>
              </Row>
            )}
            <Row label="Stream">
              <span className="text-sm">{stream}</span>
            </Row>
            <Row label="Implementation">
              <span className="text-sm">
                {operation.implementation === "module"
                  ? "ES module"
                  : "CommonJS"}
              </span>
            </Row>
            {pkg && (
              <Row label="Install">
                <CommandLine command={`npm i ${pkg.name}`} />
              </Row>
            )}
          </dl>
        </section>

        <section>
          <h2 className="eyebrow text-faint">Use it in a pipeline</h2>
          <Snippet
            code={operation.snippet}
            caption="step definition · Turtle"
            className="mt-3"
          />
          <p className="mt-4 text-muted text-sm leading-relaxed">
            Paste this into a pipeline definition to add the step. The{" "}
            <code className="rounded bg-hover px-1 py-0.5 font-mono text-xs">
              code:link
            </code>{" "}
            value tells barnard59 which module to load at runtime.
          </p>
        </section>
      </div>

      <div className="shell pb-12">
        <PrevNext
          label={`Other operations in ${operation.packageName}`}
          previous={
            neighbours.previous && (
              <Link
                to="/operations/$pkg/$"
                params={{
                  pkg: neighbours.previous.packageSlug,
                  _splat: neighbours.previous.slug,
                }}
                className={prevNextClass}
              >
                <PrevNextLabel
                  direction="previous"
                  title={neighbours.previous.label}
                />
              </Link>
            )
          }
          next={
            neighbours.next && (
              <Link
                to="/operations/$pkg/$"
                params={{
                  pkg: neighbours.next.packageSlug,
                  _splat: neighbours.next.slug,
                }}
                className={cn(prevNextClass, "sm:text-right")}
              >
                <PrevNextLabel direction="next" title={neighbours.next.label} />
              </Link>
            )
          }
        />
      </div>
    </>
  );
}
