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
 * The single hostname the live site should answer on, or `null` when there is
 * nothing to enforce.
 *
 * Vercel permanently assigns `<project>.vercel.app` to production and it cannot
 * be removed, so without this the site would answer on two addresses at once:
 * bad for search engines, and it puts a stand-in address in front of patients.
 * Requests to any other host are sent here instead.
 *
 * Deliberately narrow. It returns a host only on the production deployment and
 * only when the domain was configured explicitly, so preview deployments keep
 * their own generated URLs, local development is untouched, and a missing
 * `SITE_URL` can never cause a redirect to the wrong place.
 */
export function canonicalHost(): string | null {
  if (process.env.VERCEL_ENV !== "production") return null;

  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!explicit) return null;

  try {
    return new URL(explicit).host;
  } catch {
    return null;
  }
}

/**
 * Whether this deployment should be kept out of search results.
 *
 * True for Vercel's preview and development deployments, whose URLs would
 * otherwise be indexed as copies of the real site. Anything not running on
 * Vercel — local development, or another host entirely — is left alone rather
 * than being blocked on a guess.
 */
export function isUnlistedDeployment(): boolean {
  const env = process.env.VERCEL_ENV;
  return env !== undefined && env !== "production";
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
