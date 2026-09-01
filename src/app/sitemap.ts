import type { MetadataRoute } from "next";

import { serviceSlugs } from "@/content/services";
import { locales, path } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site";

const STATIC_PAGES = ["/", "/services", "/about", "/gallery", "/contact", "/appointment"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: absoluteUrl(path(locale, page)),
        lastModified,
        changeFrequency: page === "/" ? "monthly" : "yearly",
        priority: page === "/" ? 1 : 0.8,
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
