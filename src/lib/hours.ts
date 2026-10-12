import { clinic, type OpeningHours, type Weekday } from "@/content/clinic";
import type { Locale } from "@/i18n/config";

const WEEKDAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const WEEKDAY_LABELS: Record<Locale, Record<Weekday, string>> = {
  sq: {
    mon: "E hënë",
    tue: "E martë",
    wed: "E mërkurë",
    thu: "E enjte",
    fri: "E premte",
    sat: "E shtunë",
    sun: "E diel",
  },
  en: {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  },
};

/** Schema.org day names, used for `openingHoursSpecification`. */
const SCHEMA_DAYS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** "E hënë – E premte" for a run of days, or a single day name. */
export function formatDayRange(days: Weekday[], locale: Locale): string {
  const labels = WEEKDAY_LABELS[locale];
  const sorted = [...days].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return "";
  if (sorted.length === 1) return labels[first];

  const isContiguous = sorted.every(
    (day, index) => WEEKDAY_ORDER.indexOf(day) === WEEKDAY_ORDER.indexOf(first) + index,
  );
  if (isContiguous) return `${labels[first]} – ${labels[last]}`;
  return sorted.map((day) => labels[day]).join(", ");
}

export function formatHours(rule: OpeningHours, closedLabel: string): string {
  if (!rule.opens || !rule.closes) return closedLabel;
  return `${rule.opens} – ${rule.closes}`;
}

export function hasHours(): boolean {
  return clinic.hours.length > 0;
}

/** Schema.org `OpeningHoursSpecification[]`, or undefined when unknown. */
export function openingHoursSchema() {
  if (clinic.hours.length === 0) return undefined;
  return clinic.hours
    .filter((rule) => rule.opens && rule.closes)
    .map((rule) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: rule.days.map((day) => SCHEMA_DAYS[day]),
      opens: rule.opens as string,
      closes: rule.closes as string,
    }));
}

/** JS `getDay()` is Sunday-first; the rules name their days. */
const WEEKDAY_BY_INDEX: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function weekdayOf(date: string | undefined): Weekday | undefined {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return WEEKDAY_BY_INDEX[parsed.getDay()];
}

/**
 * The hours a requested time should fall inside, as 24h `"HH:MM"` bounds.
 *
 * For a date the clinic has a rule for, that day's own hours. For a day it is
 * closed — or before a date has been chosen — the widest window it publishes,
 * so the time picker still has sensible bounds without quietly refusing a
 * Saturday the clinic may well choose to accept.
 *
 * `null` when no hours are published at all, which means "no bound known"
 * rather than "closed": any valid time is then accepted.
 */
export function bookingWindow(
  rules: readonly OpeningHours[],
  date?: string,
): { opens: string; closes: string } | null {
  const open = rules.filter(
    (rule): rule is OpeningHours & { opens: string; closes: string } =>
      Boolean(rule.opens && rule.closes),
  );

  const weekday = weekdayOf(date);
  const forDay = weekday
    ? open.find((rule) => rule.days.includes(weekday))
    : undefined;
  if (forDay) return { opens: forDay.opens, closes: forDay.closes };

  /* Zero-padded "HH:MM" sorts chronologically, so the earliest opening and the
     latest closing are the ends of the sorted lists. */
  const opens = [...open.map((rule) => rule.opens)].sort()[0];
  const closes = [...open.map((rule) => rule.closes)].sort().pop();
  if (!opens || !closes) return null;
  return { opens, closes };
}
