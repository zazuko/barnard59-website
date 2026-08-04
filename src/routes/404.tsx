import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "~/components/NotFound.tsx";

/**
 * Prerendered to `/404.html`, which GitHub Pages serves for any unmatched
 * path. From there the client router takes over and resolves the real route.
 */
export const Route = createFileRoute("/404")({
  component: NotFound,
  head: () => ({
    meta: [
      { title: "Page not found · barnard59" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
