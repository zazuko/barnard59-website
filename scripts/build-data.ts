/**
 * Build-time data pipeline.
 *
 * Reads the package names from `packages.yaml`, resolves each one against
 * unpkg (`package.json` + `manifest.ttl`) and npm (download counts), then
 * writes a single static registry to `src/data/registry.json`.
 *
 * Everything RDF- and YAML-related happens here, at build time, so the shipped
 * site is plain data with no parser in the client bundle.
 *
 * Usage:
 *   node --experimental-strip-types scripts/build-data.ts
 *   node --experimental-strip-types scripts/build-data.ts --cached  # reuse a fresh registry
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import env from "@zazuko/env-node";
import YAML from "yaml";
import { z } from "zod";
import type {
  Command,
  Operation,
  OperationKind,
  Package,
  PipelineArgument,
  PipelineStep,
  PipelineVariable,
  Registry,
} from "../src/data/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesFile = join(root, "packages.yaml");
const outputPath = join(root, "src/data/registry.json");

/** How long a cached registry stays usable for `--cached` (dev) runs. */
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** unpkg answers 5xx under parallel load, so keep requests few and retry. */
const CONCURRENCY = 3;
const RETRIES = 4;

/** Mirrors are tried in order; both serve arbitrary files from npm packages. */
const MIRRORS = ["https://unpkg.com", "https://cdn.jsdelivr.net/npm"];

const configSchema = z.object({
  packages: z.array(z.string()).min(1),
});

const packageJsonSchema = z
  .object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
    license: z.string().optional(),
    homepage: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    repository: z
      .union([z.string(), z.object({ url: z.string().optional() })])
      .optional(),
  })
  .loose();

// `rdf` and `rdfs` come with the environment; the barnard59 vocabularies do
// not. Terms are built by calling the namespace so they are typed as NamedNode
// rather than through its index signature.
const { rdf, rdfs } = env.ns;
const code = env.namespace("https://code.described.at/");
const pipeline = env.namespace("https://pipeline.described.at/");
const b59 = env.namespace("https://barnard59.zazuko.com/vocab#");

const ns = {
  rdf,
  rdfs,
  code: {
    implementedBy: code("implementedBy"),
    link: code("link"),
    name: code("name"),
    value: code("value"),
    EcmaScript: code("EcmaScript"),
    EcmaScriptModule: code("EcmaScriptModule"),
  },
  pipeline: {
    Operation: pipeline("Operation"),
    Readable: pipeline("Readable"),
    ReadableObjectMode: pipeline("ReadableObjectMode"),
    Writable: pipeline("Writable"),
    WritableObjectMode: pipeline("WritableObjectMode"),
  },
  b59: {
    CliCommand: b59("CliCommand"),
    command: b59("command"),
    source: b59("source"),
    pipeline: b59("pipeline"),
  },
  p: {
    Pipeline: pipeline("Pipeline"),
    Variable: pipeline("Variable"),
    steps: pipeline("steps"),
    stepList: pipeline("stepList"),
    variables: pipeline("variables"),
    variable: pipeline("variable"),
    name: pipeline("name"),
    value: pipeline("value"),
    required: pipeline("required"),
  },
};

/**
 * Vocabularies that describe *how* a step is wired rather than *what* it runs.
 * The operation a step references is the one predicate outside these.
 */
const STRUCTURAL_VOCABULARIES = [
  "https://pipeline.described.at/",
  "https://code.described.at/",
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "http://www.w3.org/2000/01/rdf-schema#",
];

/** Deepest level of nested sub-pipelines rendered on a command page. */
const MAX_PIPELINE_DEPTH = 3;

const language = ["en", "*"];

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "operation"
  );
}

/** URL segment for a package: `barnard59-ftp` → `ftp`. */
function packageSlug(name: string): string {
  return name.replace(/^barnard59-/, "") || name;
}

/**
 * URL path of an operation within its package, derived from its IRI.
 *
 * Manifest IRIs look like `https://barnard59.zazuko.com/operations/<ns>/<path>`,
 * so dropping the host and the namespace segment leaves exactly the local path:
 *
 *   .../operations/ftp/list                  → list
 *   .../operations/formats/jsonld/parse      → jsonld/parse
 *   .../operations/core/fs/createReadStream  → fs/createReadStream
 *   .../operations/rdf/metadata.js#append    → metadata.js/append
 *
 * The namespace is dropped rather than used as the URL segment because it does
 * not always match the package: `barnard59-validate-shacl` declares its
 * operation under the `csvw` namespace.
 */
function operationSlug(iri: string, label: string): string {
  const match = iri.match(/\/operations\/[^/]+\/(.+)$/);
  // Fall back to the label for IRIs that do not follow the convention.
  if (!match?.[1]) return slugify(label);

  return match[1]
    .replace(/#/g, "/") // hash IRIs become a nested path
    .split("/")
    .filter(Boolean)
    .join("/");
}

function repositoryUrl(
  repository: string | { url?: string } | undefined,
): string | undefined {
  const raw = typeof repository === "string" ? repository : repository?.url;
  if (!raw) return undefined;
  return raw
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git:\/\//, "https://");
}

/**
 * Split a `code:link` into the module specifier and the export it points at.
 * Links use the `node:` scheme with the export in the fragment, e.g.
 * `node:barnard59-rdf/mapMatch.js#default`.
 */
function parseLink(link: string | undefined): {
  importPath?: string;
  exportName?: string;
} {
  if (!link) return {};
  const withoutScheme = link.replace(/^node:/, "");
  const [importPath, exportName] = withoutScheme.split("#");
  return { importPath: importPath || undefined, exportName };
}

function buildSnippet(operation: {
  implementation: "module" | "script";
  link?: string;
}): string {
  const type =
    operation.implementation === "module"
      ? "code:EcmaScriptModule"
      : "code:EcmaScript";
  return [
    "<> a p:Step ;",
    "  code:implementedBy [",
    `    a ${type} ;`,
    `    code:link <${operation.link ?? ""}>`,
    "  ] .",
  ].join("\n");
}

function operationKind(readable: boolean, writable: boolean): OperationKind {
  if (readable && writable) return "transform";
  if (readable) return "source";
  if (writable) return "sink";
  return "unknown";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Signals a resource that genuinely does not exist — never worth retrying. */
class NotFoundError extends Error {}

/**
 * Run `task` against every mirror in turn, retrying each with exponential
 * backoff. A 404 short-circuits: the file is missing, not the server busy.
 */
async function withMirrors<T>(
  path: string,
  task: (url: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRIES; attempt++) {
    for (const mirror of MIRRORS) {
      try {
        return await task(`${mirror}/${path}`);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        lastError = error;
      }
    }
    await sleep(2 ** attempt * 500);
  }

  throw lastError;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  if (res.status === 404) {
    throw new NotFoundError(`404 Not Found for ${url}`);
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function fetchPackageInfo(name: string) {
  const json = await withMirrors(`${name}/package.json`, fetchJson);
  return packageJsonSchema.parse(json);
}

/** Map over `items` with at most `limit` tasks in flight, preserving order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index] as T);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

/**
 * Monthly download count. Purely decorative, so a failure is never fatal.
 */
async function fetchDownloads(name: string): Promise<number | undefined> {
  try {
    const json = (await fetchJson(
      `https://api.npmjs.org/downloads/point/last-month/${name}`,
    )) as { downloads?: number };
    return typeof json.downloads === "number" ? json.downloads : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the `manifest.ttl` of a package and extract its pipeline operations.
 * Packages without a manifest are legitimate, so a 404 yields an empty list.
 */
type Manifest = ReturnType<typeof env.clownface>;

async function fetchManifest(name: string): Promise<Manifest | null> {
  try {
    const dataset = await withMirrors(`${name}/manifest.ttl`, async (url) => {
      const res = await env.fetch(url);
      if (res.status === 404) {
        throw new NotFoundError(`404 Not Found for ${url}`);
      }
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }
      return env.dataset([...(await res.dataset())]);
    });

    return env.clownface({ dataset });
  } catch (error) {
    // A package without a manifest is legitimate: it declares nothing.
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

function extractOperations(manifest: Manifest): Operation[] {
  const seen = new Set<string>();

  return manifest
    .any()
    .has(ns.rdf.type, ns.pipeline.Operation)
    .toArray()
    .flatMap((operation) => {
      const label = operation.out(ns.rdfs.label, { language }).value;
      // An operation without a label has nothing to show; skip it.
      if (!label) return [];

      const comment = operation.out(ns.rdfs.comment, { language }).value;

      const types = new Set(
        operation.out(ns.rdf.type).terms.map((term) => term.value),
      );
      const readableObject = types.has(ns.pipeline.ReadableObjectMode.value);
      const writableObject = types.has(ns.pipeline.WritableObjectMode.value);
      const readable = readableObject || types.has(ns.pipeline.Readable.value);
      const writable = writableObject || types.has(ns.pipeline.Writable.value);

      // Manifests use `code:EcmaScriptModule` for ESM and the older
      // `code:EcmaScript` for CommonJS; both are valid implementations.
      const implementedBy = operation.out(ns.code.implementedBy);
      const esm = implementedBy.has(ns.rdf.type, ns.code.EcmaScriptModule);
      const implementation = esm.terms.length > 0 ? "module" : "script";
      const link = (
        implementation === "module"
          ? esm
          : implementedBy.has(ns.rdf.type, ns.code.EcmaScript)
      ).out(ns.code.link).value;

      // Disambiguate on the rare chance two IRIs collapse to the same path.
      const iri = operation.value ?? "";
      const base = operationSlug(iri, label);
      let slug = base;
      for (let i = 2; seen.has(slug); i++) slug = `${base}-${i}`;
      seen.add(slug);

      return [
        {
          slug,
          iri,
          label,
          comment,
          kind: operationKind(readable, writable),
          readable,
          writable,
          objectMode: readableObject || writableObject,
          implementation,
          link,
          ...parseLink(link),
          snippet: buildSnippet({ implementation, link }),
        } satisfies Operation,
      ];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Fetch the pipeline definition a command runs. Best effort: `b59:source`
 * sometimes points at a file the package does not actually publish.
 */
async function fetchCommandSource(
  source: string | undefined,
): Promise<string | undefined> {
  if (!source) return undefined;

  try {
    const text = await withMirrors(source, async (url) => {
      const res = await fetch(url, { redirect: "follow" });
      if (res.status === 404) {
        throw new NotFoundError(`404 Not Found for ${url}`);
      }
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }
      return res.text();
    });

    return text.trim() || undefined;
  } catch {
    return undefined;
  }
}

type Pointer = ReturnType<Manifest["any"]>;

/**
 * Read a pipeline definition into a tree of steps.
 *
 * A step in a `p:stepList` takes one of three shapes:
 *   `[ op:base/glob (args) ]`   — references an operation by IRI
 *   `<_validate>`               — references another pipeline in the file
 *   `[ a p:Step ; code:implementedBy [...] ]` — carries its own implementation
 */
function readSteps(
  node: Pointer,
  dataset: Awaited<ReturnType<typeof env.dataset>>,
  depth: number,
  visited: Set<string>,
): PipelineStep[] {
  if (depth > MAX_PIPELINE_DEPTH) return [];

  const list = node.out(ns.p.steps).out(ns.p.stepList);
  if (!list.term) return [];

  let members: Pointer[];
  try {
    members = [...(list.list() ?? [])] as Pointer[];
  } catch {
    return [];
  }

  return members.map((step) => readStep(step, dataset, depth, visited));
}

function readStep(
  step: Pointer,
  dataset: Awaited<ReturnType<typeof env.dataset>>,
  depth: number,
  visited: Set<string>,
): PipelineStep {
  const key = step.term ? `${step.term.termType}:${step.value}` : "";

  // A step that has its own step list is a nested pipeline.
  if (step.out(ns.p.steps).term && !visited.has(key)) {
    visited.add(key);
    return {
      label: nodeLabel(step) ?? "sub-pipeline",
      args: [],
      steps: readSteps(step, dataset, depth + 1, visited),
    };
  }

  // Otherwise the operation is the one predicate outside the plumbing vocabularies.
  const quad = step.term
    ? [...dataset.match(step.term)].find(
        (candidate) =>
          !STRUCTURAL_VOCABULARIES.some((vocabulary) =>
            candidate.predicate.value.startsWith(vocabulary),
          ),
      )
    : undefined;

  if (!quad) {
    // An inline step: no operation IRI, but it may say what implements it.
    const link = step.out(ns.code.implementedBy).out(ns.code.link).value;
    return {
      label:
        parseLink(link).importPath ?? localName(step.value) ?? "inline step",
      args: [],
    };
  }

  return {
    operation: quad.predicate.value,
    label: localName(quad.predicate.value),
    args: readArguments(step.out(quad.predicate), dataset, depth, visited),
  };
}

function readArguments(
  args: Pointer,
  dataset: Awaited<ReturnType<typeof env.dataset>>,
  depth: number,
  visited: Set<string>,
): PipelineArgument[] {
  const result: PipelineArgument[] = [];

  for (const arg of args.toArray() as Pointer[]) {
    if (arg.term?.equals(ns.rdf.nil)) continue;

    // Positional arguments arrive as an RDF list; named ones do not.
    let items: Pointer[] = [arg];
    if (arg.out(ns.rdf.first).term) {
      try {
        items = [...(arg.list() ?? [arg])] as Pointer[];
      } catch {
        items = [arg];
      }
    }

    for (const item of items) {
      const name = item.out(ns.code.name).value;
      const valueNode = name ? item.out(ns.code.value) : item;
      const key = valueNode.term
        ? `${valueNode.term.termType}:${valueNode.value}`
        : "";

      // An argument can itself be a whole pipeline.
      let nested: PipelineStep[] | undefined;
      if (valueNode.out(ns.p.steps).term && !visited.has(key)) {
        visited.add(key);
        nested = readSteps(valueNode, dataset, depth + 1, visited);
      }

      // IRIs read better as their local name; literals are shown verbatim.
      const value =
        valueNode.term?.termType === "Literal"
          ? valueNode.value
          : nodeLabel(valueNode);

      result.push({
        name,
        value,
        isVariable:
          valueNode.term?.termType === "Literal" &&
          valueNode.term.datatype.value.endsWith("VariableName"),
        steps: nested?.length ? nested : undefined,
      });
    }
  }

  return result;
}

function readVariables(pipeline: Pointer): PipelineVariable[] {
  return (
    pipeline.out(ns.p.variables).out(ns.p.variable).toArray() as Pointer[]
  ).flatMap((variable) => {
    const name = variable.out(ns.p.name).value;
    if (!name) return [];
    return [
      {
        name,
        label: variable.out(ns.rdfs.label, { language }).value,
        value: variable.out(ns.p.value).value,
        required: variable.out(ns.p.required).value !== "false",
      } satisfies PipelineVariable,
    ];
  });
}

/** Last meaningful segment of an IRI, used as a fallback label. */
function localName(iri: string | undefined): string | undefined {
  if (!iri) return undefined;
  const withoutFragment = iri.split("#").pop() ?? iri;
  return withoutFragment.split("/").filter(Boolean).pop();
}

/**
 * Readable name for a node. Parsers rename `_:getProfile` to something like
 * `b9_getProfile`, so drop that generated prefix.
 */
function nodeLabel(pointer: Pointer): string | undefined {
  if (pointer.term?.termType === "BlankNode") {
    return pointer.value?.replace(/^b\d+_/, "") || undefined;
  }
  return localName(pointer.value);
}

/**
 * Parse the pipeline a command runs. Files may define several pipelines, so
 * pick the one the command actually points at.
 */
async function parsePipeline(
  sourceCode: string,
  baseIRI: string,
  command: { slug: string; pipeline?: string },
): Promise<{ steps: PipelineStep[]; variables: PipelineVariable[] }> {
  const empty = { steps: [], variables: [] };

  try {
    const stream = env.formats.parsers.import(
      "text/turtle",
      Readable.from([sourceCode]),
      { baseIRI },
    );
    if (!stream) return empty;

    const dataset = env.dataset();
    await dataset.import(stream);

    const pipelines = env
      .clownface({ dataset })
      .has(ns.rdf.type, ns.p.Pipeline)
      .toArray() as Pointer[];

    if (pipelines.length === 0) return empty;

    const main =
      (command.pipeline &&
        pipelines.find((node) => node.value === command.pipeline)) ||
      pipelines.find((node) => node.value?.endsWith(`/${command.slug}`)) ||
      pipelines.find((node) => node.term?.termType === "NamedNode") ||
      pipelines[0];

    if (!main) return empty;

    return {
      steps: readSteps(main, dataset, 0, new Set([`NamedNode:${main.value}`])),
      variables: readVariables(main),
    };
  } catch (error) {
    console.warn(
      `  ! could not parse pipeline ${baseIRI}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return empty;
  }
}

async function extractCommands(manifest: Manifest): Promise<Command[]> {
  const seen = new Set<string>();

  const commands = manifest
    .any()
    .has(ns.rdf.type, ns.b59.CliCommand)
    .toArray()
    .flatMap((node) => {
      // `b59:command` is the subcommand a user types; without it there is
      // nothing to invoke.
      const name = node.out(ns.b59.command).value;
      if (!name) return [];

      // Slugs are single URL segments, so flatten anything unexpected.
      const base = name.replace(/\//g, "-");
      let slug = base;
      for (let i = 2; seen.has(slug); i++) slug = `${base}-${i}`;
      seen.add(slug);

      return [
        {
          slug,
          iri: node.value ?? "",
          label: node.out(ns.rdfs.label, { language }).value ?? name,
          comment: node.out(ns.rdfs.comment, { language }).value,
          source: node.out(ns.b59.source).value,
          pipeline: node.out(ns.b59.pipeline).value,
        },
      ];
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return Promise.all(
    commands.map(async (command) => {
      const sourceCode = await fetchCommandSource(command.source);

      const { steps, variables } = sourceCode
        ? await parsePipeline(
            sourceCode,
            `https://unpkg.com/${command.source}`,
            command,
          )
        : { steps: [], variables: [] };

      return { ...command, sourceCode, steps, variables };
    }),
  );
}

async function readPackageNames(): Promise<string[]> {
  const content = await readFile(packagesFile, "utf8");
  const { packages } = configSchema.parse(YAML.parse(content));
  return [...new Set(packages)].sort((a, b) => a.localeCompare(b));
}

async function resolvePackage(name: string): Promise<Package | null> {
  try {
    const [info, manifest, downloadsLastMonth] = await Promise.all([
      fetchPackageInfo(name),
      fetchManifest(name),
      fetchDownloads(name),
    ]);

    const operations = manifest ? extractOperations(manifest) : [];
    const commands = manifest ? await extractCommands(manifest) : [];

    return {
      name: info.name,
      slug: packageSlug(info.name),
      version: info.version,
      description: info.description,
      license: info.license,
      homepage: info.homepage,
      repository: repositoryUrl(info.repository),
      keywords: info.keywords ?? [],
      npmUrl: `https://www.npmjs.com/package/${info.name}`,
      downloadsLastMonth,
      operations,
      commands,
    };
  } catch (error) {
    console.error(
      `  ✗ ${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

async function isCacheFresh(): Promise<boolean> {
  try {
    const stats = await stat(outputPath);
    return Date.now() - stats.mtimeMs < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

async function main() {
  if (process.argv.includes("--cached") && (await isCacheFresh())) {
    console.log("registry.json is fresh, skipping fetch");
    return;
  }

  const names = await readPackageNames();
  console.log(`Resolving ${names.length} packages…`);

  const resolved = await mapWithConcurrency(names, CONCURRENCY, resolvePackage);

  const packages = resolved.filter((pkg): pkg is Package => pkg !== null);
  const failed = resolved.length - packages.length;

  if (failed > 0 && process.env.CI) {
    throw new Error(`${failed} package(s) could not be resolved`);
  }

  // Slugs become URL segments, so a collision would silently shadow a page.
  const slugs = new Map<string, string>();
  for (const pkg of packages) {
    const existing = slugs.get(pkg.slug);
    if (existing) {
      throw new Error(
        `packages '${existing}' and '${pkg.name}' both resolve to the slug '${pkg.slug}'`,
      );
    }
    slugs.set(pkg.slug, pkg.name);
  }

  const registry: Registry = {
    generatedAt: new Date().toISOString(),
    packages,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`);

  const count = (pick: (pkg: Package) => unknown[]) =>
    packages.reduce((total, pkg) => total + pick(pkg).length, 0);

  console.log(
    `Wrote ${packages.length} packages, ${count((p) => p.operations)} operations and ${count((p) => p.commands)} commands to src/data/registry.json`,
  );
}

await main();
