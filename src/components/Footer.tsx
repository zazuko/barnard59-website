import { Link } from "@tanstack/react-router";
import { registry, stats } from "~/data/registry.ts";
import {
  GUIDE_URL,
  NPM_SEARCH_URL,
  REPO_URL,
  SITE_REPO_URL,
  ZAZUKO_URL,
} from "~/lib/links.ts";
import { Logo } from "./Header.tsx";

function FooterLink({
  href,
  to,
  children,
}: {
  href?: string;
  to?: "/packages" | "/operations" | "/commands";
  children: React.ReactNode;
}) {
  const className =
    "text-muted text-sm transition-colors hover:text-fg inline-block py-0.5";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-line border-t bg-surface">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-medium text-[1.0625rem] tracking-tight"
          >
            <Logo className="size-7 text-accent" />
            barnard59
          </Link>
          <p className="mt-4 max-w-sm text-muted text-sm leading-relaxed">
            A toolkit for building Linked Data pipelines in Node.js, assembled
            from small, composable operations described in RDF.
          </p>
          <p className="mt-6 text-faint text-xs">
            {stats.packages} packages · {stats.operations} operations ·{" "}
            {stats.commands} commands · updated{" "}
            <time dateTime={registry.generatedAt}>
              {registry.generatedAt.slice(0, 10)}
            </time>
          </p>
        </div>

        <nav aria-label="Browse">
          <h2 className="eyebrow text-faint">Browse</h2>
          <ul className="mt-4 space-y-1.5">
            <li>
              <FooterLink to="/packages">All packages</FooterLink>
            </li>
            <li>
              <FooterLink to="/operations">All operations</FooterLink>
            </li>
            <li>
              <FooterLink to="/commands">CLI commands</FooterLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Project">
          <h2 className="eyebrow text-faint">Project</h2>
          <ul className="mt-4 space-y-1.5">
            <li>
              <FooterLink href={GUIDE_URL}>Documentation ↗</FooterLink>
            </li>
            <li>
              <FooterLink href={REPO_URL}>Source on GitHub</FooterLink>
            </li>
            <li>
              <FooterLink href={NPM_SEARCH_URL}>Packages on npm</FooterLink>
            </li>
            <li>
              <FooterLink href={ZAZUKO_URL}>Made by Zazuko</FooterLink>
            </li>
            <li>
              <FooterLink href={SITE_REPO_URL}>Edit this site</FooterLink>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
