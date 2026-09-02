import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/appointment/route";

/**
 * Exercises the real route handler with the outbound calls stubbed, so the
 * delivery path itself is covered rather than just the configuration that
 * feeds it.
 */

const ORIGINAL_ENV = { ...process.env };
let seq = 0;

function makeRequest(overrides: Record<string, unknown> = {}) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  seq += 1;
  return new Request("http://localhost/api/appointment", {
    method: "POST",
    // A distinct address per call, so the rate limiter does not trip.
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${seq}` },
    body: JSON.stringify({
      name: "Arta Berisha",
      phone: "+383 44 123 456",
      service: "kirurgji-orale",
      date: tomorrow,
      time: "morning",
      consent: true,
      locale: "sq",
      ...overrides,
    }),
  });
}

const CREDENTIALS = {
  RESEND_API_KEY: "re_test",
  TWILIO_ACCOUNT_SID: "AC_test",
  TWILIO_AUTH_TOKEN: "tok_test",
  TWILIO_FROM_NUMBER: "+15550100000",
};

beforeEach(() => {
  for (const key of [
    "RESEND_API_KEY",
    "APPOINTMENT_TO_EMAIL",
    "APPOINTMENT_FROM_EMAIL",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
    "APPOINTMENT_SMS_TO",
    "APPOINTMENT_WEBHOOK_URL",
  ]) {
    delete process.env[key];
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("POST /api/appointment", () => {
  it("answers 501 when nothing is configured to receive the request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest());
    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ error: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid request before any delivery is attempted", async () => {
    Object.assign(process.env, CREDENTIALS);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest({ consent: false, phone: "1" }));
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the clinic and texts the clinic phone", async () => {
    Object.assign(process.env, CREDENTIALS);
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response("{}", { status: 200 });
      }),
    );

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, delivered: ["email", "sms"] });

    const email = calls.find((c) => c.url.includes("resend.com"));
    expect(email).toBeDefined();
    const emailBody = JSON.parse(String(email!.init.body));
    expect(emailBody.to).toEqual(["azaleadent@hotmail.com"]);
    expect(emailBody.subject).toContain("Arta Berisha");
    expect(emailBody.text).toContain("+383 44 123 456");
    expect(emailBody.text).toContain("Kirurgji orale");

    const sms = calls.find((c) => c.url.includes("twilio.com"));
    expect(sms).toBeDefined();
    expect(sms!.url).toContain("AC_test");
    const smsBody = new URLSearchParams(String(sms!.init.body));
    expect(smsBody.get("To")).toBe("+38348306376");
    expect(smsBody.get("From")).toBe("+15550100000");
    expect(smsBody.get("Body")).toContain("Arta Berisha");
  });

  it("still succeeds when one channel fails", async () => {
    Object.assign(process.env, CREDENTIALS);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("twilio.com")
          ? new Response("no credit", { status: 402 })
          : new Response("{}", { status: 200 }),
      ),
    );

    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, delivered: ["email"] });
  });

  it("reports failure when every channel fails", async () => {
    Object.assign(process.env, CREDENTIALS);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));

    const response = await POST(makeRequest());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "delivery_failed" });
  });
});
