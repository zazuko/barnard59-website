# `barnard59` website

The website for [barnard59](https://github.com/zazuko/barnard59), published at
<https://barnard59.zazuko.com>.

It is a fully static site: every page is prerendered to HTML at build time, and
no server runs in production.

## Stack

| | |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) |
| Build | [Vite](https://vite.dev) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 (CSS-first theme in `src/styles.css`) |
| Lint & format | [Biome](https://biomejs.dev) |
| Types | TypeScript |
| RDF | [`@zazuko/env-node`](https://github.com/zazuko/rdf-utils) — build time only |

## URLs

Plural paths are indexes, singular paths are single resources:

```
/                            home
/packages                    every package
/packages/ftp                one package — barnard59-ftp
/operations                  every operation, filterable
/operation/ftp/list          one operation
/commands                    every CLI command
/command/graph-store/put     one CLI command
```

Package segments drop the `barnard59-` prefix. An operation's path within its
package comes from the local part of its IRI, so some nest more deeply than
others: `/operation/formats/jsonld/parse`, `/operation/sparql/in-memory/query`.

## Turtle

Every operation and command page has a `.ttl` sibling:

```
/operation/ftp/list.ttl          the RDF describing that operation
/command/graph-store/put.ttl     the pipeline definition the command runs
```

For an operation that is the Concise Bounded Description taken from its
package's `manifest.ttl`. For a command it is the pipeline itself — the file
`b59:source` points at — since that is the runnable artefact; a command whose
package does not publish that file falls back to its manifest description.

The files are written by `scripts/finalize-pages.ts` after the build, and each
page advertises its own with `<link rel="alternate" type="text/turtle">`.

Note that GitHub Pages may not serve `.ttl` as `text/turtle`; static hosting
offers no way to set the header.

## Add a package

Add its name to [`packages.yaml`](packages.yaml):

```yaml
packages:
  - barnard59-core
  - barnard59-rdf
```

That is the only file you need to touch. Everything else about the package is
resolved automatically at build time.

## How the data works

There is no database and no runtime fetching. [`scripts/build-data.ts`](scripts/build-data.ts)
runs before every build and, for each package:

1. reads `package.json` from unpkg (falling back to jsDelivr) for the version,
   description, license and repository;
2. reads and parses the RDF `manifest.ttl` to extract
   - `p:Operation` — pipeline steps, with their labels, comments, IRIs,
     implementation modules and stream modes;
   - `b59:CliCommand` — ready-made pipelines exposed as barnard59 subcommands,
     along with the pipeline definition each one runs;
3. reads the monthly download count from the npm API.

The result is written to `src/data/registry.json`, which the site imports
directly. Because all RDF and YAML parsing happens here, none of it ships to the
browser.

Each operation is classified from its declared stream modes: readable only is a
**source**, writable only is a **sink**, both is a **transform**.

A command's URL is built from the package slug and its `b59:command` value
rather than from its IRI, because a few manifests declare commands under an
`operations/…` base that does not match their package. The pipeline file named
by `b59:source` is fetched too, when the package actually publishes it.

`registry.json` is generated, not committed. Regenerate it with:

```sh
npm run data
```

## Develop

```sh
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 unless the port is taken).

`npm run dev` reuses a cached `registry.json` if it is less than 12 hours old,
so it does not hit the network on every start. Use `npm run data` to force a
refresh.

## Build

```sh
npm run build
```

This generates the data, prerenders every route and writes the site to
`dist/client`, including `sitemap.xml`, `CNAME` and `.nojekyll`. That directory
can be served by any static host as-is:

```sh
npm run preview
```

## Checks

```sh
npm run lint       # Biome lint + format check
npm run format     # apply fixes
npm run typecheck  # tsc --noEmit (run after a build, for the generated route tree)
```

## Deployment

[`.github/workflows/ci.yaml`](.github/workflows/ci.yaml) builds and deploys
`dist/client` to GitHub Pages on every push to `main`, and on a weekly schedule
so newly published packages and operations appear without a code change.
