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
