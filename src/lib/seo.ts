import type { Metadata } from "next";

import { clinic } from "@/content/clinic";
import { htmlLang, path, type Locale } from "@/i18n/config";
import {
  absoluteUrl,
  isUnlistedDeployment,
  languageAlternates,
} from "@/lib/site";

/**
 * One builder for every page's metadata.
 *
 * Before this existed each page set `title`, `description`, `alternates` and
 * `openGraph` by hand and left `twitter` alone. Next merges metadata per
 * field, not per page, so the untouched `twitter` block kept inheriting the
 * *home page* title and description from the root layout: every share of
 * /prices, /contact or a treatment page on X advertised the home page. Routing
 * every page through here keeps the two social blocks saying the same thing as
 * the page itself, and means a future field is added once rather than nine
 * times.
 *
 * `robots` is resolved here too. `robots.txt` already disallows crawling on
 * Vercel's preview deployments, but a URL that is merely uncrawlable can still
 * be indexed from a link elsewhere — the directive that actually keeps a page
 * out of the index is `noindex` on the page itself, and a blocked crawler
 * never reads it. Emitting the tag on previews closes that gap; production is
 * explicitly indexable.
 */
export function pageMetadata({
  locale,
  page,
  title,
  description,
  /** Overrides the `%s | Azalea Dent` template — used by the home page. */
  absoluteTitle,
}: {
  locale: Locale;
  /** Unprefixed page path, e.g. "/prices" or "/services/endodonci". */
  page: string;
  title: string;
  description: string;
  absoluteTitle?: string;
}): Metadata {
  const url = path(locale, page);
  const social = absoluteTitle ?? `${title} | ${clinic.name}`;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(page),
    },
    openGraph: {
      type: "website",
      siteName: clinic.name,
      title: social,
      description,
      locale: htmlLang[locale].replace("-", "_"),
      url: absoluteUrl(url),
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
    },
    robots: isUnlistedDeployment()
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
