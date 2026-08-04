import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageCard } from "~/components/Cards.tsx";
import { packages, stats } from "~/data/registry.ts";
import { seo } from "~/lib/seo.ts";

export const Route = createFileRoute("/packages/")({
  component: PackagesIndex,
  head: () =>
    seo({
      title: "Packages",
      description: `Every barnard59 package — ${stats.packages} packages exposing ${stats.operations} pipeline operations.`,
      path: "/packages",
    }),
});

function PackagesIndex() {
  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page">Packages</span>
          </nav>

          <h1 className="mt-5 text-title">Every package.</h1>
          <p className="mt-4 max-w-2xl text-lead text-muted">
            {stats.packages} packages exposing {stats.operations} operations you
            can drop straight into a pipeline. Install only what you need.
          </p>
        </div>
      </header>

      <div className="shell py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.name} pkg={pkg} className="reveal" />
          ))}
        </div>
      </div>
    </>
  );
}
