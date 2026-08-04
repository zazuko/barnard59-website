/**
 * Shape of `registry.json`, shared between the build-time generator
 * (`scripts/build-data.ts`) and the site that consumes it.
 */

/**
 * How an operation sits in a pipeline, derived from its stream modes:
 * a source only produces, a sink only consumes, a transform does both.
 */
export type OperationKind = "source" | "transform" | "sink" | "unknown";

export type Operation = {
  /**
   * Path of the operation within its package, taken from the local part of its
   * IRI — `list`, `jsonld/parse`, `fs/createReadStream`. Combined with the
   * package slug it forms the URL: `/operations/<package>/<slug>`.
   */
  slug: string;
  iri: string;
  label: string;
  comment?: string;
  kind: OperationKind;
  readable: boolean;
  writable: boolean;
  /** True when the stream carries objects rather than bytes. */
  objectMode: boolean;
  /** `code:EcmaScriptModule` (ESM) or `code:EcmaScript` (legacy CJS). */
  implementation: "module" | "script";
  /** Raw `code:link` value, e.g. `node:barnard59-rdf/mapMatch.js#default`. */
  link?: string;
  /** Bare import specifier, e.g. `barnard59-rdf/mapMatch.js`. */
  importPath?: string;
  /** Named export implementing the operation, e.g. `default` or `append`. */
  exportName?: string;
  /** Ready-to-paste Turtle snippet. */
  snippet: string;
};

/** An argument passed to a pipeline step. */
export type PipelineArgument = {
  /** `code:name` for named arguments; absent for positional ones. */
  name?: string;
  value?: string;
  /** True when the value names a pipeline variable rather than a literal. */
  isVariable?: boolean;
  /** A whole pipeline passed as an argument, e.g. a sub-query to run. */
  steps?: PipelineStep[];
};

/**
 * One step of a pipeline. A step either references an operation by IRI, nests
 * a sub-pipeline, or carries its own inline implementation.
 */
export type PipelineStep = {
  /** IRI of the operation this step runs, when it references one. */
  operation?: string;
  /** Shown when no documented operation matches the IRI. */
  label?: string;
  args: PipelineArgument[];
  /** Steps of a nested sub-pipeline. */
  steps?: PipelineStep[];
};

export type PipelineVariable = {
  name: string;
  label?: string;
  /** `p:value` — the default when the variable is not supplied. */
  value?: string;
  required: boolean;
};

/**
 * A `b59:CliCommand`: a ready-made pipeline exposed as a barnard59 subcommand,
 * run as `barnard59 <package> <command>`.
 */
export type Command = {
  /** The `b59:command` value — the subcommand you type, e.g. `put`. */
  slug: string;
  iri: string;
  label: string;
  comment?: string;
  /** `b59:source`: path of the pipeline definition inside the package. */
  source?: string;
  /** `b59:pipeline`: IRI of the pipeline the command runs. */
  pipeline?: string;
  /** Contents of `source`, when the package publishes that file. */
  sourceCode?: string;
  /** Steps of the pipeline this command runs, parsed from `sourceCode`. */
  steps: PipelineStep[];
  /** Variables the pipeline accepts. */
  variables: PipelineVariable[];
};

export type Package = {
  name: string;
  /** URL segment: the name without its `barnard59-` prefix, e.g. `ftp`. */
  slug: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  npmUrl: string;
  downloadsLastMonth?: number;
  operations: Operation[];
  commands: Command[];
};

export type Registry = {
  generatedAt: string;
  packages: Package[];
};
