import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CommandRow,
  OperationRow,
  PrevNext,
  PrevNextLabel,
  prevNextClass,
} from "~/components/Cards.tsx";
import { KINDS } from "~/components/KindBadge.tsx";
import { CommandLine } from "~/components/Snippet.tsx";
import {
  getCommandsOfPackage,
  getOperationsOfPackage,
  getPackage,
  getPackageNeighbours,
} from "~/data/registry.ts";
import type { OperationKind } from "~/data/types.ts";
import { cn, formatCount, plural } from "~/lib/format.ts";
import { seo } from "~/lib/seo.ts";

export const Route = createFileRoute("/packages/$pkg")({
  loader: ({ params }) => {
    const pkg = getPackage(params.pkg);
    if (!pkg) throw notFound();
    return {
      pkg,
      operations: getOperationsOfPackage(params.pkg),
      commands: getCommandsOfPackage(params.pkg),
      neighbours: getPackageNeighbours(pkg),
    };
  },
  component: PackagePage,
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { pkg } = loaderData;
    return seo({
      title: pkg.name,
      description:
        pkg.description ??
        `${pkg.name} exposes ${pkg.operations.length} barnard59 ${plural(pkg.operations.length, "operation")}.`,
      path: `/packages/${pkg.slug}`,
      type: "article",
      turtle: pkg.operations.length > 0 || pkg.commands.length > 0,
    });
  },
});

function PackagePage() {
  const { pkg, operations, commands, neighbours } = Route.useLoaderData();

  const counts = (["source", "transform", "sink"] as const)
    .map((kind) => ({
      kind,
      count: operations.filter((o) => o.kind === kind).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <Link to="/packages" className="hover:text-fg">
              Packages
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page">{pkg.slug}</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="text-title">{pkg.name}</h1>
            <span className="rounded-full bg-hover px-2.5 py-1 font-mono text-faint text-xs">
              v{pkg.version}
            </span>
          </div>

          {pkg.description && (
            <p className="mt-4 max-w-2xl text-lead text-muted">
              {pkg.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <CommandLine command={`npm i ${pkg.name}`} />
            <a
              href={pkg.npmUrl}
              className="rounded-control border border-line bg-surface px-3.5 py-2 font-medium text-muted text-sm transition-colors hover:border-line-strong hover:text-fg"
            >
              npm ↗
            </a>
            {pkg.repository && (
              <a
                href={pkg.repository}
                className="rounded-control border border-line bg-surface px-3.5 py-2 font-medium text-muted text-sm transition-colors hover:border-line-strong hover:text-fg"
              >
                Source ↗
              </a>
            )}
          </div>

          {/* Composition of this package at a glance. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted">
              <strong className="font-semibold text-fg">
                {operations.length}
              </strong>{" "}
              {plural(operations.length, "operation")}
            </span>
            {counts.map(({ kind, count }) => {
              const style = KINDS[kind as OperationKind];
              return (
                <span
                  key={kind}
                  className="inline-flex items-center gap-1.5 text-muted"
                >
                  <span
                    className={cn("size-1.5 rounded-full", style.dot)}
                    aria-hidden="true"
                  />
                  {count} {plural(count, style.label)}
                </span>
              );
            })}
            {pkg.license && (
              <span className="text-muted">{pkg.license} licensed</span>
            )}
            {pkg.downloadsLastMonth !== undefined && (
              <span className="text-muted">
                {formatCount(pkg.downloadsLastMonth)} downloads/mo
              </span>
            )}
          </div>

          {(operations.length > 0 || commands.length > 0) && (
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a
                href={`/packages/${pkg.slug}.ttl`}
                className="text-muted hover:text-fg"
              >
                Everything as Turtle ↓
              </a>
              {operations.length > 0 && (
                <a
                  href={`/operation/${pkg.slug}.ttl`}
                  className="text-muted hover:text-fg"
                >
                  Operations only ↓
                </a>
              )}
              {commands.length > 0 && (
                <a
                  href={`/command/${pkg.slug}.ttl`}
                  className="text-muted hover:text-fg"
                >
                  Commands only ↓
                </a>
              )}
            </p>
          )}
        </div>
      </header>

      <div className="shell py-10">
        {commands.length > 0 && (
          <section className="mb-10">
            <h2 className="eyebrow text-faint">Command line</h2>
            <p className="mt-2 max-w-2xl text-muted text-sm">
              This package ships ready-made pipelines you can run directly.
            </p>
            <ul className="card mt-3 divide-y divide-line p-1.5">
              {commands.map((command) => (
                <CommandRow key={command.href} command={command} />
              ))}
            </ul>
          </section>
        )}

        {operations.length === 0 ? (
          commands.length === 0 && (
            <div className="card px-6 py-14 text-center">
              <p className="text-lead text-muted">
                This package does not declare any operation in an RDF manifest.
              </p>
            </div>
          )
        ) : (
          <section>
            <h2 className="eyebrow text-faint">Operations</h2>
            <ul className="card mt-3 divide-y divide-line p-1.5">
              {operations.map((operation) => (
                <OperationRow key={operation.href} operation={operation} />
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10">
          <PrevNext
            label="Nearby packages"
            previous={
              neighbours.previous && (
                <Link
                  to="/packages/$pkg"
                  params={{ pkg: neighbours.previous.slug }}
                  className={prevNextClass}
                >
                  <PrevNextLabel
                    direction="previous"
                    title={neighbours.previous.name}
                  />
                </Link>
              )
            }
            next={
              neighbours.next && (
                <Link
                  to="/packages/$pkg"
                  params={{ pkg: neighbours.next.slug }}
                  className={cn(prevNextClass, "sm:text-right")}
                >
                  <PrevNextLabel
                    direction="next"
                    title={neighbours.next.name}
                  />
                </Link>
              )
            }
          />
        </div>
      </div>
    </>
  );
}
