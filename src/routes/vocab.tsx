import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GUIDE_URL } from "~/lib/links.ts";
import { SITE_URL, seo } from "~/lib/seo.ts";

const VOCAB_IRI = `${SITE_URL}/vocab#`;
const TURTLE_URL = `${SITE_URL}/vocab.ttl`;

export const Route = createFileRoute("/vocab")({
  component: VocabPage,
  head: () => {
    const base = seo({
      title: "Vocabulary",
      description:
        "The barnard59 vocabulary — terms used in package manifests, such as b59:CliCommand.",
      path: "/vocab",
    });

    return {
      ...base,
      meta: [
        ...base.meta,
        // Redirects before any JavaScript runs, and without it entirely.
        { httpEquiv: "refresh", content: `0; url=${GUIDE_URL}` },
        { name: "robots", content: "noindex" },
      ],
      links: [
        ...base.links,
        { rel: "alternate", type: "text/turtle", href: TURTLE_URL },
      ],
    };
  },
});

function VocabPage() {
  // Belt and braces: some browsers and extensions suppress meta refresh.
  useEffect(() => {
    window.location.replace(GUIDE_URL);
  }, []);

  return (
    <section className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow text-accent">Vocabulary</p>
      <h1 className="mt-3 text-title">
        <code className="font-mono text-[0.6em]">{VOCAB_IRI}</code>
      </h1>
      <p className="mt-5 max-w-lg text-lead text-muted">
        Terms used in barnard59 package manifests. Taking you to the
        documentation…
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={GUIDE_URL}
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-accent-fg text-sm shadow-lift transition-opacity hover:opacity-90"
        >
          Go to the documentation ↗
        </a>
        <a
          href={TURTLE_URL}
          className="rounded-control border border-line bg-surface px-5 py-2.5 font-medium text-sm transition-colors hover:bg-hover"
        >
          View the vocabulary as Turtle ↓
        </a>
      </div>
    </section>
  );
}
