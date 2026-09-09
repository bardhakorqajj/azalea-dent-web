import { NextResponse } from "next/server";

import { isLocale } from "@/i18n/config";
import { hasMessageErrors, validateMessage, type MessageRequest } from "@/lib/message";
import { throttlePublic } from "@/lib/admin/rate-limit";
import { isDatabaseConfigured } from "@/lib/db/client";
import { logActivity } from "@/lib/db/repos/activity";
import { createMessage } from "@/lib/db/repos/messages";
import { notifyAdmin } from "@/lib/notify";

/**
 * Contact messages from the public website.
 *
 * They go straight into the `message` table, which is the dashboard's inbox —
 * so a question asked at midnight is waiting in the morning rather than
 * sitting in an email account nobody checks.
 *
 * Deliberately different from `/api/appointment`, which delivers a request to
 * the clinic by email and SMS and is answered by a person the same day. A
 * question is stored; a booking request is delivered. With no database
 * configured this route says so plainly rather than accepting a message it
 * cannot keep.
 */

export const runtime = "nodejs";

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    /* Nothing would be stored, so do not pretend otherwise — the form offers
       the clinic's phone numbers instead. */
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ip = clientIp(request);

  /* Five messages an hour from one address. Counted in the database, so it
     holds across the many short-lived instances a serverless host runs. */
  if (await throttlePublic("contact", ip, { max: 5, windowMinutes: 60 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = parsed as Record<string, unknown>;
  const localeInput = clean(body.locale, 5);
  const locale = isLocale(localeInput) ? localeInput : null;

  const message: MessageRequest = {
    name: clean(body.name, 120),
    email: clean(body.email, 160),
    phone: clean(body.phone, 40),
    subject: clean(body.subject, 200),
    body: clean(body.body, 4000),
    consent: body.consent === true,
  };

  /* Re-validated here whatever the browser checked: this route is reachable
     without going through the form. */
  const errors = validateMessage(message);
  if (hasMessageErrors(errors)) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const id = await createMessage({
    name: message.name,
    email: message.email === "" ? null : message.email,
    phone: message.phone === "" ? null : message.phone,
    subject: message.subject === "" ? null : message.subject,
    body: message.body,
    source: "website",
    locale,
    ip,
  });

  await logActivity({
    kind: "message.received",
    summary: `${message.name}: ${message.body.slice(0, 120)}`,
    entity: "message",
    entityId: id,
  });

  /* Best effort, and after the message is safely stored: an email that fails
     to send must not lose the message. */
  await notifyAdmin({
    kind: "message",
    subject: `Mesazh i re nga faqja: ${message.name}`,
    lines: [
      `Emri:     ${message.name}`,
      message.email ? `Email:    ${message.email}` : null,
      message.phone ? `Telefoni: ${message.phone}` : null,
      message.subject ? `Tema:     ${message.subject}` : null,
      "",
      message.body,
    ],
  });

  return NextResponse.json({ ok: true });
}
