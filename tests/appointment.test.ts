import { describe, expect, it } from "vitest";

import {
  emptyAppointment,
  formatRequest,
  hasErrors,
  isFutureDate,
  isValidEmail,
  isValidPhone,
  validateAppointment,
  type AppointmentRequest,
} from "@/lib/appointment";

const TODAY = new Date("2026-06-15T10:00:00Z");

function valid(overrides: Partial<AppointmentRequest> = {}): AppointmentRequest {
  return {
    ...emptyAppointment,
    name: "Arta Berisha",
    phone: "+383 44 123 456",
    service: "kirurgji-orale",
    date: "2026-06-20",
    consent: true,
    ...overrides,
  };
}

describe("isValidPhone", () => {
  it("accepts international and local formats", () => {
    expect(isValidPhone("+383 44 123 456")).toBe(true);
    expect(isValidPhone("044 123 456")).toBe(true);
    expect(isValidPhone("(044) 123-456")).toBe(true);
  });

  it("rejects too short, too long and non-numeric input", () => {
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("1234567890123456")).toBe(false);
    expect(isValidPhone("not a phone")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("arta@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("arta@example")).toBe(false);
    expect(isValidEmail("arta example.com")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });
});

describe("isFutureDate", () => {
  it("accepts today and later", () => {
    expect(isFutureDate("2026-06-15", TODAY)).toBe(true);
    expect(isFutureDate("2026-12-01", TODAY)).toBe(true);
  });

  it("rejects past dates and malformed input", () => {
    expect(isFutureDate("2026-06-14", TODAY)).toBe(false);
    expect(isFutureDate("15/06/2026", TODAY)).toBe(false);
    expect(isFutureDate("", TODAY)).toBe(false);
  });
});

describe("validateAppointment", () => {
  it("passes a complete request", () => {
    expect(hasErrors(validateAppointment(valid(), TODAY))).toBe(false);
  });

  it("reports every missing required field on an empty form", () => {
    const errors = validateAppointment(emptyAppointment, TODAY);
    expect(errors).toMatchObject({
      name: "name",
      phone: "phone",
      service: "service",
      date: "date",
      consent: "consent",
    });
  });

  it("treats email as optional but validates it when present", () => {
    expect(validateAppointment(valid({ email: "" }), TODAY).email).toBeUndefined();
    expect(validateAppointment(valid({ email: "nope" }), TODAY).email).toBe("email");
  });

  it("distinguishes a missing date from a past one", () => {
    expect(validateAppointment(valid({ date: "" }), TODAY).date).toBe("date");
    expect(validateAppointment(valid({ date: "2020-01-01" }), TODAY).date).toBe("datePast");
  });

  it("only accepts a known service slug or 'other'", () => {
    expect(validateAppointment(valid({ service: "other" }), TODAY).service).toBeUndefined();
    expect(validateAppointment(valid({ service: "made-up" }), TODAY).service).toBe("service");
  });

  it("requires consent", () => {
    expect(validateAppointment(valid({ consent: false }), TODAY).consent).toBe("consent");
  });
});

describe("formatRequest", () => {
  const labels = {
    name: "Name",
    phone: "Phone",
    email: "Email",
    service: "Service",
    date: "Date",
    time: "Time",
    message: "Message",
  };

  it("omits the optional fields that are empty", () => {
    const summary = formatRequest(valid(), labels);
    expect(summary).toContain("Name: Arta Berisha");
    expect(summary).not.toContain("Email:");
    expect(summary).not.toContain("Message:");
  });

  it("includes optional fields once filled", () => {
    const summary = formatRequest(
      valid({ email: "arta@example.com", time: "morning", message: "Dhimbje dhëmbi" }),
      labels,
    );
    expect(summary).toContain("Email: arta@example.com");
    expect(summary).toContain("Time: morning");
    expect(summary).toContain("Message: Dhimbje dhëmbi");
  });
});
