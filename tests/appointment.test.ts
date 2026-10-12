import { describe, expect, it } from "vitest";

import {
  emptyAppointment,
  formatRequest,
  hasErrors,
  isFutureDate,
  isValidEmail,
  isValidPhone,
  isValidTime,
  validateAppointment,
  type AppointmentRequest,
} from "@/lib/appointment";
import { bookingWindow } from "@/lib/hours";
import type { OpeningHours } from "@/content/clinic";

const TODAY = new Date("2026-06-15T10:00:00Z");

/* The clinic's published hours: weekday afternoons, closed at the weekend.
   2026-06-20 is a Saturday and 2026-06-22 a Monday. */
const HOURS: OpeningHours[] = [
  { days: ["mon", "tue", "wed", "thu", "fri"], opens: "14:00", closes: "20:00" },
  { days: ["sat", "sun"], opens: null, closes: null },
];

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

describe("isValidTime", () => {
  it("accepts a 24h time of day", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("14:30")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
  });

  it("rejects anything that is not one", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("14:60")).toBe(false);
    expect(isValidTime("9:30")).toBe(false);
    expect(isValidTime("14:30:00")).toBe(false);
    expect(isValidTime("afternoon")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});

describe("bookingWindow", () => {
  it("uses the hours of the day that was chosen", () => {
    expect(bookingWindow(HOURS, "2026-06-22")).toEqual({
      opens: "14:00",
      closes: "20:00",
    });
  });

  it("falls back to the widest hours for a closed day or no date", () => {
    /* A Saturday request is not refused outright — the clinic decides — so the
       widest published window still bounds the picker. */
    expect(bookingWindow(HOURS, "2026-06-20")).toEqual({
      opens: "14:00",
      closes: "20:00",
    });
    expect(bookingWindow(HOURS, "")).toEqual({ opens: "14:00", closes: "20:00" });
    expect(
      bookingWindow(
        [
          { days: ["mon"], opens: "09:00", closes: "13:00" },
          { days: ["tue"], opens: "15:00", closes: "19:30" },
        ],
        undefined,
      ),
    ).toEqual({ opens: "09:00", closes: "19:30" });
  });

  it("knows no bound when the clinic publishes no hours", () => {
    expect(bookingWindow([], "2026-06-22")).toBeNull();
    expect(bookingWindow([{ days: ["mon"], opens: null, closes: null }])).toBeNull();
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

  it("leaves the time optional but checks the one that is given", () => {
    const slugs = ["kirurgji-orale"];
    expect(
      validateAppointment(valid({ time: "" }), TODAY, slugs, HOURS).time,
    ).toBeUndefined();
    expect(
      validateAppointment(valid({ time: "15:30" }), TODAY, slugs, HOURS).time,
    ).toBeUndefined();
    expect(
      validateAppointment(valid({ time: "not a time" }), TODAY, slugs, HOURS).time,
    ).toBe("time");
  });

  it("refuses a time the clinic is not open for", () => {
    const slugs = ["kirurgji-orale"];
    const monday = { date: "2026-06-22" };
    expect(
      validateAppointment(valid({ ...monday, time: "03:00" }), TODAY, slugs, HOURS).time,
    ).toBe("time");
    expect(
      validateAppointment(valid({ ...monday, time: "21:00" }), TODAY, slugs, HOURS).time,
    ).toBe("time");
    expect(
      validateAppointment(valid({ ...monday, time: "14:00" }), TODAY, slugs, HOURS).time,
    ).toBeUndefined();
  });

  it("accepts any valid time when no hours are published", () => {
    expect(
      validateAppointment(valid({ time: "03:00" }), TODAY, ["kirurgji-orale"], []).time,
    ).toBeUndefined();
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
      valid({ email: "arta@example.com", time: "15:30", message: "Dhimbje dhëmbi" }),
      labels,
    );
    expect(summary).toContain("Email: arta@example.com");
    expect(summary).toContain("Time: 15:30");
    expect(summary).toContain("Message: Dhimbje dhëmbi");
  });
});
