import { clinic } from "@/content/clinic";
import { getService as getStaticService } from "@/content/services";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { LocalisedValue, ServiceRow, TeamMemberRow } from "@/lib/db/types";

/**
 * Fills the languages a stored row is missing from the copy the site ships
 * with, where that copy is a translation of the same text.
 *
 * This is what lets a language be added to the website after the clinic has
 * already moved its content into the dashboard. The rows imported before
 * German existed have Albanian and English only, and without this every
 * German page would fall back to Albanian for them.
 *
 * The condition is the point: a shipped translation is used only while the
 * row's Albanian is still exactly the Albanian it was translated from. Once
 * the clinic rewrites a sentence in the dashboard, the shipped German no
 * longer says the same thing, so it is not used, and the field falls back the
 * ordinary way until someone types the German in. Whatever the clinic has
 * typed for a language always wins.
 */
export function withShippedTranslations(
  stored: LocalisedValue | null | undefined,
  shipped: LocalisedValue | null | undefined,
): LocalisedValue {
  const value: LocalisedValue = { ...(stored ?? {}) };
  if (!shipped) return value;

  const source = (value[defaultLocale] ?? "").trim();
  if (source === "" || source !== (shipped[defaultLocale] ?? "").trim()) return value;

  for (const locale of locales) {
    if ((value[locale] ?? "").trim() !== "") continue;
    const translation = shipped[locale];
    if (translation && translation.trim() !== "") value[locale] = translation;
  }

  return value;
}

/* --- The same rule, applied to whole rows ----------------------------------

   The dashboard's forms show a row through these, so the German box holds the
   German the website is already showing for it. Saving the form then stores
   that German in the row, and from there on it is the clinic's to edit. */

/** A service row with the shipped translations of its unchanged fields. */
export function serviceWithShippedTranslations(row: ServiceRow): ServiceRow {
  const shipped = getStaticService(row.slug);
  if (!shipped) return row;

  const shippedBody = Object.fromEntries(
    locales.map((locale) => [
      locale,
      shipped.body.map((paragraph) => paragraph[locale]).join("\n\n"),
    ]),
  );

  return {
    ...row,
    title: withShippedTranslations(row.title, shipped.title),
    summary: withShippedTranslations(row.summary, shipped.summary),
    body: withShippedTranslations(row.body, shippedBody),
    /* Matched by their Albanian rather than by position, so a point the
       clinic added or reordered never borrows a neighbour's translation. */
    highlights: row.highlights.map((highlight) =>
      withShippedTranslations(
        highlight,
        shipped.highlights.find((candidate) => candidate.sq === highlight.sq),
      ),
    ),
  };
}

/** A team member row with the shipped translations of its unchanged fields. */
export function teamMemberWithShippedTranslations(row: TeamMemberRow): TeamMemberRow {
  const shipped = clinic.team.find((member) => member.name === row.name);
  if (!shipped) return row;

  return {
    ...row,
    role: withShippedTranslations(row.role, shipped.role),
    bio: withShippedTranslations(row.bio, shipped.bio),
  };
}

/**
 * An FAQ row with the shipped translations of its question and answer. The
 * rows have no slug, so the shipped item is found by its Albanian question.
 */
export function faqItemWithShippedTranslations<
  T extends { question: LocalisedValue; answer: LocalisedValue },
>(row: T): T {
  const items = Object.fromEntries(
    locales.map((locale) => [locale, getDictionary(locale).faq.items]),
  ) as Record<Locale, { question: string; answer: string }[]>;

  const index = items[defaultLocale].findIndex(
    (item) => item.question === row.question[defaultLocale],
  );
  if (index === -1) return row;

  const pick = (field: "question" | "answer"): LocalisedValue =>
    Object.fromEntries(locales.map((locale) => [locale, items[locale][index]?.[field]]));

  return {
    ...row,
    question: withShippedTranslations(row.question, pick("question")),
    answer: withShippedTranslations(row.answer, pick("answer")),
  };
}
