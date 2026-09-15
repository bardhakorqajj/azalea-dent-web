import { getService as getStaticService, services as staticServices, type Localised, type Service } from "@/content/services";
import { paragraphs, text, type ServiceRow } from "@/lib/db/types";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

import { getPublicServices } from "./content";

/**
 * The services as the public website should show them.
 *
 * The site ships with eight areas of treatment in `src/content/services.ts`,
 * and the dashboard can add to and edit them. This resolves the two into one
 * list, and the shape it returns is the shape the existing components already
 * take — so `ServicesIndex` and the service pages did not have to be rewritten
 * around a database.
 *
 * The rule is simple and is the reason the site cannot break: until the
 * `service` table has an active row, the shipped list is what is served.
 */

export type PublicService = Service & {
  /** Set for a service that came from the database. */
  imageId?: string | null;
  priceText?: Localised | null;
  seoTitle?: Localised | null;
  seoDescription?: Localised | null;
};

/** A `Localised` with both languages filled, falling back between them. */
function bothLanguages(value: Record<string, string | undefined> | null | undefined): Localised {
  const filled = {} as Record<Locale, string>;
  for (const locale of locales) filled[locale] = text(value ?? {}, locale);
  return filled as Localised;
}

/**
 * Turns a database row into the shape the site's components expect.
 *
 * The one piece of translation with any subtlety is the body: the site stores
 * it as an array of paragraphs, the dashboard edits it as one field with blank
 * lines between them. Splitting here keeps the editing simple and the markup
 * unchanged.
 *
 * `priceGroupId` is matched by slug against the shipped services, so an
 * imported service keeps the price table the site already renders for it. A
 * genuinely new service has no group and simply shows no table.
 */
function fromRow(row: ServiceRow): PublicService {
  const shipped = getStaticService(row.slug);

  /* Paragraphs are zipped across languages by position, the same way the
     dashboard's list fields are. */
  const byLocale = Object.fromEntries(
    locales.map((locale) => [locale, paragraphs(row.body[locale])]),
  ) as Record<Locale, string[]>;

  const longest = Math.max(...locales.map((locale) => byLocale[locale].length), 0);

  const body: Localised[] = Array.from({ length: longest }, (_, index) =>
    bothLanguages(
      Object.fromEntries(
        locales.map((locale) => [locale, byLocale[locale][index]]),
      ),
    ),
  );

  return {
    slug: row.slug,
    title: bothLanguages(row.title),
    summary: bothLanguages(row.summary),
    body,
    highlights: row.highlights.map((highlight) => bothLanguages(highlight)),
    /* Kept from the shipped service where there is one: the steps are a fixed
       four-part narrative that the dashboard deliberately does not edit. */
    steps: shipped?.steps ?? [],
    priceGroupId: shipped?.priceGroupId ?? "",
    imageId: row.image_id,
    priceText: row.price_text ? bothLanguages(row.price_text) : null,
    seoTitle: row.seo_title ? bothLanguages(row.seo_title) : null,
    seoDescription: row.seo_description ? bothLanguages(row.seo_description) : null,
  };
}

/** Every service the public site should list, in order. */
export async function publicServices(): Promise<PublicService[]> {
  const { rows, source } = await getPublicServices();
  if (source === "static" || rows.length === 0) return staticServices;
  return rows.map(fromRow);
}

/** One service by slug, from the database if it is there and the file if not. */
export async function publicService(slug: string): Promise<PublicService | null> {
  const all = await publicServices();
  return all.find((service) => service.slug === slug) ?? null;
}

/**
 * The slugs to prerender at build time.
 *
 * Deliberately the shipped ones only. A build must not depend on a reachable
 * database — and it must not bake in whatever the clinic happened to have
 * published that minute. A service added in the dashboard is rendered on
 * demand instead, which Next does by default for a param that
 * `generateStaticParams` did not return.
 */
export function prerenderedServiceSlugs(): string[] {
  return staticServices.map((service) => service.slug);
}
