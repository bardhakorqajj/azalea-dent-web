import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isDatabaseConfigured } from "@/lib/db/client";

import { isAllowedOrigin } from "./origins";

import { readSession, verifyCsrfToken, type AdminSession } from "./session";

/**
 * The gate every admin page, server action and API route passes through.
 *
 * It is deliberately *not* implemented in `proxy.ts`. Proxy runs in front of
 * the app and is the wrong place for the real check — Next's own guidance is
 * that it is for optimistic redirects, not authorisation. Proxy here only
 * routes the admin host and bounces requests with no cookie at all; the
 * decision that someone is signed in is made here, next to the data, on every
 * single request.
 */

export const ADMIN_LOGIN_PATH = "/admin/login";

/** Signed-in session, or null. Never throws for an unauthenticated visitor. */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await readSession();
  } catch (error) {
    /* An unreachable database must read as "not signed in", never as
       "signed in" — failing closed is the only safe direction here. */
    console.error("Reading the admin session failed:", error);
    return null;
  }
}

/**
 * Requires a signed-in admin, redirecting to the login page otherwise.
 * Used by admin pages and layouts.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/** Thrown by `requireAdminForAction` so an action never proceeds unauthorised. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Requires a signed-in admin inside a server action or route handler, where a
 * redirect is not the right answer.
 *
 * Server actions are reachable by a direct POST, not only through the
 * dashboard's own UI, so this runs in every one of them rather than relying on
 * the page having been rendered behind a guard.
 */
export async function requireAdminForAction(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * The full check for a mutating server action: signed in, a matching CSRF
 * token, and a same-origin request.
 */
export async function requireAdminMutation(formData: FormData): Promise<AdminSession> {
  const session = await requireAdminForAction();

  if (!(await verifySameOrigin())) throw new UnauthorizedError();
  if (!(await verifyCsrfToken(formData.get("csrf")))) throw new UnauthorizedError();

  return session;
}

/**
 * Checks that the request came from one of the hostnames this application is
 * served on.
 *
 * Next already guards server actions against cross-origin POSTs, and
 * SameSite=Lax stops the cookie travelling on a cross-site form post; this is
 * the third, explicit layer, and the one visible in the code. It is also the
 * only layer the API route handlers get, since a route handler receives none
 * of a server action's framework protections.
 *
 * The comparison is against the configured hosts in `origins.ts`, not against
 * the request's own `Host` header. That distinction is not academic: the
 * dashboard is reached through a proxy rewrite on a second hostname, and a
 * platform terminating TLS rewrites `Host` to an internal name — comparing
 * `Origin` to `Host` there rejects every legitimate form submission.
 */
export async function verifySameOrigin(): Promise<boolean> {
  const headerList = await headers();
  const origin = headerList.get("origin");

  /* No Origin at all: a same-origin navigation, or a client too old to send
     one. Nothing is mutated on that path — the caller still checks CSRF. */
  if (!origin) return true;

  return isAllowedOrigin(origin);
}

/** The client IP as the platform reports it, for rate limiting. */
export async function clientIp(): Promise<string | null> {
  const headerList = await headers();

  /* Vercel sets x-forwarded-for; the leftmost entry is the client. Trusting a
     header is only sound behind a proxy that overwrites it, which is the case
     on every managed host this app is meant to run on. */
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return headerList.get("x-real-ip") ?? null;
}

export async function clientUserAgent(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("user-agent");
}
