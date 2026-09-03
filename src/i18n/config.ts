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

/**
 * Shown in place of the language code. Every flag is paired with the language
 * name for screen readers, since a flag is a country rather than a language.
 */
export const localeFlags: Record<Locale, string> = {
  sq: "🇦🇱",
  en: "🇬🇧",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Builds an href for a page in a given language.
 *
 * The default language is served without a prefix, so Albanian pages read as
 * `/` and `/contact` rather than `/sq/` and `/sq/contact`; other languages keep
 * theirs, e.g. `/en/contact`. `middleware.ts` maps the unprefixed paths back
 * onto the `[locale]` routes and redirects `/sq/...` here, so there is exactly
 * one address per page.
 */
export function path(locale: Locale, href = "/"): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  if (href === "/") return prefix || "/";
  return `${prefix}${href}`;
}

/** Drops a leading locale segment, e.g. `/en/contact` → `/contact`. */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first))
    return `/${rest.join("/")}`.replace(/\/$/, "") || "/";
  return pathname;
}
