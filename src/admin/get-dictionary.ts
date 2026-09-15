import type { Locale } from "@/i18n/config";

import { en } from "./dictionaries/en";
import { sq, type AdminDictionary } from "./dictionaries/sq";

/**
 * The dashboard follows the same two languages as the public site, and the
 * same default: Albanian, the language the clinic works in.
 *
 * The chosen language is kept in a cookie rather than in the URL. The
 * dashboard's addresses are already short and unprefixed on their own host,
 * and there is exactly one person using it — a `/en/` prefix on every admin
 * page would buy nothing and double the routing.
 */

const dictionaries: Record<Locale, AdminDictionary> = { sq, en };

export function getAdminDictionary(locale: Locale): AdminDictionary {
  return dictionaries[locale];
}

export type { AdminDictionary };
