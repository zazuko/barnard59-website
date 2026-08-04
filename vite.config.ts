import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import registry from "./src/data/registry.json" with { type: "json" };

export const SITE_URL = "https://barnard59.zazuko.com";

/**
 * Every dynamic route, resolved from the generated registry. Prerendering them
 * explicitly (rather than relying on link crawling alone) means the build fails
 * loudly if a page cannot be rendered.
 */
const dynamicPages = [
  ...registry.packages.map((pkg) => `/packages/${pkg.slug}`),
  ...registry.packages.flatMap((pkg) =>
    pkg.operations.map(
      (operation) => `/operations/${pkg.slug}/${operation.slug}`,
    ),
  ),
  ...registry.packages.flatMap((pkg) =>
    pkg.commands.map((command) => `/command/${pkg.slug}/${command.slug}`),
  ),
];

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // The whole site is static: no server runtime is deployed.
      prerender: {
        enabled: true,
        // Every page is listed explicitly below or discovered from the route
        // tree. Crawling would additionally follow in-page `#anchor` links and
        // register each one as its own page and sitemap entry.
        crawlLinks: false,
        autoStaticPathsDiscovery: true,
        failOnError: true,
        concurrency: 8,
        retryCount: 2,
      },
      pages: [
        ...dynamicPages.map((path) => ({ path })),
        // GitHub Pages serves /404.html for any unmatched path.
        {
          path: "/404",
          sitemap: { exclude: true },
          prerender: { outputPath: "/404.html" },
        },
      ],
      sitemap: {
        enabled: true,
        host: SITE_URL,
      },
    }),
    viteReact(),
  ],
});
