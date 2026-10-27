import { serviceSlugs } from "@/content/services";

/**
 * The hours a patient may ask for on the booking form.
 *
 * Deliberately wider than the clinic's published shift, which runs from 14:00:
 * a request is a request, not a booking, and someone who can only come in the
 * morning should be able to say so and let the clinic answer. It is not a
 * claim about when the clinic is open — `clinic.hours` is what the site
 * publishes, and the two are meant to differ.
 *
 * Both ends are checked here and offered by the picker, so changing this one
 * line changes both.
 */
export const BOOKING_HOURS = { opens: "09:00", closes: "20:00" };

export type AppointmentRequest = {
  name: string;
  phone: string;
  email: string;
  /** A service slug, or "other" when the patient is unsure. */
  service: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** 24h `"HH:MM"`, or `""` when the patient has no preferred time. */
  time: string;
  message: string;
  consent: boolean;
};

export type FieldName =
  | "name"
  | "phone"
  | "email"
  | "service"
  | "date"
  | "time"
  | "consent";

/** The keys of `dictionary.appointment.errors` a field can fail with. */
export type ErrorKey =
  | "name"
  | "phone"
  | "email"
  | "service"
  | "date"
  | "datePast"
  | "time"
  | "consent";

export type ValidationErrors = Partial<Record<FieldName, ErrorKey>>;

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

/** A time of day as the picker submits it: 24h `"HH:MM"`. */
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Validates a request and returns the error key per invalid field.
 * The keys match `dictionary.appointment.errors`, so the caller supplies the
 * translated message.
 *
 * `offeredSlugs` is the list of treatments the site is offering right now. It
 * defaults to the ones the site ships with, but both callers pass the live
 * list — the form passes the options it actually rendered and the API route
 * reads them from the database — because a treatment the clinic added in the
 * dashboard has to be bookable, and one it removed must not be.
 */
export function validateAppointment(
  request: AppointmentRequest,
  today = new Date(),
  offeredSlugs: readonly string[] = serviceSlugs,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (request.name.trim().length < 2) errors.name = "name";
  if (!isValidPhone(request.phone)) errors.phone = "phone";
  if (request.email.trim() !== "" && !isValidEmail(request.email)) errors.email = "email";

  /* "other" is always allowed: it is how a patient who does not know what
     they need asks for an appointment. */
  const allowedServices = [...offeredSlugs, "other"];
  if (!allowedServices.includes(request.service)) errors.service = "service";

  if (!request.date) {
    errors.date = "date";
  } else if (!isFutureDate(request.date, today)) {
    errors.date = "datePast";
  }

  /* The time stays a preference rather than a requirement: a patient who does
     not mind when leaves it empty. A time that is filled in has to be a real
     one inside the bookable hours, so a request for 03:00 is caught here
     instead of reaching the clinic as something it cannot honour. */
  if (request.time !== "") {
    const outsideHours =
      request.time < BOOKING_HOURS.opens || request.time > BOOKING_HOURS.closes;
    if (!isValidTime(request.time) || outsideHours) errors.time = "time";
  }

  if (!request.consent) errors.consent = "consent";

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
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
