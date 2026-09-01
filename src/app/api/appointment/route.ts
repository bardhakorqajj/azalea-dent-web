import { NextResponse } from "next/server";

import { getService } from "@/content/services";
import { isLocale, defaultLocale } from "@/i18n/config";
import {
  validateAppointment,
  hasErrors,
  type AppointmentRequest,
} from "@/lib/appointment";

/**
 * Appointment requests.
 *
 * Delivery is configured entirely through environment variables:
 *
 *   RESEND_API_KEY + APPOINTMENT_TO_EMAIL  → sends an email via Resend
 *   APPOINTMENT_WEBHOOK_URL                → POSTs the request as JSON
 *
 * With neither configured the route answers 501 and the form tells the patient
 * plainly that nothing was sent, offering WhatsApp and Instagram instead. It
 * never reports success for a request that went nowhere.
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

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const localeInput = clean(body.locale, 5);
  const locale = isLocale(localeInput) ? localeInput : defaultLocale;

  const appointment: AppointmentRequest = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    service: clean(body.service, 60),
    date: clean(body.date, 10),
    time: (["morning", "afternoon", "evening"] as const).find(
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
    `Name:    ${appointment.name}`,
    `Phone:   ${appointment.phone}`,
    appointment.email ? `Email:   ${appointment.email}` : null,
    `Service: ${serviceLabel}`,
    `Date:    ${appointment.date}`,
    appointment.time ? `Time:    ${appointment.time}` : null,
    appointment.message ? `\nMessage:\n${appointment.message}` : null,
    `\nSubmitted from the ${locale.toUpperCase()} site at ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const webhookUrl = process.env.APPOINTMENT_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.APPOINTMENT_TO_EMAIL;

  try {
    if (resendKey && toEmail) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.APPOINTMENT_FROM_EMAIL ??
            "Azalea Dent <onboarding@resend.dev>",
          to: [toEmail],
          subject: `Appointment request: ${appointment.name} (${serviceLabel})`,
          text: summary,
          ...(appointment.email ? { reply_to: appointment.email } : {}),
        }),
      });

      if (!response.ok) {
        console.error("Resend rejected the request:", await response.text());
        return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
      }

      return NextResponse.json({ ok: true });
    }

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...appointment, serviceLabel, locale }),
      });

      if (!response.ok) {
        console.error("Appointment webhook failed:", response.status);
        return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
      }

      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error("Appointment delivery error:", error);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  // Nothing is configured to receive the request — say so rather than pretend.
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}
