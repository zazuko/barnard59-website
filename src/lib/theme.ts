import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/**
 * Reads the theme applied by the inline boot script and lets the user flip it.
 *
 * The DOM is the source of truth: the script in <head> has already set the
 * class before React runs, so mounting only needs to read it back.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      const root = document.documentElement;
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Private browsing: the choice simply will not persist.
      }
      return next;
    });
  }, []);

  return { theme, toggle, mounted };
}
