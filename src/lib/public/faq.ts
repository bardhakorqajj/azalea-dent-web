import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { text } from "@/lib/db/types";

import { getPublicFaq } from "./content";
import { faqItemWithShippedTranslations } from "./translations";

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
    return rows.map((row) => {
      const translated = faqItemWithShippedTranslations(row);
      return {
        question: text(translated.question, locale),
        answer: text(translated.answer, locale),
      };
    });
  }

  return getDictionary(locale).faq.items.map((item) => ({ ...item }));
}
