import type { Locale } from "./config";
import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { sq, type Dictionary } from "./dictionaries/sq";

const dictionaries: Record<Locale, Dictionary> = { sq, en, de };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
