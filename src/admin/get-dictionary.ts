import { en } from "./dictionaries/en";
import { sq, type AdminDictionary } from "./dictionaries/sq";

/**
 * The dashboard's own interface is in Albanian and English, with the same
 * default as the public site: Albanian, the language the clinic works in.
 *
 * It is deliberately a narrower list than the website's. The site is also
 * published in German, for patients abroad, and the dashboard edits that
 * German copy, but nobody at the clinic needs the dashboard's menus in it, so
 * there is no third admin dictionary to keep up to date.
 *
 * The chosen language is kept in a cookie rather than in the URL. The
 * dashboard's addresses are already short and unprefixed on their own host,
 * and there is exactly one person using it — a `/en/` prefix on every admin
 * page would buy nothing and double the routing.
 */

export const adminLocales = ["sq", "en"] as const;

export type AdminLocale = (typeof adminLocales)[number];

export function isAdminLocale(value: string): value is AdminLocale {
  return (adminLocales as readonly string[]).includes(value);
}

const dictionaries: Record<AdminLocale, AdminDictionary> = { sq, en };

export function getAdminDictionary(locale: AdminLocale): AdminDictionary {
  return dictionaries[locale];
}

export type { AdminDictionary };
