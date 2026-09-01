import { serviceSlugs } from "@/content/services";

export const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export type AppointmentRequest = {
  name: string;
  phone: string;
  email: string;
  /** A service slug, or "other" when the patient is unsure. */
  service: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  time: TimeSlot | "";
  message: string;
  consent: boolean;
};

export type FieldName = "name" | "phone" | "email" | "service" | "date" | "consent";

export const emptyAppointment: AppointmentRequest = {
  name: "",
  phone: "",
  email: "",
  service: "",
  date: "",
  time: "",
  message: "",
  consent: false,
};

/** Accepts international and local formats; requires 6–15 digits. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15 && /^[\d\s+()./-]+$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** `today` is injectable so the rule is testable and timezone-stable. */
export function isFutureDate(value: string, today = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const midnight = new Date(today);
  midnight.setHours(0, 0, 0, 0);
  return parsed.getTime() >= midnight.getTime();
}

/**
 * Validates a request and returns the error key per invalid field.
 * The keys match `dictionary.appointment.errors`, so the caller supplies the
 * translated message.
 */
export function validateAppointment(
  request: AppointmentRequest,
  today = new Date(),
): Partial<Record<FieldName, "name" | "phone" | "email" | "service" | "date" | "datePast" | "consent">> {
  const errors: ReturnType<typeof validateAppointment> = {};

  if (request.name.trim().length < 2) errors.name = "name";
  if (!isValidPhone(request.phone)) errors.phone = "phone";
  if (request.email.trim() !== "" && !isValidEmail(request.email)) errors.email = "email";

  const allowedServices = [...serviceSlugs, "other"];
  if (!allowedServices.includes(request.service)) errors.service = "service";

  if (!request.date) {
    errors.date = "date";
  } else if (!isFutureDate(request.date, today)) {
    errors.date = "datePast";
  }

  if (!request.consent) errors.consent = "consent";

  return errors;
}

export function hasErrors(errors: ReturnType<typeof validateAppointment>): boolean {
  return Object.keys(errors).length > 0;
}

/** Plain-text summary used for the notification email and the WhatsApp fallback. */
export function formatRequest(
  request: AppointmentRequest,
  labels: {
    name: string;
    phone: string;
    email: string;
    service: string;
    date: string;
    time: string;
    message: string;
  },
): string {
  const lines = [
    `${labels.name}: ${request.name}`,
    `${labels.phone}: ${request.phone}`,
    request.email ? `${labels.email}: ${request.email}` : null,
    `${labels.service}: ${request.service}`,
    `${labels.date}: ${request.date}`,
    request.time ? `${labels.time}: ${request.time}` : null,
    request.message ? `${labels.message}: ${request.message}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
