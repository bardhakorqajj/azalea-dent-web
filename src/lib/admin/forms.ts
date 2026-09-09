import type { AdminDictionary } from "@/admin/get-dictionary";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import type { LocalisedList, LocalisedValue } from "@/lib/db/types";

/**
 * Reading and validating admin form data.
 *
 * Every field an admin submits passes through here on the server, whatever the
 * browser already checked. The client-side `required` and `type="email"`
 * attributes are there to help someone filling the form in; they are not a
 * gate, because a server action can be POSTed to directly.
 */

/** What a server action hands back to `useActionState`. */
export type ActionState = {
  status: "idle" | "success" | "error";
  /** Already translated — actions have the dictionary, forms do not. */
  message?: string;
  /** Keyed by field name, so each input can show its own error. */
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = { status: "idle" };

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

export function successState(message: string): ActionState {
  return { status: "success", message };
}

// === Readers ==============================================================

/** A trimmed string, capped so a huge paste cannot fill a column. */
export function str(data: FormData, name: string, maxLength = 500): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** Multi-line text, kept as typed apart from trailing whitespace. */
export function textBlock(data: FormData, name: string, maxLength = 20_000): string {
  const value = data.get(name);
  if (typeof value !== "string") return "";
  /* Normalise line endings so a Windows paste does not store \r\n and then
     fail to match on a later comparison. */
  return value.replace(/\r\n/g, "\n").trimEnd().slice(0, maxLength);
}

export function optionalStr(
  data: FormData,
  name: string,
  maxLength = 500,
): string | null {
  const value = str(data, name, maxLength);
  return value === "" ? null : value;
}

/** An HTML checkbox sends nothing at all when unticked. */
export function bool(data: FormData, name: string): boolean {
  const value = data.get(name);
  return value === "on" || value === "true" || value === "1";
}

export function int(data: FormData, name: string): number | null {
  const value = str(data, name, 20);
  if (value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A positive integer, or null — for durations and positions. */
export function positiveInt(data: FormData, name: string): number | null {
  const parsed = int(data, name);
  return parsed !== null && parsed > 0 ? parsed : null;
}

/** A `YYYY-MM-DD` value from a date input, validated as a real calendar date. */
export function dateStr(data: FormData, name: string): string | null {
  const value = str(data, name, 10);
  return isValidDateString(value) ? value : null;
}

/** `HH:MM` from a time input. */
export function timeStr(data: FormData, name: string): string | null {
  const value = str(data, name, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

/**
 * Reads one localised field, submitted as `name.sq` and `name.en`.
 *
 * Languages with nothing in them are left out rather than stored as "", so
 * `text()` can fall back to a language that does have copy.
 */
export function localised(
  data: FormData,
  name: string,
  maxLength = 20_000,
): LocalisedValue {
  const value: LocalisedValue = {};
  for (const locale of locales) {
    const raw = textBlock(data, `${name}.${locale}`, maxLength);
    if (raw !== "") value[locale] = raw;
  }
  return value;
}

/**
 * Reads a localised list submitted as one item per line in each language.
 *
 * The lines are zipped by position, which is what makes an Albanian list and
 * its English translation line up. A language with fewer lines simply leaves
 * those entries untranslated rather than shifting the rest.
 */
export function localisedList(
  data: FormData,
  name: string,
  maxItems = 30,
): LocalisedList {
  const byLocale = new Map<Locale, string[]>();
  let longest = 0;

  for (const locale of locales) {
    const lines = textBlock(data, `${name}.${locale}`)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    byLocale.set(locale, lines);
    longest = Math.max(longest, lines.length);
  }

  const items: LocalisedList = [];
  for (let index = 0; index < Math.min(longest, maxItems); index += 1) {
    const item: LocalisedValue = {};
    for (const locale of locales) {
      const line = byLocale.get(locale)?.[index];
      if (line) item[locale] = line;
    }
    if (Object.keys(item).length > 0) items.push(item);
  }

  return items;
}

/** Turns a stored localised list back into one textarea value per language. */
export function listToLines(items: LocalisedList, locale: Locale): string {
  return items.map((item) => item[locale] ?? "").join("\n");
}

/** Splits a lines-per-item textarea into a plain string list. */
export function lines(data: FormData, name: string, maxItems = 30): string[] {
  return textBlock(data, name)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .slice(0, maxItems);
}

// === Validators ===========================================================

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  /* Catches 2026-02-31, which `new Date` would roll forward into March. */
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15 && /^[\d\s+()./-]+$/.test(value.trim());
}

/**
 * A link the dashboard is willing to store.
 *
 * Absolute links have to be http(s) — a `javascript:` URL saved into a
 * promotion's button would run in every visitor's browser. Site-relative
 * paths are allowed because that is what most buttons point at.
 */
export function isValidHref(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Lowercase letters, digits and single dashes. */
export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

/**
 * Builds a slug from a title, so the admin does not have to.
 *
 * Albanian's ë and ç are transliterated rather than dropped, which is what
 * keeps "Stomatologji e përgjithshme" readable as
 * "stomatologji-e-pergjithshme".
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    /* Strips the accents any other Latin letter might carry. */
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// === Field-error helpers ==================================================

/**
 * Collects field errors while reading a form, so an action reads as a list of
 * rules rather than a chain of ifs.
 */
export class Errors {
  private readonly errors: Record<string, string> = {};

  add(field: string, message: string): void {
    /* First error per field wins: it is the most specific one checked. */
    if (!(field in this.errors)) this.errors[field] = message;
  }

  require(field: string, value: string, dict: AdminDictionary): void {
    if (value.trim() === "") this.add(field, dict.errors.required);
  }

  requireLocalised(field: string, value: LocalisedValue, dict: AdminDictionary): void {
    const hasAny = locales.some((locale) => (value[locale] ?? "").trim() !== "");
    /* Only the default language is genuinely required — a service may
       legitimately be waiting for its English translation. */
    if (!hasAny) this.add(`${field}.sq`, dict.errors.required);
  }

  get any(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  get all(): Record<string, string> {
    return this.errors;
  }
}
