import type { MetadataRoute } from "next";

import { serviceSlugs } from "@/content/services";
import { locales, path } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site";

/**
 * Every indexable page, in rough order of importance. `priority` and
 * `changeFrequency` are hints Google has said it largely ignores; they are kept
 * because other crawlers (and Bing) still read them, and because they cost
 * nothing. What actually matters here is that every URL is listed once, in its
 * canonical unprefixed form for Albanian, with its `hreflang` alternates.
 */
const STATIC_PAGES = [
  "/",
  "/services",
  "/implante-dentare",
  "/prices",
  "/about",
  "/gallery",
  "/contact",
  "/appointment",
];

/** Pages that earn a higher priority than the 0.8 the rest share. */
const PRIORITY: Record<string, number> = {
  "/": 1,
  "/services": 0.9,
  "/implante-dentare": 0.9,
  "/prices": 0.9,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: absoluteUrl(path(locale, page)),
        lastModified,
        changeFrequency: page === "/" ? "monthly" : "yearly",
        priority: PRIORITY[page] ?? 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((other) => [other, absoluteUrl(path(other, page))]),
          ),
        },
      });
    }

    for (const slug of serviceSlugs) {
      entries.push({
        url: absoluteUrl(`${path(locale, "/services")}/${slug}`),
        lastModified,
        changeFrequency: "yearly",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((other) => [
              other,
              absoluteUrl(`${path(other, "/services")}/${slug}`),
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
