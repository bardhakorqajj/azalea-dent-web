import { cookies } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

import { getAdminDictionary, type AdminDictionary } from "./get-dictionary";

/**
 * The dashboard's language, kept in a cookie.
 *
 * Unlike the public site, the dashboard does not put the language in the URL:
 * its addresses are already short and unprefixed on their own host, and there
 * is exactly one person using it, so a `/en/` prefix on every admin route
 * would double the routing to no benefit.
 */

export const ADMIN_LOCALE_COOKIE = "azalea_admin_locale";

export async function getAdminLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(ADMIN_LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : defaultLocale;
}

/** The language and its dictionary together, which is what every page needs. */
export async function getAdminContext(): Promise<{
  locale: Locale;
  dict: AdminDictionary;
}> {
  const locale = await getAdminLocale();
  return { locale, dict: getAdminDictionary(locale) };
}
