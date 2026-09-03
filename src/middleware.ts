import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * Keeps one address per page.
 *
 * Pages live under `app/[locale]/`, but the default language is published
 * without its prefix: `/cmimet`, not `/sq/cmimet`. So an unprefixed request is
 * rewritten onto the default-locale tree, and anything that still asks for
 * `/sq/...` is redirected to the short form, which keeps older links and any
 * already-indexed URLs working.
 *
 * Other languages keep their prefix and pass straight through.
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");

  if (first === defaultLocale) {
    if (isGenerated(pathname)) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Another language: already in the shape the route tree expects.
  if (first && isLocale(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /* Skips the API, Next's internals, and anything with a file extension
     (icon.svg, sitemap.xml, robots.txt, the manifest). */
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
