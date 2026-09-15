import { unstable_cache } from "next/cache";

import { services as staticServices, type Service } from "@/content/services";
import { clinic } from "@/content/clinic";
import { contentBlocks, type ContentBlockDefinition } from "@/lib/cms/registry";
import { isDatabaseConfigured } from "@/lib/db/client";
import { contentOverrides, resolveContent, activeFaqItems } from "@/lib/db/repos/content";
import { publishedGalleryImages, type GalleryImageWithMedia } from "@/lib/db/repos/gallery";
import { livePromotions } from "@/lib/db/repos/promotions";
import { publishedReviews } from "@/lib/db/repos/reviews";
import { activeServices } from "@/lib/db/repos/services";
import { activeTeam } from "@/lib/db/repos/team";
import { readSettings } from "@/lib/db/repos/settings";
import type {
  FaqItemRow,
  LocalisedValue,
  PromotionRow,
  ReviewRow,
  ServiceRow,
  TeamMemberRow,
} from "@/lib/db/types";
import { defaultSettings, type SettingsShape } from "@/lib/settings/registry";
import { PUBLIC_TAGS } from "./tags";

/**
 * What the public website reads.
 *
 * Two rules run through every function here, and they are the whole point of
 * this module.
 *
 * **It never breaks the website.** Each read is wrapped so that no database,
 * an un-migrated database, an unreachable one, or simply an empty table all
 * produce the same thing: the content the site already ships with in
 * `src/content` and `src/i18n`. The dashboard is an enhancement layered over a
 * site that works without it — a Postgres outage makes the clinic unable to
 * *edit* the site, not unable to *serve* it.
 *
 * **It is cached, and the dashboard invalidates it.** Every read is tagged, and
 * every admin action that writes the underlying table clears the matching tag
 * (see `refreshPublic`). So the pages are static-fast for patients and current
 * for the clinic.
 */

/**
 * Runs a database read, falling back to the shipped content on any failure.
 *
 * Catching broadly is deliberate here. This is the one place in the codebase
 * where swallowing an error is the right behaviour: the alternative is a
 * dental clinic's website returning 500 to a patient looking up the phone
 * number because a connection pool was exhausted. The failure is logged so it
 * is not invisible.
 */
async function withFallback<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;

  try {
    return await read();
  } catch (error) {
    console.error(
      `Public read "${label}" failed; serving the site's built-in content instead:`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

/** Labels already reported, so a persistent fall-through logs once. */
const reported = new Set<string>();

/**
 * Wraps a read in the request cache, and keeps working without one.
 *
 * `unstable_cache` throws outright when there is no incremental cache in
 * scope — which is the case anywhere outside a request, a unit test included.
 * The read underneath is already safe on its own, so the cache is treated as
 * an optimisation that may be absent rather than as a dependency: without one
 * the read simply runs. That keeps a route or a script that reaches this code
 * from a context Next did not set up serving content instead of a 500.
 */
function cached<T>(
  label: string,
  read: () => Promise<T>,
  key: string,
  tag: string,
): () => Promise<T> {
  const wrapped = unstable_cache(read, [key], { tags: [tag] });

  return async () => {
    try {
      return await wrapped();
    } catch (error) {
      if (!reported.has(label)) {
        reported.add(label);
        console.error(
          `Public read "${label}" ran without a cache:`,
          error instanceof Error ? error.message : error,
        );
      }
      return read();
    }
  };
}

// === Services =============================================================

/**
 * The services the website lists.
 *
 * Returns the database rows once any exist, and the eight areas of treatment
 * from `src/content/services.ts` until then — so the site looks the same the
 * moment the dashboard is deployed and before anything has been imported.
 */
export const getPublicServices = cached(
  "services",
  async (): Promise<{ rows: ServiceRow[]; source: "database" | "static" }> => {
    const rows = await withFallback("services", activeServices, []);
    return rows.length > 0
      ? { rows, source: "database" }
      : { rows: [], source: "static" };
  },
  "public-services",
  PUBLIC_TAGS.services,
);

/** The static services, for the fallback path and for the import. */
export function staticServiceList(): Service[] {
  return staticServices;
}

// === Team =================================================================

export const getPublicTeam = cached(
  "team",
  async (): Promise<TeamMemberRow[]> => withFallback("team", activeTeam, []),
  "public-team",
  PUBLIC_TAGS.team,
);

// === Reviews ==============================================================

/**
 * Published reviews.
 *
 * `clinic.testimonials` is empty by design — the site ships with no invented
 * testimonials — so an empty result here means the section stays hidden, which
 * is exactly what it does today.
 */
export const getPublicReviews = cached(
  "reviews",
  async (): Promise<ReviewRow[]> => withFallback("reviews", publishedReviews, []),
  "public-reviews",
  PUBLIC_TAGS.reviews,
);

// === Promotions ===========================================================

export const getPublicPromotions = cached(
  "promotions",
  async (): Promise<PromotionRow[]> =>
    withFallback("promotions", livePromotions, []),
  "public-promotions",
  PUBLIC_TAGS.promotions,
);

// === Gallery ==============================================================

/**
 * Published gallery images.
 *
 * Empty until the clinic uploads something, in which case the site's own
 * photography in `src/content/images.ts` continues to fill the gallery. The
 * two are additive rather than exclusive: the clinic's shipped photographs are
 * the gallery's foundation, and uploads extend it.
 */
export const getPublicGallery = cached(
  "gallery",
  async (): Promise<GalleryImageWithMedia[]> =>
    withFallback("gallery", publishedGalleryImages, []),
  "public-gallery",
  PUBLIC_TAGS.gallery,
);

// === Editable copy ========================================================

/**
 * Every editable text block, resolved against the copy the site ships with.
 *
 * Returned as a plain record so a page can read `copy["home.hero.title"]`
 * without another database round trip per block.
 */
export const getPublicCopy = cached(
  "content",
  async (): Promise<Record<string, LocalisedValue>> => {
    const overrides = await withFallback(
      "content",
      contentOverrides,
      new Map<string, LocalisedValue>(),
    );

    const resolved: Record<string, LocalisedValue> = {};
    for (const block of contentBlocks) {
      resolved[block.key] = resolveContent(block.key, overrides);
    }
    return resolved;
  },
  "public-copy",
  PUBLIC_TAGS.content,
);

/** The shipped copy for one block, for a caller with no need to read the DB. */
export function copyFallback(key: string): ContentBlockDefinition | undefined {
  return contentBlocks.find((block) => block.key === key);
}

// === FAQ ==================================================================

export const getPublicFaq = cached(
  "faq",
  async (): Promise<FaqItemRow[]> => withFallback("faq", activeFaqItems, []),
  "public-faq",
  PUBLIC_TAGS.faq,
);

// === Settings =============================================================

/**
 * The clinic's details as the website should state them.
 *
 * Merged over `src/content/clinic.ts`, so the address, the phone numbers and
 * the opening hours are the published ones unless the dashboard has changed
 * them. With no database at all this is exactly `clinic.ts`, which is how the
 * site behaves today.
 */
export const getPublicSettings = cached(
  "settings",
  async (): Promise<SettingsShape> =>
    withFallback("settings", readSettings, defaultSettings()),
  "public-settings",
  PUBLIC_TAGS.settings,
);

/** The clinic facts, for code that has not been moved onto settings yet. */
export function clinicFacts(): typeof clinic {
  return clinic;
}
