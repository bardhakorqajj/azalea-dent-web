import { clinic, type OpeningHours } from "@/content/clinic";

/**
 * The clinic's settings, and the values the site already ships with.
 *
 * Same principle as the content registry: `src/content/clinic.ts` remains the
 * source of truth for every fact the website states, and a setting is an
 * override on top of it. So the public site keeps working with no database at
 * all, and clearing a field in Settings restores the published value rather
 * than blanking the contact page.
 *
 * Nothing secret is stored here. API keys and the admin password live in
 * environment variables and in `admin_account`; this table holds the address,
 * the phone numbers and the opening hours — things that are on the website
 * anyway.
 */

export type SettingsShape = {
  clinicName: string;
  descriptor: string;
  email: string;
  phones: string[];
  whatsapp: string;
  viber: string;
  addressStreet: string;
  addressLocality: string;
  addressPostalCode: string;
  mapsUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  hours: OpeningHours[];
  logoMediaId: string | null;
  notifyOnAppointment: boolean;
  notifyOnMessage: boolean;
  notifyEmail: string;
};

/** Every setting key, so a stray row can be ignored. */
export const settingKeys = [
  "clinicName",
  "descriptor",
  "email",
  "phones",
  "whatsapp",
  "viber",
  "addressStreet",
  "addressLocality",
  "addressPostalCode",
  "mapsUrl",
  "instagram",
  "facebook",
  "tiktok",
  "hours",
  "logoMediaId",
  "notifyOnAppointment",
  "notifyOnMessage",
  "notifyEmail",
] as const satisfies readonly (keyof SettingsShape)[];

export type SettingKey = (typeof settingKeys)[number];

/**
 * What the website publishes today, read from `clinic.ts`.
 *
 * A function rather than a constant so it is evaluated per request — which
 * matters only in development, where editing `clinic.ts` should be picked up
 * without a restart.
 */
export function defaultSettings(): SettingsShape {
  return {
    clinicName: clinic.name,
    descriptor: clinic.descriptor,
    email: clinic.email ?? "",
    phones: [...clinic.phones],
    whatsapp: clinic.whatsapp ?? "",
    viber: clinic.viber ?? "",
    addressStreet: clinic.address?.street ?? "",
    addressLocality: clinic.address?.locality ?? "",
    addressPostalCode: clinic.address?.postalCode ?? "",
    mapsUrl: clinic.mapsUrl ?? "",
    instagram: clinic.social.instagram.url,
    facebook: clinic.social.facebook ?? "",
    tiktok: clinic.social.tiktok ?? "",
    hours: clinic.hours.map((rule) => ({ ...rule, days: [...rule.days] })),
    logoMediaId: null,
    /* Off by default: switching them on without RESEND_API_KEY configured
       would promise emails that cannot be sent. */
    notifyOnAppointment: false,
    notifyOnMessage: false,
    notifyEmail: clinic.email ?? "",
  };
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAYS)[number];

/**
 * Expands the site's grouped hours ("Mon–Fri 14:00–20:00") into one row per
 * day, which is the shape the settings form edits.
 */
export function hoursByDay(
  rules: OpeningHours[],
): Record<WeekdayKey, { opens: string; closes: string }> {
  const byDay = Object.fromEntries(
    WEEKDAYS.map((day) => [day, { opens: "", closes: "" }]),
  ) as Record<WeekdayKey, { opens: string; closes: string }>;

  for (const rule of rules) {
    for (const day of rule.days) {
      byDay[day] = { opens: rule.opens ?? "", closes: rule.closes ?? "" };
    }
  }

  return byDay;
}

/**
 * Collapses one-row-per-day back into grouped rules, merging consecutive days
 * that share the same times — so the website still reads "Mon–Fri 14:00–20:00"
 * rather than five identical lines.
 */
export function hoursFromDays(
  byDay: Record<WeekdayKey, { opens: string; closes: string }>,
): OpeningHours[] {
  const rules: OpeningHours[] = [];

  for (const day of WEEKDAYS) {
    const entry = byDay[day];
    const opens = entry.opens.trim() === "" ? null : entry.opens.trim();
    const closes = entry.closes.trim() === "" ? null : entry.closes.trim();
    /* A day with only one of the two times is treated as closed: half a range
       is not something the website can state. */
    const normalised =
      opens && closes ? { opens, closes } : { opens: null, closes: null };

    const last = rules[rules.length - 1];
    if (last && last.opens === normalised.opens && last.closes === normalised.closes) {
      last.days.push(day);
    } else {
      rules.push({ days: [day], opens: normalised.opens, closes: normalised.closes });
    }
  }

  return rules;
}
