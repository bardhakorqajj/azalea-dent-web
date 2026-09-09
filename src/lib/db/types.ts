import { defaultLocale, locales, type Locale } from "@/i18n/config";

/**
 * Shared shapes for the rows the dashboard reads and writes.
 *
 * Bilingual text is stored as jsonb and comes back as a plain object, so it
 * lines up with the `Localised` type the public components already take. It is
 * `Partial` here rather than `Record`, because a row can legitimately hold
 * only Albanian while the English is still being written — `text()` below is
 * what decides what to show in that case.
 */
export type LocalisedValue = Partial<Record<Locale, string>>;

export type LocalisedList = LocalisedValue[];

/**
 * The text for one language, falling back to the default language and then to
 * any language that has something, so a half-translated row still renders.
 * Returns "" rather than undefined: this goes straight into JSX.
 */
export function text(value: LocalisedValue | null | undefined, locale: Locale): string {
  if (!value) return "";

  const exact = value[locale];
  if (exact && exact.trim() !== "") return exact;

  const fallback = value[defaultLocale];
  if (fallback && fallback.trim() !== "") return fallback;

  for (const candidate of locales) {
    const other = value[candidate];
    if (other && other.trim() !== "") return other;
  }

  return "";
}

/** Whether a localised field has anything at all in it. */
export function hasText(value: LocalisedValue | null | undefined): boolean {
  if (!value) return false;
  return locales.some((locale) => (value[locale] ?? "").trim() !== "");
}

/** Which languages are still missing, for the "needs translating" hints. */
export function missingLocales(value: LocalisedValue | null | undefined): Locale[] {
  return locales.filter((locale) => (value?.[locale] ?? "").trim() === "");
}

/** Splits stored body copy into paragraphs, the way the public pages render it. */
export function paragraphs(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

// === Statuses =============================================================

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_SOURCES = ["admin", "website", "phone", "walk_in"] as const;
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];

export const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
export type TimeSlotValue = (typeof TIME_SLOTS)[number];

export const SOCIAL_STATUSES = [
  "draft",
  "ready_for_approval",
  "approved",
  "scheduled",
  "published",
  "failed",
] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "other"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const MESSAGE_STATUSES = [
  "new",
  "in_progress",
  "replied",
  "archived",
  "spam",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MESSAGE_SOURCES = [
  "website",
  "phone",
  "instagram",
  "facebook",
  "walk_in",
  "other",
] as const;
export type MessageSource = (typeof MESSAGE_SOURCES)[number];

export const REVIEW_SOURCES = [
  "manual",
  "google",
  "facebook",
  "instagram",
  "other",
] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const GALLERY_KINDS = ["clinic", "work", "team", "other"] as const;
export type GalleryKind = (typeof GALLERY_KINDS)[number];

/** Narrows a value read from a form or a query string to one of a fixed set. */
export function oneOf<T extends string>(
  allowed: readonly T[],
  value: unknown,
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

// === Rows =================================================================

export type MediaRow = {
  id: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  created_at: Date;
};

export type ServiceRow = {
  id: string;
  slug: string;
  title: LocalisedValue;
  summary: LocalisedValue;
  body: LocalisedValue;
  highlights: LocalisedList;
  price_text: LocalisedValue;
  duration_minutes: number | null;
  image_id: string | null;
  seo_title: LocalisedValue;
  seo_description: LocalisedValue;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type TeamMemberRow = {
  id: string;
  name: string;
  slug: string;
  role: LocalisedValue;
  bio: LocalisedValue;
  qualifications: LocalisedList;
  specialties: LocalisedList;
  photo_id: string | null;
  socials: { instagram?: string; facebook?: string; linkedin?: string; tiktok?: string };
  is_active: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type TreatmentRow = {
  id: string;
  slug: string;
  service_id: string | null;
  title: LocalisedValue;
  summary: LocalisedValue;
  body: LocalisedValue;
  price_text: LocalisedValue;
  duration_minutes: number | null;
  image_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type PatientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: Date | null;
  address: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
};

export type AppointmentRow = {
  id: string;
  patient_id: string | null;
  patient_name: string;
  phone: string | null;
  email: string | null;
  service_id: string | null;
  service_label: string | null;
  team_member_id: string | null;
  /** `YYYY-MM-DD`. Read as a string so no timezone can shift the day. */
  scheduled_date: string;
  /** `HH:MM`, or null when only a rough preference is known. */
  scheduled_time: string | null;
  time_slot: TimeSlotValue | null;
  duration_minutes: number | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  internal_notes: string | null;
  locale: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PatientTreatmentRow = {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  appointment_id: string | null;
  label: string;
  performed_on: string;
  cost_text: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type SocialPostRow = {
  id: string;
  platform: SocialPlatform;
  headline: string | null;
  caption: string;
  hashtags: string[];
  media_id: string | null;
  media_suggestion: string | null;
  language: string;
  status: SocialStatus;
  scheduled_for: Date | null;
  approved_at: Date | null;
  published_at: Date | null;
  external_url: string | null;
  failure_reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PromotionRow = {
  id: string;
  slug: string;
  title: LocalisedValue;
  description: LocalisedValue;
  discount_text: LocalisedValue;
  cta_label: LocalisedValue;
  cta_href: string | null;
  image_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type ReviewRow = {
  id: string;
  author_name: string;
  body: LocalisedValue;
  rating: number | null;
  source: ReviewSource;
  external_id: string | null;
  external_url: string | null;
  reviewed_on: string | null;
  imported_at: Date | null;
  is_published: boolean;
  is_featured: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type GalleryCategoryRow = {
  id: string;
  slug: string;
  name: LocalisedValue;
  position: number;
};

export type GalleryImageRow = {
  id: string;
  media_id: string;
  category_id: string | null;
  alt: LocalisedValue;
  caption: LocalisedValue;
  kind: GalleryKind;
  consent_on_file: boolean;
  is_published: boolean;
  is_featured: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type MessageRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  source: MessageSource;
  locale: string | null;
  is_read: boolean;
  status: MessageStatus;
  created_at: Date;
  updated_at: Date;
};

export type FaqItemRow = {
  id: string;
  question: LocalisedValue;
  answer: LocalisedValue;
  is_active: boolean;
  position: number;
};

export type ActivityRow = {
  id: string;
  kind: string;
  entity: string | null;
  entity_id: string | null;
  summary: string;
  meta: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
};

/** One page of rows plus what the pager needs to draw itself. */
export type Page<T> = {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export function emptyPage<T>(perPage = 20): Page<T> {
  return { rows: [], total: 0, page: 1, perPage, pageCount: 1 };
}

/** Builds a page result, clamping the page number to what actually exists. */
export function toPage<T>(
  rows: T[],
  total: number,
  page: number,
  perPage: number,
): Page<T> {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  return { rows, total, page: Math.min(Math.max(1, page), pageCount), perPage, pageCount };
}
