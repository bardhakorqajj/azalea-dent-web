import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { resolveEmailChannel, type DeliveryEnv } from "@/lib/delivery";

/**
 * The message a patient receives when the clinic confirms their appointment.
 *
 * Confirmations only — there are deliberately no reminders. The message goes
 * out when someone at the clinic presses "Confirm" (or "Send again"), never on
 * a timer, so nothing reaches a patient that a person did not decide to send.
 *
 * It is written in the language the patient booked in: the website records
 * the page's language on every request, and an appointment typed into the
 * dashboard falls back to Albanian.
 *
 * Two channels can send on their own, both configured by the same environment
 * variables as the appointment requests: email through Resend and SMS through
 * Twilio. WhatsApp cannot be sent from a server without a WhatsApp Business
 * account, so for it the dashboard offers a link that opens WhatsApp with the
 * same text already typed, and a person presses send.
 */

// === The text =============================================================

export type ConfirmationDetails = {
  patientName: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM`, or null when only a part of the day is known. */
  time: string | null;
  timeSlot: "morning" | "afternoon" | "evening" | null;
  /** The treatment, already in the patient's language, if one was chosen. */
  service: string | null;
  clinicName: string;
  address: string | null;
  phone: string | null;
};

const DATE_TAGS: Record<Locale, string> = { sq: "sq-AL", en: "en-GB", de: "de-DE" };

/** How the time of day is written in each language. */
const TIME_WORDS: Record<
  Locale,
  { at: (time: string) => string; slot: Record<"morning" | "afternoon" | "evening", string> }
> = {
  sq: {
    at: (time) => `ora ${time}`,
    slot: { morning: "paradite", afternoon: "pasdite", evening: "në mbrëmje" },
  },
  en: {
    at: (time) => `at ${time}`,
    slot: { morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening" },
  },
  de: {
    at: (time) => `um ${time} Uhr`,
    slot: { morning: "vormittags", afternoon: "nachmittags", evening: "abends" },
  },
};

// === Templates ============================================================

/**
 * The words the clinic can use in its own message, each replaced by the
 * appointment's detail when the message is sent.
 */
export const PLACEHOLDERS = [
  "patient",
  "when",
  "date",
  "time",
  "service",
  "clinic",
  "address",
  "phone",
] as const;

export type Placeholder = (typeof PLACEHOLDERS)[number];

export type ConfirmationTemplate = { subject: string; body: string };

/**
 * The message as it ships, and what an emptied field in Settings goes back to.
 *
 * Each detail sits on a line of its own on purpose: a line whose placeholder
 * has nothing to fill it (no treatment chosen, say) is left out whole, so the
 * patient never reads "Treatment: ." with nothing after it.
 */
export const DEFAULT_TEMPLATES: Record<Locale, ConfirmationTemplate> = {
  sq: {
    subject: "Takimi juaj është konfirmuar — {clinic}",
    body: [
      "Përshëndetje {patient},",
      "",
      "Takimi juaj te {clinic} është konfirmuar: {when}.",
      "Trajtimi: {service}.",
      "Adresa: {address}.",
      "Për ta ndryshuar ose anuluar, na telefononi në {phone}.",
      "",
      "Ju presim!",
      "{clinic}",
    ].join("\n"),
  },
  en: {
    subject: "Your appointment is confirmed — {clinic}",
    body: [
      "Hello {patient},",
      "",
      "Your appointment at {clinic} is confirmed: {when}.",
      "Treatment: {service}.",
      "Address: {address}.",
      "To change or cancel it, call us on {phone}.",
      "",
      "We look forward to seeing you.",
      "{clinic}",
    ].join("\n"),
  },
  de: {
    subject: "Ihr Termin ist bestätigt — {clinic}",
    body: [
      "Guten Tag {patient},",
      "",
      "Ihr Termin bei {clinic} ist bestätigt: {when}.",
      "Behandlung: {service}.",
      "Adresse: {address}.",
      "Für Änderungen oder eine Absage rufen Sie uns an: {phone}.",
      "",
      "Wir freuen uns auf Ihren Besuch.",
      "{clinic}",
    ].join("\n"),
  },
};

const PLACEHOLDER_PATTERN = /\{([^{}\s]*)\}/g;

/**
 * Placeholders in a template that are not ones the message can fill, such as
 * a typo like "{patinet}". Settings refuses to save these: otherwise the
 * patient would receive the braces exactly as typed.
 */
export function unknownPlaceholders(template: string): string[] {
  const unknown = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1] ?? "";
    if (!(PLACEHOLDERS as readonly string[]).includes(name)) unknown.add(`{${name}}`);
  }
  return [...unknown];
}

/**
 * Fills a template. A line that names a placeholder with no value is dropped
 * entirely rather than sent half empty, and the blank lines that leaves
 * behind are tidied up.
 */
export function renderTemplate(
  template: string,
  values: Partial<Record<Placeholder, string | null>>,
): string {
  const lines: string[] = [];

  for (const line of template.replace(/\r\n?/g, "\n").split("\n")) {
    let missing = false;
    const filled = line.replace(PLACEHOLDER_PATTERN, (whole, name: string) => {
      if (!(PLACEHOLDERS as readonly string[]).includes(name)) return whole;
      const value = values[name as Placeholder]?.trim() ?? "";
      if (value === "") missing = true;
      return value;
    });
    if (!missing) lines.push(filled.trimEnd());
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// === The message ==========================================================

/** The language to write in: the one recorded on the request, or Albanian. */
export function confirmationLocale(recorded: string | null | undefined): Locale {
  return recorded && isLocale(recorded) ? recorded : defaultLocale;
}

/** `2026-12-04` → "e premte, 4 dhjetor 2026", from the bare date, in UTC. */
function longDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat(DATE_TAGS[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** The values each placeholder stands for, for one appointment. */
export function placeholderValues(
  details: ConfirmationDetails,
  locale: Locale,
): Record<Placeholder, string | null> {
  const words = TIME_WORDS[locale];
  const date = longDate(details.date, locale);
  const time = details.time ?? (details.timeSlot ? words.slot[details.timeSlot] : null);
  const when = details.time
    ? `${date}, ${words.at(details.time)}`
    : details.timeSlot
      ? `${date}, ${words.slot[details.timeSlot]}`
      : date;

  return {
    patient: details.patientName,
    when,
    date,
    time,
    service: details.service,
    clinic: details.clinicName,
    address: details.address,
    phone: details.phone,
  };
}

export type ConfirmationMessage = {
  locale: Locale;
  subject: string;
  /** The message: the email's text, and what SMS and WhatsApp carry too. */
  body: string;
  /** The same text with blank lines removed, which reads better as an SMS. */
  short: string;
};

/**
 * The confirmation for one appointment. `custom` is the clinic's own wording
 * from Settings; a field it leaves empty uses the default.
 */
export function buildConfirmation(
  details: ConfirmationDetails,
  locale: Locale,
  custom: Partial<ConfirmationTemplate> = {},
): ConfirmationMessage {
  const template = DEFAULT_TEMPLATES[locale];
  const values = placeholderValues(details, locale);

  const body = renderTemplate(custom.body?.trim() || template.body, values);
  const subject =
    renderTemplate(custom.subject?.trim() || template.subject, values).replace(/\s*\n\s*/g, " ") ||
    renderTemplate(template.subject, values);

  return {
    locale,
    subject,
    body,
    short: body.replace(/\n{2,}/g, "\n"),
  };
}

// === The patient's number =================================================

/**
 * A patient's number in international form, or null when it cannot be known.
 *
 * Patients in Kosovo write their number the local way, "044 123 456", which
 * an SMS provider and WhatsApp both reject: they need "+38344123456". A
 * leading 0 is therefore read as a Kosovo number. "00" is the international
 * prefix written out. A number with neither a "+", "00", "0" nor 383 in front
 * is ambiguous, and is refused rather than guessed: a message sent to the
 * wrong country reaches a stranger.
 */
export function patientE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^[\d\s+()./-]+$/.test(trimmed)) return null;

  const digits = trimmed.replace(/\D/g, "");
  let international: string;

  if (trimmed.startsWith("+")) international = digits;
  else if (digits.startsWith("00")) international = digits.slice(2);
  else if (digits.startsWith("383")) international = digits;
  else if (digits.startsWith("0")) international = `383${digits.slice(1)}`;
  else return null;

  /* E.164 allows at most 15 digits; anything under 8 is not a phone number. */
  if (international.length < 8 || international.length > 15) return null;
  return `+${international}`;
}

/** wa.me link that opens WhatsApp on the patient's chat with the text typed. */
export function whatsappConfirmationHref(phone: string | null, text: string): string | null {
  const number = patientE164(phone);
  if (!number) return null;
  return `https://wa.me/${number.slice(1)}?text=${encodeURIComponent(text)}`;
}

// === Sending ==============================================================

export type AutoChannel = "email" | "sms";

/** What can send by itself, given the environment and the patient's details. */
export function availableChannels(
  env: DeliveryEnv,
  contact: { email: string | null; phone: string | null },
): { email: boolean; sms: boolean; emailConfigured: boolean; smsConfigured: boolean } {
  const emailConfigured = Boolean(env.RESEND_API_KEY?.trim());
  const smsConfigured = Boolean(
    env.TWILIO_ACCOUNT_SID?.trim() && env.TWILIO_AUTH_TOKEN?.trim() && env.TWILIO_FROM_NUMBER?.trim(),
  );

  return {
    emailConfigured,
    smsConfigured,
    email: emailConfigured && Boolean(contact.email?.trim()),
    sms: smsConfigured && patientE164(contact.phone) !== null,
  };
}

export type SendResult = { channel: AutoChannel; ok: boolean; error?: string };

/**
 * Sends the confirmation on every channel that can reach the patient, and
 * reports each one separately: an email that went out is not undone by an SMS
 * that failed, and the clinic should know which of the two the patient got.
 *
 * `fetchImpl` is there for the tests; nothing else passes it.
 */
export async function sendConfirmation(
  message: ConfirmationMessage,
  contact: { email: string | null; phone: string | null },
  options: { env?: DeliveryEnv; replyTo?: string | null; fetchImpl?: typeof fetch } = {},
): Promise<SendResult[]> {
  const env = options.env ?? process.env;
  const doFetch = options.fetchImpl ?? fetch;
  const available = availableChannels(env, contact);
  const jobs: Promise<SendResult>[] = [];

  if (available.email) {
    jobs.push(
      (async (): Promise<SendResult> => {
        const channel = resolveEmailChannel(env);
        if (!channel) return { channel: "email", ok: false, error: "not configured" };
        const response = await doFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: channel.from,
            to: [contact.email!.trim()],
            subject: message.subject,
            text: message.body,
            /* A patient who answers the email reaches the clinic, not the
               sending service's no-reply address. */
            ...(options.replyTo?.trim() ? { reply_to: options.replyTo.trim() } : {}),
          }),
        });
        return response.ok
          ? { channel: "email", ok: true }
          : { channel: "email", ok: false, error: `resend ${response.status}` };
      })().catch((error: unknown) => ({ channel: "email", ok: false, error: String(error) })),
    );
  }

  if (available.sms) {
    jobs.push(
      (async (): Promise<SendResult> => {
        const accountSid = env.TWILIO_ACCOUNT_SID!.trim();
        const authToken = env.TWILIO_AUTH_TOKEN!.trim();
        const from = env.TWILIO_FROM_NUMBER!.trim().replace(/[^\d+]/g, "");
        const response = await doFetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: patientE164(contact.phone)!,
              From: from.startsWith("+") ? from : `+${from}`,
              Body: message.short,
            }),
          },
        );
        return response.ok
          ? { channel: "sms", ok: true }
          : { channel: "sms", ok: false, error: `twilio ${response.status}` };
      })().catch((error: unknown) => ({ channel: "sms", ok: false, error: String(error) })),
    );
  }

  return Promise.all(jobs);
}

/**
 * The message with its text replaced by what someone typed on the appointment
 * page. The subject still comes from the template. Empty means "unchanged".
 */
export function withEditedText(message: ConfirmationMessage, text: string): ConfirmationMessage {
  const body = text.replace(/\r\n?/g, "\n").trim();
  if (body === "") return message;
  return { ...message, body, short: body.replace(/\n{2,}/g, "\n") };
}
