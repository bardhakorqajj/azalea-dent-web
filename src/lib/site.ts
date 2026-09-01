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
