"use client";

import { useSyncExternalStore } from "react";

import { AzaleaMark } from "@/components/ui/AzaleaMark";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * A minimal external store for the current theme, shared by every mounted
 * `<ThemeToggle>` (the header renders one for the desktop bar and one for the
 * mobile menu, both present in the DOM at once) so clicking either updates
 * both immediately, and read via `useSyncExternalStore` rather than
 * `useEffect` + `useState` so the client-only value never trips a hydration
 * mismatch: that hook is built specifically for state that can only be read
 * in the browser, and skips the warning that reading it any other way would
 * cause.
 */
let listeners: Array<() => void> = [];

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

// SSR has no DOM to read, so this fixed default stands in for it. It is only
// ever used for that one pass — real markup always follows the CSS
// `dark:` variant instead (see below), which is correct from first paint.
function readThemeOnServer(): Theme {
  return "light";
}

function writeTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing or a blocked store: the toggle still works for the
    // rest of this visit, it just will not be remembered next time.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];

  // Before a visitor has ever toggled, keep following the OS setting live.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (event: MediaQueryListEvent) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* stored stays null */
    }
    if (stored) return;
    document.documentElement.setAttribute(
      "data-theme",
      event.matches ? "dark" : "light",
    );
    for (const l of listeners) l();
  };
  media.addEventListener("change", onSystemChange);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    media.removeEventListener("change", onSystemChange);
  };
}

/**
 * Light/dark switch, styled as a track with the clinic mark rather than a
 * sun. The mark sits fixed at the left, where the thumb rests in light mode,
 * and only appears once dark mode has moved the thumb away — so light mode
 * shows a plain track and dark mode reveals the mark rather than the two
 * ever overlapping.
 *
 * The thumb position and mark opacity are plain `dark:` utility classes, not
 * driven by JS state, so they are correct from the very first paint — the
 * blocking script in `layout.tsx` sets `data-theme` before anything renders.
 * `useSyncExternalStore` is only needed for `aria-checked` and the label text.
 */
export function ThemeToggle({
  dict,
  className,
}: {
  dict: Dictionary;
  className?: string;
}) {
  const theme = useSyncExternalStore(subscribe, readTheme, readThemeOnServer);
  const isDark = theme === "dark";

  const toggle = () => writeTheme(readTheme() === "dark" ? "light" : "dark");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-ink-900 transition-colors",
        className,
      )}
    >
      <span className="sr-only">
        {isDark ? dict.nav.theme.toggleToLight : dict.nav.theme.toggleToDark}
      </span>

      <AzaleaMark
        weight={5}
        className="pointer-events-none absolute left-1 h-3 w-3 text-gold-400 opacity-0 transition-opacity duration-300 dark:opacity-100"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1 h-4 w-4 translate-x-0 rounded-full bg-bone-50 shadow-sm transition-transform duration-300 ease-out dark:translate-x-5"
      />
    </button>
  );
}
