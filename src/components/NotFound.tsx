import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <svg
        viewBox="0 0 120 40"
        className="w-40 text-line-strong"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 20h34M76 20h34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M52 20h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 6"
        />
        <circle cx="10" cy="20" r="6" fill="currentColor" />
        <circle cx="110" cy="20" r="6" fill="currentColor" />
      </svg>

      <p className="mt-8 eyebrow text-accent">Error 404</p>
      <h1 className="mt-3 text-title">This step is missing.</h1>
      <p className="mt-4 max-w-md text-lead text-muted">
        The page you asked for does not exist. It may have been renamed, or the
        package may have left the registry.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/operations"
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-accent-fg text-sm shadow-lift transition-opacity hover:opacity-90"
        >
          Browse operations
        </Link>
        <Link
          to="/packages"
          className="rounded-control border border-line bg-surface px-5 py-2.5 font-medium text-sm transition-colors hover:bg-hover"
        >
          All packages
        </Link>
      </div>
    </section>
  );
}
