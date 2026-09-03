import { defaultLocale, locales, path } from "@/i18n/config";

/**
 * Canonical origin for metadata, sitemap and structured data.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this once the real domain is connected.
 *   2. The Vercel production domain, injected automatically on Vercel.
 *   3. localhost, for development.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

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
