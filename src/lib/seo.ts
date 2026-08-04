export const SITE_URL = "https://barnard59.zazuko.com";
export const SITE_NAME = "barnard59";
export const SITE_TAGLINE = "Linked Data pipelines, piece by piece";

type SeoInput = {
  title: string;
  description: string;
  /** Absolute path of the page, e.g. `/package/official`. */
  path?: string;
  /** Set on package pages so search engines see them as software. */
  type?: "website" | "article";
};

/**
 * Build the `head` payload TanStack Router expects: a page title plus the
 * Open Graph / Twitter tags that make shared links look right.
 */
export function seo({ title, description, path, type = "website" }: SeoInput) {
  const fullTitle =
    title === SITE_NAME
      ? `${SITE_NAME} — ${SITE_TAGLINE}`
      : `${title} · ${SITE_NAME}`;
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  const image = `${SITE_URL}/og.png`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },

      { property: "og:type", content: type },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
