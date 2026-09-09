import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import { isAdminHost } from "@/lib/admin/host";
import { SESSION_COOKIE } from "@/lib/admin/session";
import { canonicalHost } from "@/lib/site";

/**
 * Runs in front of the application, and does three things.
 *
 * 1. Sends the dashboard's hostname to the dashboard.
 *
 *    admin.azaleadent.org/appointments  →  /admin/appointments
 *
 *    The rewrite is invisible: the address bar keeps the short path, and the
 *    dashboard has no /admin prefix in any of its links. On the public
 *    hostname the same /admin paths are answered as if they did not exist, so
 *    azaleadent.org/admin is a 404 rather than a login page — the dashboard is
 *    not discoverable from the public site at all.
 *
 * 2. Keeps one address per public page: the default language is published
 *    without its prefix (`/cmimet`, not `/sq/cmimet`), so an unprefixed
 *    request is rewritten onto the default-locale tree and `/sq/...` is
 *    redirected to the short form. Other languages pass straight through.
 *
 * 3. Keeps one hostname. Vercel will not release the `<project>.vercel.app`
 *    address it assigns to production, so requests arriving on it — or on
 *    `www` — are sent to the real domain, folded into the same redirect as (2)
 *    so `www.example.org/sq/prices` reaches `example.org/prices` in one hop.
 *
 * Authorisation is *not* decided here. Proxy runs before the app and cannot
 * safely reach the database; the only thing it checks is whether a session
 * cookie is present at all, purely to save rendering a dashboard for someone
 * who plainly has no session. Whether that cookie names a live session is
 * decided by `requireAdmin()` on every page, action and API route. A forged
 * cookie gets past this file and no further.
 *
 * (Renamed from `middleware.ts`: Next 16 calls this convention `proxy`.)
 */

/**
 * Files Next generates from the route tree. They are addressed by the path it
 * expects, so they are neither redirected nor rewritten.
 */
const GENERATED = new Set(["opengraph-image", "icon", "apple-icon"]);

function isGenerated(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return GENERATED.has(last);
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

/** Paths the dashboard serves without a session. */
function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

/**
 * Search engines must not index the dashboard, and unlike a page's metadata
 * this covers every response the admin host makes — API routes and redirects
 * included.
 */
function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

function adminResponse(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  /* API routes keep their real paths on the admin host: they are addressed
     directly by the dashboard's own fetches and guard themselves with
     requireAdmin(), so prefixing them would only break them. */
  if (isApiPath(pathname)) return withNoIndex(NextResponse.next());

  /* The dashboard is addressed without the /admin prefix on its own host, so
     an explicit /admin/... here would give every page two addresses. Redirect
     to the short form and keep one. */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice("/admin".length) || "/";
    return withNoIndex(NextResponse.redirect(url, 308));
  }

  /* Optimistic only: no cookie means there is certainly no session, so the
     login page is served without rendering a dashboard first. A cookie that is
     present but invalid is caught by requireAdmin(). */
  if (!isPublicAdminPath(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    /* Remembers where they were headed, so signing in lands on that page. */
    login.search =
      pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return withNoIndex(NextResponse.rewrite(login));
  }

  const url = request.nextUrl.clone();
  url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
  return withNoIndex(NextResponse.rewrite(url));
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (isAdminHost(host)) return adminResponse(request);

  const { pathname } = request.nextUrl;

  /* Neither the dashboard nor its API exists on the public hostname. Answered
     as a plain 404 rather than a redirect to the admin host, which would
     advertise where it lives. */
  if (pathname === "/admin" || pathname.startsWith("/admin/") || isAdminApiPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  /* Public API routes are addressed exactly as written and are not part of the
     localised route tree, so they must not be rewritten onto it. */
  if (isApiPath(pathname)) return NextResponse.next();

  const [, first] = pathname.split("/");

  const canonical = canonicalHost();
  const wrongHost = Boolean(canonical && host && host !== canonical);

  /* Generated files are addressed by the path Next expects, so their prefix
     stays; a wrong host is still worth correcting. */
  const wrongPath = first === defaultLocale && !isGenerated(pathname);

  if (wrongPath || wrongHost) {
    const url = request.nextUrl.clone();
    if (wrongPath) {
      url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    }
    if (wrongHost && canonical) {
      url.protocol = "https:";
      url.host = canonical;
      url.port = "";
    }
    return NextResponse.redirect(url, 308);
  }

  // Another language: already in the shape the route tree expects.
  if (first && isLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /**
   * Skips Next's internals and anything with a file extension (icon.svg,
   * sitemap.xml, robots.txt, the manifest).
   *
   * Unlike the public site's previous rules, `/api` is *included*: the public
   * hostname has to answer 404 for /api/admin, which means seeing those
   * requests. Every other API path is passed through untouched above.
   */
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
