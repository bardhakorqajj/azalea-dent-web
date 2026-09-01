import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { sq, type Dictionary } from "./dictionaries/sq";

const dictionaries: Record<Locale, Dictionary> = { sq, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
