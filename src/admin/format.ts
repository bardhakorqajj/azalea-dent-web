import type { AdminDictionary } from "@/admin/get-dictionary";
import type { BadgeTone } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import type {
  AppointmentSource,
  AppointmentStatus,
  GalleryKind,
  MessageSource,
  MessageStatus,
  ReviewSource,
  SocialStatus,
  TimeSlotValue,
} from "@/lib/db/types";

/**
 * Turning stored values into what the clinic reads.
 *
 * Statuses live in the database as stable keys (`no_show`, `ready_for_approval`)
 * and are translated here, in one place — so a status added to the schema shows
 * up as a missing translation at the type level rather than as a raw
 * underscore-separated string on a page.
 *
 * Dates are formatted in the clinic's own locale and, crucially, from the
 * `YYYY-MM-DD` strings the repositories return rather than from `Date` objects:
 * a bare date has no time and no zone, and constructing a `Date` from one is
 * what makes an appointment read as the day before.
 */

const LOCALE_TAGS: Record<Locale, string> = { sq: "sq-AL", en: "en-GB" };

// === Dates and times ======================================================

/** `2026-11-04` → `4 nëntor 2026`. */
export function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;

  /* Built in UTC and formatted in UTC, so no zone can shift the day. */
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** `2026-11-04` → `04.11.2026`, for table columns where space is tight. */
export function formatDateShort(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;

  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** A true instant — `created_at` and friends — with the time of day. */
export function formatDateTime(value: Date | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

/** Stored times are already `HH:MM`, which is how the clinic reads them. */
export function formatTime(value: string | null): string {
  return value ?? "";
}

/** Today, as the `YYYY-MM-DD` the date inputs and filters use. */
export function todayIso(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Shifts an ISO date by whole days, staying in UTC so no zone interferes. */
export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/** The first and last day of a month, for the calendar's single query. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

export function formatMonth(year: number, month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

// === Statuses =============================================================

export function appointmentStatusLabel(
  status: AppointmentStatus,
  dict: AdminDictionary,
): string {
  const labels: Record<AppointmentStatus, string> = {
    pending: dict.appointments.statusPending,
    confirmed: dict.appointments.statusConfirmed,
    completed: dict.appointments.statusCompleted,
    cancelled: dict.appointments.statusCancelled,
    no_show: dict.appointments.statusNoShow,
  };
  return labels[status];
}

export function appointmentStatusTone(status: AppointmentStatus): BadgeTone {
  const tones: Record<AppointmentStatus, BadgeTone> = {
    pending: "warning",
    confirmed: "info",
    completed: "positive",
    cancelled: "neutral",
    no_show: "danger",
  };
  return tones[status];
}

export function appointmentSourceLabel(
  source: AppointmentSource,
  dict: AdminDictionary,
): string {
  const labels: Record<AppointmentSource, string> = {
    admin: dict.appointments.sourceAdmin,
    website: dict.appointments.sourceWebsite,
    phone: dict.appointments.sourcePhone,
    walk_in: dict.appointments.sourceWalkIn,
  };
  return labels[source];
}

export function timeSlotLabel(
  slot: TimeSlotValue | null,
  dict: AdminDictionary,
): string {
  if (!slot) return "";
  const labels: Record<TimeSlotValue, string> = {
    morning: dict.appointments.slotMorning,
    afternoon: dict.appointments.slotAfternoon,
    evening: dict.appointments.slotEvening,
  };
  return labels[slot];
}

export function socialStatusLabel(status: SocialStatus, dict: AdminDictionary): string {
  const labels: Record<SocialStatus, string> = {
    draft: dict.social.statusDraft,
    ready_for_approval: dict.social.statusReady,
    approved: dict.social.statusApproved,
    scheduled: dict.social.statusScheduled,
    published: dict.social.statusPublished,
    failed: dict.social.statusFailed,
  };
  return labels[status];
}

export function socialStatusTone(status: SocialStatus): BadgeTone {
  const tones: Record<SocialStatus, BadgeTone> = {
    draft: "neutral",
    ready_for_approval: "warning",
    approved: "info",
    scheduled: "gold",
    published: "positive",
    failed: "danger",
  };
  return tones[status];
}

export function messageStatusLabel(status: MessageStatus, dict: AdminDictionary): string {
  const labels: Record<MessageStatus, string> = {
    new: dict.messages.statusNew,
    in_progress: dict.messages.statusInProgress,
    replied: dict.messages.statusReplied,
    archived: dict.messages.statusArchived,
    spam: dict.messages.statusSpam,
  };
  return labels[status];
}

export function messageStatusTone(status: MessageStatus): BadgeTone {
  const tones: Record<MessageStatus, BadgeTone> = {
    new: "warning",
    in_progress: "info",
    replied: "positive",
    archived: "neutral",
    spam: "danger",
  };
  return tones[status];
}

export function messageSourceLabel(source: MessageSource, dict: AdminDictionary): string {
  const labels: Record<MessageSource, string> = {
    website: dict.messages.sourceWebsite,
    phone: dict.messages.sourcePhone,
    instagram: dict.messages.sourceInstagram,
    facebook: dict.messages.sourceFacebook,
    walk_in: dict.messages.sourceWalkIn,
    other: dict.messages.sourceOther,
  };
  return labels[source];
}

export function reviewSourceLabel(source: ReviewSource, dict: AdminDictionary): string {
  const labels: Record<ReviewSource, string> = {
    manual: dict.reviews.sourceManual,
    google: dict.reviews.sourceGoogle,
    facebook: dict.reviews.sourceFacebook,
    instagram: dict.reviews.sourceInstagram,
    other: dict.reviews.sourceOther,
  };
  return labels[source];
}

export function galleryKindLabel(kind: GalleryKind, dict: AdminDictionary): string {
  const labels: Record<GalleryKind, string> = {
    clinic: dict.gallery.kindClinic,
    work: dict.gallery.kindWork,
    team: dict.gallery.kindTeam,
    other: dict.gallery.kindOther,
  };
  return labels[kind];
}

// === Misc =================================================================

/** `/api/media/<id>` — where an uploaded image is served from. */
export function mediaUrl(id: string): string {
  return `/api/media/${id}`;
}

/** Trims long free text for a table cell without cutting mid-word. */
export function excerpt(value: string, maxLength = 90): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  const cut = collapsed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** `★★★★☆`, with the number for anyone who cannot see the stars. */
export function ratingStars(rating: number | null): string {
  if (rating === null) return "";
  const whole = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(whole) + "☆".repeat(5 - whole);
}
