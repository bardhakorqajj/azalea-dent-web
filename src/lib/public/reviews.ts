import { clinic, type Testimonial } from "@/content/clinic";
import { locales, type Locale } from "@/i18n/config";
import { text, type ReviewRow } from "@/lib/db/types";

import { getPublicReviews } from "./content";

/**
 * The reviews the public website shows.
 *
 * `clinic.testimonials` is empty by design — the site ships with no invented
 * testimonials — so until the clinic publishes a real review in the dashboard
 * this returns nothing and the section stays hidden, exactly as it does today.
 *
 * Only published reviews are read. `source` is not shown on the public site:
 * a visitor reading a testimonial does not need to know which platform it came
 * through, and the distinction is kept where it matters, which is the
 * dashboard.
 */

export type PublicReview = Testimonial & { rating: number | null };

function fromRow(row: ReviewRow): PublicReview {
  const quote = {} as Record<Locale, string>;
  for (const locale of locales) quote[locale] = text(row.body, locale);

  return {
    quote: quote as { sq: string; en: string },
    author: row.author_name,
    rating: row.rating,
  };
}

export async function publicReviews(): Promise<PublicReview[]> {
  const rows = await getPublicReviews();
  if (rows.length > 0) return rows.map(fromRow);

  return clinic.testimonials.map((testimonial) => ({ ...testimonial, rating: null }));
}
