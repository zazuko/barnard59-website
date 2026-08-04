/**
 * Post-build step that makes `dist/client` directly deployable to GitHub Pages:
 *
 *   - `.nojekyll` stops Pages from running Jekyll, which would drop `_`-prefixed
 *     asset directories.
 *   - `CNAME` keeps the custom domain bound to the site.
 *   - Sitemap URLs are normalised so they match the canonical link tags the
 *     pages themselves emit (no trailing slash except on the root).
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

await writeFile(join(outDir, ".nojekyll"), "");
await writeFile(join(outDir, "CNAME"), `${DOMAIN}\n`);
await normaliseSitemap();

console.log(`Finalised ${outDir} for GitHub Pages (${DOMAIN})`);
