import { describe, expect, it } from "vitest";

import { isLocale, path } from "@/i18n/config";
import { formatDayRange, formatHours } from "@/lib/hours";
import { cn, interpolate } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names only", () => {
    expect(cn("a", false, undefined, "b", null)).toBe("a b");
  });
});

describe("interpolate", () => {
  it("replaces known tokens and leaves unknown ones alone", () => {
    expect(interpolate("{current} nga {total}", { current: 2, total: 5 })).toBe("2 nga 5");
    expect(interpolate("{missing}", {})).toBe("{missing}");
  });
});

describe("path", () => {
  it("builds locale-prefixed hrefs", () => {
    expect(path("sq")).toBe("/sq");
    expect(path("en", "/contact")).toBe("/en/contact");
  });
});

describe("isLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("sq")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("formatDayRange", () => {
  it("collapses a contiguous run into a range", () => {
    expect(formatDayRange(["mon", "tue", "wed", "thu", "fri"], "en")).toBe(
      "Monday – Friday",
    );
    expect(formatDayRange(["mon", "tue", "wed", "thu", "fri"], "sq")).toBe(
      "E hënë – E premte",
    );
  });

  it("lists non-contiguous days", () => {
    expect(formatDayRange(["mon", "wed"], "en")).toBe("Monday, Wednesday");
  });

  it("returns a single day unchanged", () => {
    expect(formatDayRange(["sat"], "en")).toBe("Saturday");
  });
});

describe("formatHours", () => {
  it("formats an open day", () => {
    expect(
      formatHours({ days: ["mon"], opens: "09:00", closes: "19:00" }, "Closed"),
    ).toBe("09:00 – 19:00");
  });

  it("uses the closed label when there are no hours", () => {
    expect(formatHours({ days: ["sun"], opens: null, closes: null }, "Mbyllur")).toBe(
      "Mbyllur",
    );
  });
});
