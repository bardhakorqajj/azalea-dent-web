import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import { getPublicFaq } from "./content";

/**
 * The clinic's own FAQ where it has added one, and the site's otherwise.
 *
 * Shared because three pages render the accordion and each has to describe the
 * same questions in its structured data — resolving it twice, differently, is
 * how those two drift apart.
 */
export type PublicFaqItem = { question: string; answer: string };

export async function publicFaq(locale: Locale): Promise<PublicFaqItem[]> {
  const rows = await getPublicFaq();

  if (rows.length > 0) {
    return rows.map((row) => ({
      question: row.question[locale] ?? row.question.sq ?? "",
      answer: row.answer[locale] ?? row.answer.sq ?? "",
    }));
  }

  return getDictionary(locale).faq.items.map((item) => ({ ...item }));
}
