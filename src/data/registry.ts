import data from "./registry.json" with { type: "json" };
import type { Command, Operation, Package, Registry } from "./types.ts";

export type {
  Command,
  Operation,
  OperationKind,
  Package,
  Registry,
} from "./types.ts";

export const registry = data as Registry;

export const packages: Package[] = registry.packages;

const packagesBySlug = new Map(packages.map((pkg) => [pkg.slug, pkg]));

export function getPackage(slug: string): Package | undefined {
  return packagesBySlug.get(slug);
}

/** An operation together with the package that defines it. */
export type OperationEntry = Operation & {
  packageName: string;
  packageSlug: string;
  /** Path of the operation page, `/operation/<package>/<slug>`. */
  href: string;
};

function toEntry(pkg: Package, operation: Operation): OperationEntry {
  return {
    ...operation,
    packageName: pkg.name,
    packageSlug: pkg.slug,
    href: `/operation/${pkg.slug}/${operation.slug}`,
  };
}

export const allOperations: OperationEntry[] = packages
  .flatMap((pkg) => pkg.operations.map((operation) => toEntry(pkg, operation)))
  .sort((a, b) => a.label.localeCompare(b.label));

const operationsByHref = new Map(allOperations.map((op) => [op.href, op]));

export function getOperation(
  packageSlug: string,
  operationSlug: string,
): OperationEntry | undefined {
  return operationsByHref.get(`/operation/${packageSlug}/${operationSlug}`);
}

/**
 * Operations keyed by IRI without its scheme: pipeline definitions and
 * manifests disagree about `http:` versus `https:` for the same resource.
 */
const operationsByIri = new Map(
  allOperations.map((operation) => [
    operation.iri.replace(/^https?:/, ""),
    operation,
  ]),
);

/** Find the documented operation a pipeline step refers to, if any. */
export function getOperationByIri(iri: string): OperationEntry | undefined {
  return operationsByIri.get(iri.replace(/^https?:/, ""));
}

export function getOperationsOfPackage(slug: string): OperationEntry[] {
  const pkg = getPackage(slug);
  if (!pkg) return [];
  return pkg.operations.map((operation) => toEntry(pkg, operation));
}

/**
 * How commands are invoked. `npx` runs the locally installed binary without
 * needing it on PATH, which is how most people will reach for it.
 */
export const CLI_BIN = "npx barnard59";

/** A command together with the package that provides it. */
export type CommandEntry = Command & {
  packageName: string;
  packageSlug: string;
  /** Path of the command page, `/command/<package>/<slug>`. */
  href: string;
  /** The full invocation, e.g. `npx barnard59 graph-store put`. */
  cli: string;
};

function toCommandEntry(pkg: Package, command: Command): CommandEntry {
  return {
    ...command,
    packageName: pkg.name,
    packageSlug: pkg.slug,
    href: `/command/${pkg.slug}/${command.slug}`,
    cli: `${CLI_BIN} ${pkg.slug} ${command.slug}`,
  };
}

export const allCommands: CommandEntry[] = packages
  .flatMap((pkg) => pkg.commands.map((command) => toCommandEntry(pkg, command)))
  .sort((a, b) => a.cli.localeCompare(b.cli));

const commandsByHref = new Map(allCommands.map((cmd) => [cmd.href, cmd]));

export function getCommand(
  packageSlug: string,
  commandSlug: string,
): CommandEntry | undefined {
  return commandsByHref.get(`/command/${packageSlug}/${commandSlug}`);
}

export function getCommandsOfPackage(slug: string): CommandEntry[] {
  const pkg = getPackage(slug);
  if (!pkg) return [];
  return pkg.commands.map((command) => toCommandEntry(pkg, command));
}

/** Packages that expose at least one command. */
export const packagesWithCommands = packages.filter(
  (pkg) => pkg.commands.length > 0,
);

export const stats = {
  packages: packages.length,
  operations: allOperations.length,
  commands: allCommands.length,
  sources: allOperations.filter((op) => op.kind === "source").length,
  transforms: allOperations.filter((op) => op.kind === "transform").length,
  sinks: allOperations.filter((op) => op.kind === "sink").length,
};

/**
 * Previous and next package, so a reader can walk the whole set without
 * going back to the index.
 */
export function getPackageNeighbours(pkg: Package): {
  previous?: Package;
  next?: Package;
} {
  const index = packages.findIndex((entry) => entry.slug === pkg.slug);
  if (index === -1) return {};
  return { previous: packages[index - 1], next: packages[index + 1] };
}

/** Previous and next operation within the same package. */
export function getOperationNeighbours(operation: OperationEntry): {
  previous?: OperationEntry;
  next?: OperationEntry;
} {
  const siblings = getOperationsOfPackage(operation.packageSlug);
  const index = siblings.findIndex((entry) => entry.slug === operation.slug);
  if (index === -1) return {};
  return { previous: siblings[index - 1], next: siblings[index + 1] };
}

/** Previous and next command within the same package. */
export function getCommandNeighbours(command: CommandEntry): {
  previous?: CommandEntry;
  next?: CommandEntry;
} {
  const siblings = getCommandsOfPackage(command.packageSlug);
  const index = siblings.findIndex((entry) => entry.slug === command.slug);
  if (index === -1) return {};
  return { previous: siblings[index - 1], next: siblings[index + 1] };
}
