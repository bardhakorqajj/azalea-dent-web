import { describe, expect, it } from "vitest";

import { resolveChannels, toE164 } from "@/lib/delivery";

describe("toE164", () => {
  it("strips spacing and keeps the country code", () => {
    expect(toE164("+383 48 306 376")).toBe("+38348306376");
    expect(toE164("38348306376")).toBe("+38348306376");
    expect(toE164("+1 (555) 010-0000")).toBe("+15550100000");
  });
});

describe("resolveChannels", () => {
  it("configures nothing when no credentials are set", () => {
    expect(resolveChannels({})).toEqual([]);
  });

  it("defaults the email recipient to the clinic address", () => {
    const [channel] = resolveChannels({ RESEND_API_KEY: "re_test" });
    expect(channel).toMatchObject({
      kind: "email",
      to: "azaleadent@hotmail.com",
      from: "Azalea Dent <onboarding@resend.dev>",
    });
  });

  it("lets the recipient and sender be overridden", () => {
    const [channel] = resolveChannels({
      RESEND_API_KEY: "re_test",
      APPOINTMENT_TO_EMAIL: "someone@example.com",
      APPOINTMENT_FROM_EMAIL: "Clinic <takime@azaleadent.com>",
    });
    expect(channel).toMatchObject({
      to: "someone@example.com",
      from: "Clinic <takime@azaleadent.com>",
    });
  });

  it("defaults the SMS recipient to the clinic's primary number", () => {
    const [channel] = resolveChannels({
      TWILIO_ACCOUNT_SID: "AC1",
      TWILIO_AUTH_TOKEN: "tok",
      TWILIO_FROM_NUMBER: "+15550100000",
    });
    expect(channel).toMatchObject({ kind: "sms", to: "+38348306376" });
  });

  it("needs the full Twilio triple before it will text", () => {
    expect(
      resolveChannels({ TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "tok" }),
    ).toEqual([]);
  });

  it("ignores variables that are only whitespace", () => {
    expect(resolveChannels({ RESEND_API_KEY: "   " })).toEqual([]);
  });

  it("uses email and SMS together when both are configured", () => {
    const kinds = resolveChannels({
      RESEND_API_KEY: "re_test",
      TWILIO_ACCOUNT_SID: "AC1",
      TWILIO_AUTH_TOKEN: "tok",
      TWILIO_FROM_NUMBER: "+15550100000",
      APPOINTMENT_WEBHOOK_URL: "https://example.com/hook",
    }).map((c) => c.kind);
    expect(kinds).toEqual(["email", "sms", "webhook"]);
  });
});
