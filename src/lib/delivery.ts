import { clinic, primaryPhone } from "@/content/clinic";

/**
 * Works out where an appointment request should be delivered, from the
 * environment. Kept separate from the route handler so the wiring can be unit
 * tested: a misconfigured variable is the likeliest way for requests to go
 * quietly missing.
 *
 * Recipients default to the clinic's own published email and phone number, so
 * only the provider credentials have to be set.
 */

export type DeliveryEnv = Record<string, string | undefined>;

export type EmailChannel = {
  kind: "email";
  apiKey: string;
  to: string;
  from: string;
};

export type SmsChannel = {
  kind: "sms";
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
};

export type WebhookChannel = {
  kind: "webhook";
  url: string;
};

export type Channel = EmailChannel | SmsChannel | WebhookChannel;

/** Strips spaces and punctuation so a number is valid E.164 for an SMS API. */
export function toE164(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * The email channel on its own, or null when no provider is configured.
 *
 * Extracted so the dashboard's notification emails use exactly the same
 * provider, sender and default recipient as an appointment request, rather
 * than a second copy of the same three environment variables that could drift.
 */
export function resolveEmailChannel(env: DeliveryEnv): EmailChannel | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.APPOINTMENT_TO_EMAIL?.trim() || clinic.email || "";
  if (!apiKey || !to) return null;

  return {
    kind: "email",
    apiKey,
    to,
    from:
      env.APPOINTMENT_FROM_EMAIL?.trim() || "Azalea Dent <onboarding@resend.dev>",
  };
}

export function resolveChannels(env: DeliveryEnv): Channel[] {
  const channels: Channel[] = [];

  const email = resolveEmailChannel(env);
  if (email) channels.push(email);

  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const smsFrom = env.TWILIO_FROM_NUMBER?.trim();
  const smsToRaw = env.APPOINTMENT_SMS_TO?.trim() || primaryPhone() || "";
  if (accountSid && authToken && smsFrom && smsToRaw) {
    channels.push({
      kind: "sms",
      accountSid,
      authToken,
      from: toE164(smsFrom),
      to: toE164(smsToRaw),
    });
  }

  const url = env.APPOINTMENT_WEBHOOK_URL?.trim();
  if (url) channels.push({ kind: "webhook", url });

  return channels;
}
