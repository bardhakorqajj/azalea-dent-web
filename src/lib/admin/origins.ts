/**
 * The hostnames this application is served on.
 *
 * One list, read by two places that must agree: `next.config.ts`, which hands
 * it to Next as `serverActions.allowedOrigins`, and `verifySameOrigin()`,
 * which checks a request's `Origin` against it.
 *
 * Checking `Origin` against a *configured* list rather than against the
 * request's own `Host` header is the important part. This app is served on two
 * hostnames and reaches its own routes through a proxy rewrite, and a platform
 * that terminates TLS rewrites `Host` to an internal name — so comparing the
 * browser's `Origin` to `Host` rejects perfectly good requests, which is
 * exactly what happened before this module existed. The set of addresses the
 * dashboard answers on is known from configuration, so that is what to compare
 * against.
 *
 * Deliberately free of any Next import, so `next.config.ts` can use it while
 * the config is being evaluated.
 */

/** Strips a scheme, a path, a trailing dot and a default port. */
export function normaliseOrigin(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .replace(/:(80|443)$/, "");
}

/**
 * Every host a request may legitimately come from.
 *
 * Built from the environment so one build serves production, a staging domain
 * and a preview deployment without a code change.
 */
export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const origins = new Set<string>();

  const explicit = env.ADMIN_HOST?.trim();
  if (explicit) origins.add(normaliseOrigin(explicit));

  const site = env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      const host = normaliseOrigin(new URL(site).host);
      origins.add(host);
      /* www, and the admin subdomain `adminHost()` derives. */
      origins.add(`www.${host.replace(/^www\./, "")}`);
      origins.add(`admin.${host.replace(/^www\./, "")}`);
    } catch {
      /* An unusable SITE_URL is reported elsewhere; it must not fail a build. */
    }
  }

  /* Vercel assigns this to production and it cannot be removed, so a form
     submitted from it has to be accepted rather than silently failing. */
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) origins.add(normaliseOrigin(vercel));
  if (env.VERCEL_URL) origins.add(normaliseOrigin(env.VERCEL_URL));

  /* Development. `admin.localhost` resolves in current browsers without
     touching /etc/hosts, which is how the two-hostname split is exercised
     locally. */
  if (env.NODE_ENV !== "production") {
    for (const port of ["3000", "3001"]) {
      origins.add(`localhost:${port}`);
      origins.add(`admin.localhost:${port}`);
      origins.add(`127.0.0.1:${port}`);
    }
    origins.add("localhost");
    origins.add("admin.localhost");
  }

  return [...origins];
}

/** Whether an `Origin` header names one of those hosts. */
export function isAllowedOrigin(
  origin: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  let host: string;
  try {
    host = normaliseOrigin(new URL(origin).host);
  } catch {
    return false;
  }
  if (host === "") return false;

  return allowedOrigins(env).some((allowed) => normaliseOrigin(allowed) === host);
}
