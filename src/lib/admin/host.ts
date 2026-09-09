import { siteUrl } from "@/lib/site";

/**
 * Which hostname serves the dashboard.
 *
 * The public website and the dashboard are one application sharing one
 * database, separated by hostname rather than by a URL prefix:
 *
 *   azaleadent.org         → the public website
 *   admin.azaleadent.org   → the dashboard
 *
 * There is deliberately no /admin address on the public site. A URL prefix
 * would put the dashboard on the same origin as the public pages, so a
 * scripting hole anywhere on the marketing site would sit inside the
 * dashboard's origin — same cookies, same localStorage, same everything. A
 * separate host makes that a cross-origin problem instead of a local one, and
 * it means the dashboard is not something a patient can stumble into.
 *
 * This module is imported by `proxy.ts`, which runs in front of the app, so it
 * stays free of database access and of anything heavier than string work.
 */

/** Configured explicitly, or derived from the site URL. */
export function adminHost(): string | null {
  const explicit = process.env.ADMIN_HOST?.trim();
  if (explicit) return normaliseHost(explicit);

  /* Derived so a correctly configured SITE_URL is enough in production:
     azaleadent.org → admin.azaleadent.org. */
  try {
    const host = new URL(siteUrl()).host;
    if (!host || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      return null;
    }
    const bare = host.replace(/^www\./, "");
    return `admin.${bare}`;
  } catch {
    return null;
  }
}

/** Strips a scheme, a path and a trailing dot, leaving `host[:port]`. */
export function normaliseHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

/**
 * Whether a request's Host header addresses the dashboard.
 *
 * In development there is only one hostname, so the dashboard is reached by
 * either setting ADMIN_HOST (e.g. `admin.localhost:3000`, which resolves
 * without touching /etc/hosts in current browsers) or by visiting /admin
 * directly on localhost. Both are development-only conveniences: with a real
 * ADMIN_HOST configured, the localhost allowance is gone.
 */
export function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  const normalised = normaliseHost(host);

  const configured = adminHost();
  if (configured) {
    /* Compare the hostname without the port, so :3000 in development and
       :443 behind a proxy both match a configured bare host. */
    return stripPort(normalised) === stripPort(configured);
  }

  /* No admin host is configured. Only a development machine gets to serve the
     dashboard from the same address as the site. */
  if (process.env.NODE_ENV !== "production") {
    const bare = stripPort(normalised);
    return bare === "localhost" || bare === "127.0.0.1" || bare.startsWith("admin.");
  }

  return false;
}

export function stripPort(host: string): string {
  /* IPv6 literals are bracketed, so a colon inside them is not a port. */
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(0, end + 1);
  }
  const colon = host.lastIndexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

/**
 * Whether the dashboard is served from its own hostname.
 *
 * False on a development machine with no ADMIN_HOST set, where /admin on
 * localhost is the way in. The dashboard uses it to decide whether to show the
 * "still on the public hostname" notice.
 */
export function adminHostConfigured(): boolean {
  return adminHost() !== null;
}

/** The address of the dashboard, for a link out of the public site's footer. */
export function adminUrl(path = "/"): string {
  const host = adminHost();
  if (!host) return `/admin${path === "/" ? "" : path}`;
  return `https://${host}${path === "/" ? "/" : path}`;
}
