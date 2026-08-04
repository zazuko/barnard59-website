import type { PipelineVariable } from "~/data/types.ts";

/** Characters that are safe unquoted in a POSIX shell. */
const SAFE = /^[A-Za-z0-9_./:@=+-]+$/;

export function shellQuote(value: string): string {
  if (SAFE.test(value)) return value;
  // Single quotes protect everything except a single quote itself.
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * A variable is worth putting on the command line when the reader has given it
 * a value that the pipeline would not already use by default.
 */
export function isOverridden(
  variable: PipelineVariable,
  value: string | undefined,
): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return trimmed !== variable.value;
}

/**
 * Build the invocation, appending `--variable name=value` for every variable
 * the reader has overridden. Order follows the pipeline's own declaration.
 */
export function buildCommandLine(
  base: string,
  variables: PipelineVariable[],
  values: Record<string, string>,
): string {
  const overrides = variables
    .filter((variable) => isOverridden(variable, values[variable.name]))
    .map(
      (variable) =>
        `--variable ${variable.name}=${shellQuote(
          (values[variable.name] as string).trim(),
        )}`,
    );

  return [base, ...overrides].join(" ");
}

/** Required variables that still have no value — the command is incomplete. */
export function missingRequired(
  variables: PipelineVariable[],
  values: Record<string, string>,
): string[] {
  return variables
    .filter(
      (variable) =>
        variable.required && !variable.value && !values[variable.name]?.trim(),
    )
    .map((variable) => variable.name);
}
