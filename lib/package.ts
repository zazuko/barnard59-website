import clownface from "clownface";
import { default as rdfFetch } from "@rdfjs/fetch";
import rdf from "rdf-ext";
import namespace from "@rdfjs/namespace";

export type PackageInfo = {
  name: string;
  version: string;
  description?: string;
};

export type PackageOperation = {
  label?: string;
  comment?: string;
  snippet?: string;
};
export type PackageOperations = PackageOperation[];

/**
 * Get informations about a NPM package.
 *
 * @param name Package name.
 * @returns The package.json file as a JavaScript object.
 */
export const packageInfo = async (name: string): Promise<PackageInfo> => {
  const res = await fetch(`https://unpkg.com/${name}/package.json`);
  const infos = await res.json();
  return infos;
};

/**
 * Get list of operations of a barnard59 package.
 *
 * @param name Package name.
 */
export const packageOperations = async (
  name: string
): Promise<PackageOperations> => {
  const res = await rdfFetch(`https://unpkg.com/${name}/manifest.ttl`, {
    factory: rdf,
  });

  if (!res.ok) {
    throw new Error(
      `unable to fetch 'manifest.ttl' file for package '${name}'`
    );
  }

  const dataset = await res.dataset();
  const manifest = clownface({ dataset });

  const language = ["en", "*"];
  const ns = {
    code: namespace("https://code.described.at/"),
    pipeline: namespace("https://pipeline.described.at/"),
    rdf: namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#"),
    rdfs: namespace("http://www.w3.org/2000/01/rdf-schema#"),
  };

  const operations: PackageOperations = manifest
    .any()
    .has(ns.rdf.type, ns.pipeline.Operation)
    .map((operation) => {
      const label = operation.out(ns.rdfs.label, { language }).value;
      const comment = operation.out(ns.rdfs.comment, { language }).value;
      const ecmaScriptLink = operation
        .out(ns.code.implementedBy)
        .has(ns.rdf.type, ns.code.EcmaScript)
        .out(ns.code.link);
      const snippet = `<> a p:Step;\n  code:implementedBy [ a code:EcmaScript;\n  code:link <${ecmaScriptLink.value}>\n].`;

      return {
        label,
        comment,
        snippet,
      };
    });

  return operations;
};
