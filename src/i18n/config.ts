export const locales = ["sq", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sq";

/** `lang` attribute + `hreflang` value for each locale. */
export const htmlLang: Record<Locale, string> = {
  sq: "sq-AL",
  en: "en",
};

export const localeNames: Record<Locale, string> = {
  sq: "Shqip",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Builds a locale-prefixed href, e.g. `path("sq", "/contact") === "/sq/contact"`. */
export function path(locale: Locale, href = "/"): string {
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}
