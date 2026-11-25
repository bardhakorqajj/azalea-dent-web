import { describe, expect, it, vi } from "vitest";

import {
  availableChannels,
  buildConfirmation,
  DEFAULT_TEMPLATES,
  placeholderValues,
  renderTemplate,
  unknownPlaceholders,
  confirmationLocale,
  patientE164,
  sendConfirmation,
  whatsappConfirmationHref,
  type ConfirmationDetails,
} from "@/lib/confirmation";

const details: ConfirmationDetails = {
  patientName: "Arta Krasniqi",
  date: "2026-12-04",
  time: "15:00",
  timeSlot: null,
  service: null,
  clinicName: "Azalea Dent",
  address: "Holger Petersen, 10000 Prishtinë",
  phone: "+383 48 306 376",
};

describe("buildConfirmation", () => {
  it("states the day, date and time in the patient's language", () => {
    expect(buildConfirmation(details, "sq").short).toContain(
      "Takimi juaj te Azalea Dent është konfirmuar: e premte, 4 dhjetor 2026, ora 15:00.",
    );
    expect(buildConfirmation(details, "en").short).toContain(
      "Your appointment at Azalea Dent is confirmed: Friday, 4 December 2026, at 15:00.",
    );
    expect(buildConfirmation(details, "de").short).toContain(
      "Ihr Termin bei Azalea Dent ist bestätigt: Freitag, 4. Dezember 2026, um 15:00 Uhr.",
    );
  });

  it("never shifts the day, whatever the server's timezone", () => {
    const original = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";
    try {
      expect(buildConfirmation(details, "en").short).toContain("Friday, 4 December 2026");
    } finally {
      process.env.TZ = original;
    }
  });

  it("names the part of the day when no exact time is set", () => {
    const message = buildConfirmation({ ...details, time: null, timeSlot: "afternoon" }, "de");
    expect(message.short).toContain("Freitag, 4. Dezember 2026, nachmittags.");
  });

  it("includes the treatment, the address and how to change it", () => {
    const message = buildConfirmation({ ...details, service: "Oral surgery" }, "en");
    expect(message.short).toContain("Treatment: Oral surgery.");
    expect(message.short).toContain("Address: Holger Petersen, 10000 Prishtinë.");
    expect(message.short).toContain("call us on +383 48 306 376");
  });

  it("leaves out a line whose detail is missing rather than sending it half empty", () => {
    const message = buildConfirmation({ ...details, address: null, phone: null }, "en");
    expect(message.body).not.toContain("Address");
    expect(message.body).not.toContain("call us on");
    expect(message.body).toContain("We look forward to seeing you.");
  });

  it("greets the patient by name and gives the email a subject", () => {
    const message = buildConfirmation(details, "sq");
    expect(message.body.startsWith("Përshëndetje Arta Krasniqi,")).toBe(true);
    expect(message.subject).toBe("Takimi juaj është konfirmuar — Azalea Dent");
  });

  it("keeps the SMS compact by dropping blank lines", () => {
    const message = buildConfirmation(details, "en");
    expect(message.body).toContain("\n\n");
    expect(message.short).not.toContain("\n\n");
  });
});

describe("the clinic's own wording", () => {
  it("is used instead of the default, with the placeholders filled", () => {
    const message = buildConfirmation(details, "de", {
      subject: "Termin am {date}",
      body: "Hallo {patient}! Bis {when}.\nIhre {clinic}",
    });
    expect(message.subject).toBe("Termin am Freitag, 4. Dezember 2026");
    expect(message.body).toBe(
      "Hallo Arta Krasniqi! Bis Freitag, 4. Dezember 2026, um 15:00 Uhr.\nIhre Azalea Dent",
    );
  });

  it("falls back to the default for a field left empty", () => {
    const message = buildConfirmation(details, "en", { subject: "  ", body: "" });
    expect(message.subject).toBe("Your appointment is confirmed — Azalea Dent");
    expect(message.body).toBe(buildConfirmation(details, "en").body);
  });

  it("fills {time} with the part of the day when there is no exact time", () => {
    expect(
      renderTemplate("Ora: {time}", placeholderValues({ ...details, time: null, timeSlot: "evening" }, "sq")),
    ).toBe("Ora: në mbrëmje");
  });

  it("drops a line naming an empty detail and tidies the gap it leaves", () => {
    expect(
      renderTemplate("Hello\n\nTreatment: {service}\n\n\nBye", { service: null }),
    ).toBe("Hello\n\nBye");
  });

  it("finds a mistyped placeholder, so it can be refused before a patient sees it", () => {
    expect(unknownPlaceholders("Hello {patinet}, see you {when} {}")).toEqual(["{patinet}", "{}"]);
    expect(unknownPlaceholders(DEFAULT_TEMPLATES.de.body)).toEqual([]);
    expect(unknownPlaceholders(DEFAULT_TEMPLATES.sq.subject)).toEqual([]);
  });
});

describe("confirmationLocale", () => {
  it("uses the language the patient booked in, and Albanian otherwise", () => {
    expect(confirmationLocale("de")).toBe("de");
    expect(confirmationLocale("en")).toBe("en");
    expect(confirmationLocale(null)).toBe("sq");
    expect(confirmationLocale("fr")).toBe("sq");
  });
});

describe("patientE164", () => {
  it("reads a local number as a Kosovo number", () => {
    expect(patientE164("044 123 456")).toBe("+38344123456");
    expect(patientE164("049/123-456")).toBe("+38349123456");
  });

  it("keeps a number already in international form", () => {
    expect(patientE164("+49 170 1234567")).toBe("+491701234567");
    expect(patientE164("0049 170 1234567")).toBe("+491701234567");
    expect(patientE164("383 44 123 456")).toBe("+38344123456");
  });

  it("refuses a number it would have to guess the country of", () => {
    expect(patientE164("44 123 456")).toBeNull();
    expect(patientE164("call me")).toBeNull();
    expect(patientE164("0123")).toBeNull();
    expect(patientE164(null)).toBeNull();
  });
});

describe("whatsappConfirmationHref", () => {
  it("opens the patient's chat with the message typed in", () => {
    expect(whatsappConfirmationHref("044 123 456", "Takimi është konfirmuar")).toBe(
      "https://wa.me/38344123456?text=Takimi%20%C3%ABsht%C3%AB%20konfirmuar",
    );
    expect(whatsappConfirmationHref("44 123 456", "x")).toBeNull();
  });
});

describe("sending", () => {
  const env = {
    RESEND_API_KEY: "re_test",
    APPOINTMENT_TO_EMAIL: "clinic@example.org",
    TWILIO_ACCOUNT_SID: "AC123",
    TWILIO_AUTH_TOKEN: "secret",
    TWILIO_FROM_NUMBER: "+15005550006",
  };
  const contact = { email: "patient@example.org", phone: "044 123 456" };
  const message = buildConfirmation(details, "en");

  it("only offers a channel that is both configured and has somewhere to go", () => {
    expect(availableChannels({}, contact)).toMatchObject({ email: false, sms: false });
    expect(availableChannels(env, { email: null, phone: "44 1" })).toMatchObject({
      email: false,
      sms: false,
      emailConfigured: true,
      smsConfigured: true,
    });
    expect(availableChannels(env, contact)).toMatchObject({ email: true, sms: true });
  });

  it("emails the patient, with replies going to the clinic, and texts the short version", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const results = await sendConfirmation(message, contact, {
      env,
      replyTo: "azaleadent@hotmail.com",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(results).toEqual([
      { channel: "email", ok: true },
      { channel: "sms", ok: true },
    ]);

    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    const email = JSON.parse(calls[0]![1].body as string);
    expect(email.to).toEqual(["patient@example.org"]);
    expect(email.reply_to).toBe("azaleadent@hotmail.com");
    expect(email.text).toBe(message.body);

    const sms = calls[1]![1].body as URLSearchParams;
    expect(sms.get("To")).toBe("+38344123456");
    expect(sms.get("Body")).toBe(message.short);
  });

  it("reports each channel on its own, so one failure does not hide a success", async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes("resend")
        ? new Response("{}", { status: 403 })
        : new Response("{}", { status: 201 }),
    );
    const results = await sendConfirmation(message, contact, {
      env,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(results).toEqual([
      { channel: "email", ok: false, error: "resend 403" },
      { channel: "sms", ok: true },
    ]);
  });

  it("turns a network error into a failed result rather than an exception", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    });
    const results = await sendConfirmation(message, contact, {
      env,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(results.every((result) => !result.ok)).toBe(true);
  });

  it("sends nothing when nothing is configured", async () => {
    const fetchImpl = vi.fn();
    expect(
      await sendConfirmation(message, contact, { env: {}, fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
