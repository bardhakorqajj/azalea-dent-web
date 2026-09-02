import { NextResponse } from "next/server";

import { getService } from "@/content/services";
import { isLocale, defaultLocale } from "@/i18n/config";
import { resolveChannels, type Channel } from "@/lib/delivery";
import {
  validateAppointment,
  hasErrors,
  type AppointmentRequest,
} from "@/lib/appointment";

/**
 * Appointment requests.
 *
 * Delivery is configured entirely through environment variables, and every
 * configured channel is used, so a request can reach both the clinic inbox and
 * the clinic phone at once:
 *
 *   RESEND_API_KEY                     → emails the request (to the clinic
 *                                        address unless APPOINTMENT_TO_EMAIL
 *                                        overrides it)
 *   TWILIO_ACCOUNT_SID + AUTH_TOKEN
 *     + TWILIO_FROM_NUMBER             → texts the request (to the clinic
 *                                        number unless APPOINTMENT_SMS_TO
 *                                        overrides it)
 *   APPOINTMENT_WEBHOOK_URL            → POSTs the request as JSON
 *
 * With none configured the route answers 501 and the form tells the patient
 * plainly that nothing was sent, offering WhatsApp, Viber and Instagram
 * instead. It never reports success for a request that went nowhere.
 */

export const runtime = "nodejs";

/** Best-effort throttle. Serverless instances are short-lived, so this trims
 *  obvious floods rather than acting as a hard guarantee. */
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return false;
  }

  entry.count += 1;
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  return entry.count > RATE_LIMIT.max;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

type Payload = {
  appointment: AppointmentRequest;
  serviceLabel: string;
  locale: string;
  /** Full text for the email body. */
  summary: string;
  /** Compact text for a single SMS segment where possible. */
  sms: string;
};

async function deliver(channel: Channel, payload: Payload): Promise<void> {
  if (channel.kind === "email") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: channel.from,
        to: [channel.to],
        subject: `Kërkesë për takim: ${payload.appointment.name} (${payload.serviceLabel})`,
        text: payload.summary,
        ...(payload.appointment.email
          ? { reply_to: payload.appointment.email }
          : {}),
      }),
    });
    if (!response.ok) throw new Error(`resend ${response.status}: ${await response.text()}`);
    return;
  }

  if (channel.kind === "sms") {
    const body = new URLSearchParams({
      To: channel.to,
      From: channel.from,
      Body: payload.sms,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${channel.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${channel.accountSid}:${channel.authToken}`,
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!response.ok) throw new Error(`twilio ${response.status}: ${await response.text()}`);
    return;
  }

  const response = await fetch(channel.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload.appointment,
      serviceLabel: payload.serviceLabel,
      locale: payload.locale,
    }),
  });
  if (!response.ok) throw new Error(`webhook ${response.status}`);
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = parsed as Record<string, unknown>;
  const localeInput = clean(body.locale, 5);
  const locale = isLocale(localeInput) ? localeInput : defaultLocale;

  const appointment: AppointmentRequest = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    service: clean(body.service, 60),
    date: clean(body.date, 10),
    time:
      (["morning", "afternoon", "evening"] as const).find(
        (slot) => slot === body.time,
      ) ?? "",
    message: clean(body.message, 2000),
    consent: body.consent === true,
  };

  // Re-validate on the server: the client check is a convenience, not a gate.
  const errors = validateAppointment(appointment);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const service = getService(appointment.service);
  const serviceLabel = service ? service.title[locale] : appointment.service;

  const summary = [
    `Emri:     ${appointment.name}`,
    `Telefoni: ${appointment.phone}`,
    appointment.email ? `Email:    ${appointment.email}` : null,
    `Trajtimi: ${serviceLabel}`,
    `Data:     ${appointment.date}`,
    appointment.time ? `Ora:      ${appointment.time}` : null,
    appointment.message ? `\nMesazhi:\n${appointment.message}` : null,
    `\nDërguar nga faqja (${locale.toUpperCase()}) më ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const sms = [
    `Azalea Dent - kerkese e re`,
    `${appointment.name}, ${appointment.phone}`,
    `${serviceLabel}, ${appointment.date}${appointment.time ? ` (${appointment.time})` : ""}`,
  ].join("\n");

  const channels = resolveChannels(process.env);

  // Nothing is configured to receive the request: say so rather than pretend.
  if (channels.length === 0) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const payload: Payload = { appointment, serviceLabel, locale, summary, sms };

  // Every configured channel is tried, so a failing SMS provider cannot stop
  // the email from arriving.
  const results = await Promise.allSettled(
    channels.map((channel) => deliver(channel, payload)),
  );

  const delivered = channels.filter((_, i) => results[i]?.status === "fulfilled");
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Appointment delivery failed via ${channels[i]?.kind}:`, result.reason);
    }
  });

  if (delivered.length === 0) {
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    delivered: delivered.map((channel) => channel.kind),
  });
}
