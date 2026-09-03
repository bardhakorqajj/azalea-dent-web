import { defaultLocale, locales, path } from "@/i18n/config";

/**
 * Canonical origin for metadata, sitemap and structured data.
 *
 * Resolution order:
 *   1. SITE_URL — set this once the real domain is connected.
 *   2. NEXT_PUBLIC_SITE_URL — the old name for the same thing, still honoured
 *      so an existing deployment does not break on the rename.
 *   3. The Vercel production domain, injected automatically on Vercel.
 *   4. localhost, for development.
 *
 * Read only on the server: metadata, `sitemap.ts`, `robots.ts` and the JSON-LD
 * in `schema.ts`. Nothing in the browser needs it, so it deliberately has no
 * `NEXT_PUBLIC_` prefix — that prefix would inline the value into the client
 * bundle for no reason, and hosts warn about it.
 */
export function siteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${siteUrl()}/`).toString();
}

/**
 * The `hreflang` map for one page, built from `path()` so it follows the
 * prefix rules rather than repeating them. `x-default` points at the default
 * language, which is the unprefixed address.
 */
export function languageAlternates(page = "/"): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, path(locale, page)]),
    ),
    "x-default": path(defaultLocale, page),
  };
}
