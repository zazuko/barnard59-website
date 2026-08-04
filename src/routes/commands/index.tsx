import { createFileRoute, Link } from "@tanstack/react-router";
import { CommandRow } from "~/components/Cards.tsx";
import { CommandLine } from "~/components/Snippet.tsx";
import {
  CLI_BIN,
  getCommandsOfPackage,
  packagesWithCommands,
  stats,
} from "~/data/registry.ts";
import { plural } from "~/lib/format.ts";
import { seo } from "~/lib/seo.ts";

export const Route = createFileRoute("/commands/")({
  component: CommandsIndex,
  head: () =>
    seo({
      title: "Commands",
      description: `Ready-made barnard59 pipelines you can run straight from the command line — ${stats.commands} commands across ${packagesWithCommands.length} packages.`,
      path: "/commands",
    }),
});

function CommandsIndex() {
  return (
    <>
      <header className="aurora border-line border-b">
        <div className="shell py-14">
          <nav aria-label="Breadcrumb" className="text-faint text-xs">
            <Link to="/" className="hover:text-fg">
              Home
            </Link>
            <span className="px-1.5">/</span>
            <span aria-current="page">Commands</span>
          </nav>

          <h1 className="mt-5 text-title">Run it from the terminal.</h1>
          <p className="mt-4 max-w-2xl text-lead text-muted">
            Some packages ship complete pipelines as command-line subcommands —{" "}
            {stats.commands} of them. Install the package and run it; no
            pipeline to write.
          </p>

          <div className="mt-7">
            <CommandLine command={`${CLI_BIN} --help`} />
          </div>
        </div>
      </header>

      <div className="shell space-y-10 py-10">
        {packagesWithCommands.map((pkg) => {
          const commands = getCommandsOfPackage(pkg.slug);

          return (
            <section key={pkg.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display font-semibold text-heading">
                  <Link
                    to="/packages/$pkg"
                    params={{ pkg: pkg.slug }}
                    className="hover:text-accent"
                  >
                    {pkg.name}
                  </Link>
                </h2>
                <p className="text-faint text-xs">
                  {commands.length} {plural(commands.length, "command")}
                </p>
              </div>

              <ul className="card mt-3 divide-y divide-line p-1.5">
                {commands.map((command) => (
                  <CommandRow key={command.href} command={command} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
