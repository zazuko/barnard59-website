/**
 * Post-build step that makes `dist/client` directly deployable to GitHub Pages:
 *
 *   - `.nojekyll` stops Pages from running Jekyll, which would drop `_`-prefixed
 *     asset directories.
 *   - `CNAME` keeps the custom domain bound to the site.
 *   - Sitemap URLs are normalised so they match the canonical link tags the
 *     pages themselves emit (no trailing slash except on the root).
 *   - Every operation and command page gets a sibling `.ttl` holding the RDF
 *     that describes it, so `<page>.ttl` returns the raw Turtle.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import turtle from "../src/data/turtle.json" with { type: "json" };

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/client");

const DOMAIN = "barnard59.zazuko.com";

async function normaliseSitemap() {
  const path = join(outDir, "sitemap.xml");

  let xml: string;
  try {
    xml = await readFile(path, "utf8");
  } catch {
    console.warn("no sitemap.xml to normalise");
    return;
  }

  // Drop the trailing slash from every <loc> except the site root.
  const normalised = xml.replace(
    /<loc>(https?:\/\/[^<]*?)\/<\/loc>/g,
    (match, url: string) =>
      url === `https://${DOMAIN}` ? match : `<loc>${url}</loc>`,
  );

  await writeFile(path, normalised);
}

/**
 * Write `<page>.ttl` next to each page directory, e.g. `/operations/ftp/list`
 * is served from `operations/ftp/list/index.html` and its RDF from
 * `operations/ftp/list.ttl`. The two coexist happily on a filesystem.
 */
async function writeTurtle() {
  const entries = Object.entries(turtle as Record<string, string>);

  await Promise.all(
    entries.map(async ([path, body]) => {
      const file = join(outDir, `${path}.ttl`);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, body);
    }),
  );

  return entries.length;
}

await writeFile(join(outDir, ".nojekyll"), "");
await writeFile(join(outDir, "CNAME"), `${DOMAIN}\n`);
await normaliseSitemap();
const written = await writeTurtle();

console.log(
  `Finalised ${outDir} for GitHub Pages (${DOMAIN}) — ${written} .ttl files`,
);
