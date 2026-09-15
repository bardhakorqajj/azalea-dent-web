import type { Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { contentBlocks } from "@/lib/cms/registry";

import { getPublicCopy } from "./content";

/**
 * The site's dictionary with the clinic's edits laid over it.
 *
 * This is how the CMS reaches the public website without a single component
 * changing. Every component already reads its copy from the dictionary — a
 * heading is `dict.hero.title` — so an override is applied by writing it into
 * a copy of the dictionary at the same path. Nothing downstream needs to know
 * where the string came from.
 *
 * The alternative was threading a `copy` object through every section, and
 * having each one decide whether to prefer it. That is more code in more
 * places, and every place is somewhere the fallback can be got wrong.
 *
 * The static dictionary is never mutated: it is a module-level constant shared
 * by every request, so a write into it would leak one visitor's language — or
 * one clinic edit mid-deploy — into everyone else's page.
 */
export async function getPublicDictionary(locale: Locale): Promise<Dictionary> {
  const base = getDictionary(locale);
  const copy = await getPublicCopy();

  /* Only the blocks whose text actually differs from what the site ships
     with, so an untouched site does no cloning at all. */
  const changes = contentBlocks
    .map((block) => ({
      path: block.path,
      value: copy[block.key]?.[locale],
      fallback: block.fallback[locale],
    }))
    .filter(
      (
        change,
      ): change is { path: string; value: string; fallback: string | undefined } =>
        typeof change.value === "string" &&
        change.value !== "" &&
        change.value !== change.fallback,
    );

  if (changes.length === 0) return base;

  const merged = structuredClone(base) as Dictionary;
  for (const change of changes) setPath(merged, change.path, change.value);
  return merged;
}

/**
 * Writes a value at a dot path, and only where something is already there.
 *
 * The guard matters: a key renamed in the dictionary but left in the registry
 * would otherwise grow a new branch that no component reads, hiding the
 * mismatch. Refusing to create the path surfaces it in development instead.
 */
function setPath(target: object, path: string, value: string): void {
  const parts = path.split(".");
  const last = parts.pop();
  if (!last) return;

  let node: Record<string, unknown> = target as Record<string, unknown>;
  for (const part of parts) {
    const next = node[part];
    if (typeof next !== "object" || next === null) return;
    node = next as Record<string, unknown>;
  }

  if (typeof node[last] !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Content block path "${path}" does not name a string in the dictionary; ` +
          "the override was ignored. Check src/lib/cms/registry.ts.",
      );
    }
    return;
  }

  node[last] = value;
}
