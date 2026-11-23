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

type Copy = {
  subject: string;
  greeting: (name: string) => string;
  confirmed: (clinic: string, when: string) => string;
  at: (time: string) => string;
  slot: Record<"morning" | "afternoon" | "evening", string>;
  service: (name: string) => string;
  address: (address: string) => string;
  change: (phone: string) => string;
  changeNoPhone: string;
  signOff: string;
};

const COPY: Record<Locale, Copy> = {
  sq: {
    subject: "Takimi juaj është konfirmuar",
    greeting: (name) => `Përshëndetje ${name},`,
    confirmed: (clinic, when) => `Takimi juaj te ${clinic} është konfirmuar: ${when}.`,
    at: (time) => `ora ${time}`,
    slot: { morning: "paradite", afternoon: "pasdite", evening: "në mbrëmje" },
    service: (name) => `Trajtimi: ${name}.`,
    address: (address) => `Adresa: ${address}.`,
    change: (phone) => `Për ta ndryshuar ose anuluar, na telefononi në ${phone}.`,
    changeNoPhone: "Për ta ndryshuar ose anuluar, na shkruani.",
    signOff: "Ju presim!",
  },
  en: {
    subject: "Your appointment is confirmed",
    greeting: (name) => `Hello ${name},`,
    confirmed: (clinic, when) => `Your appointment at ${clinic} is confirmed: ${when}.`,
    at: (time) => `at ${time}`,
    slot: { morning: "in the morning", afternoon: "in the afternoon", evening: "in the evening" },
    service: (name) => `Treatment: ${name}.`,
    address: (address) => `Address: ${address}.`,
    change: (phone) => `To change or cancel it, call us on ${phone}.`,
    changeNoPhone: "To change or cancel it, send us a message.",
    signOff: "We look forward to seeing you.",
  },
  de: {
    subject: "Ihr Termin ist bestätigt",
    greeting: (name) => `Guten Tag ${name},`,
    confirmed: (clinic, when) => `Ihr Termin bei ${clinic} ist bestätigt: ${when}.`,
    at: (time) => `um ${time} Uhr`,
    slot: { morning: "vormittags", afternoon: "nachmittags", evening: "abends" },
    service: (name) => `Behandlung: ${name}.`,
    address: (address) => `Adresse: ${address}.`,
    change: (phone) => `Für Änderungen oder eine Absage rufen Sie uns an: ${phone}.`,
    changeNoPhone: "Für Änderungen oder eine Absage schreiben Sie uns bitte.",
    signOff: "Wir freuen uns auf Ihren Besuch.",
  },
};

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

function when(details: ConfirmationDetails, copy: Copy, locale: Locale): string {
  const date = longDate(details.date, locale);
  if (details.time) return `${date}, ${copy.at(details.time)}`;
  if (details.timeSlot) return `${date}, ${copy.slot[details.timeSlot]}`;
  return date;
}

export type ConfirmationMessage = {
  locale: Locale;
  subject: string;
  /** Full text, for email: greeting, the details, a sign-off. */
  body: string;
  /** The same facts without greeting or sign-off, for SMS and WhatsApp. */
  short: string;
};

export function buildConfirmation(
  details: ConfirmationDetails,
  locale: Locale,
): ConfirmationMessage {
  const copy = COPY[locale];

  const facts = [
    copy.confirmed(details.clinicName, when(details, copy, locale)),
    details.service ? copy.service(details.service) : null,
    details.address ? copy.address(details.address) : null,
    details.phone ? copy.change(details.phone) : copy.changeNoPhone,
  ].filter((line): line is string => line !== null);

  return {
    locale,
    subject: `${copy.subject} — ${details.clinicName}`,
    body: [copy.greeting(details.patientName), "", ...facts, "", copy.signOff, details.clinicName].join(
      "\n",
    ),
    short: facts.join(" "),
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
