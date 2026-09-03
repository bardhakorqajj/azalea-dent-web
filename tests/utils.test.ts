import { afterEach, describe, expect, it } from "vitest";

import { isLocale, path, stripLocale } from "@/i18n/config";
import { absoluteUrl, languageAlternates, siteUrl } from "@/lib/site";
import { formatDayRange, formatHours } from "@/lib/hours";
import { cn, initials, interpolate } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names only", () => {
    expect(cn("a", false, undefined, "b", null)).toBe("a b");
  });
});

describe("interpolate", () => {
  it("replaces known tokens and leaves unknown ones alone", () => {
    expect(interpolate("{current} nga {total}", { current: 2, total: 5 })).toBe(
      "2 nga 5",
    );
    expect(interpolate("{missing}", {})).toBe("{missing}");
  });
});

describe("path", () => {
  it("builds locale-prefixed hrefs", () => {
    // The default language is published without a prefix.
    expect(path("sq")).toBe("/");
    expect(path("sq", "/contact")).toBe("/contact");
    expect(path("en")).toBe("/en");
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
    expect(
      formatHours({ days: ["sun"], opens: null, closes: null }, "Mbyllur"),
    ).toBe("Mbyllur");
  });
});

describe("initials", () => {
  it("skips titles and abbreviations", () => {
    expect(initials("Dr. Spec. Arbëreshë Korçaj")).toBe("AK");
    expect(initials("Dr. Arta Berisha")).toBe("AB");
    expect(initials("Prof. Dr. Med. Filan Fisteku")).toBe("FF");
  });

  it("handles a plain name and a single word", () => {
    expect(initials("Arta Berisha")).toBe("AB");
    expect(initials("Arta")).toBe("A");
  });
});

describe("localeFlags", () => {
  it("gives every locale a flag and a spoken name", async () => {
    const { locales, localeFlags, localeNames } = await import("@/i18n/config");
    for (const locale of locales) {
      expect(localeFlags[locale], `${locale} has no flag`).toBeTruthy();
      expect(localeNames[locale], `${locale} has no name`).toBeTruthy();
    }
    expect(localeFlags.sq).toBe("🇦🇱");
    expect(localeFlags.en).toBe("🇬🇧");
  });
});

describe("stripLocale", () => {
  it("removes a leading language segment and leaves everything else alone", () => {
    expect(stripLocale("/en/contact")).toBe("/contact");
    expect(stripLocale("/sq/services/protetike")).toBe("/services/protetike");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/contact")).toBe("/contact");
    expect(stripLocale("/")).toBe("/");
  });

  it("keeps a path whose first segment merely looks like one", () => {
    // "english" is not a locale, so it is a page name.
    expect(stripLocale("/english")).toBe("/english");
  });
});

describe("languageAlternates", () => {
  it("points each language at its own address, unprefixed for the default", () => {
    expect(languageAlternates("/prices")).toEqual({
      sq: "/prices",
      en: "/en/prices",
      "x-default": "/prices",
    });
    expect(languageAlternates()).toEqual({
      sq: "/",
      en: "/en",
      "x-default": "/",
    });
  });
});

describe("siteUrl", () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  function env(values: Record<string, string | undefined>) {
    for (const key of [
      "SITE_URL",
      "NEXT_PUBLIC_SITE_URL",
      "VERCEL_PROJECT_PRODUCTION_URL",
    ]) {
      delete process.env[key];
    }
    Object.assign(process.env, values);
  }

  it("prefers the explicit domain over Vercel's generated one", () => {
    env({
      SITE_URL: "https://azalea-dent.org",
      VERCEL_PROJECT_PRODUCTION_URL: "azalea-dent.vercel.app",
    });
    expect(siteUrl()).toBe("https://azalea-dent.org");
    expect(absoluteUrl("/prices")).toBe("https://azalea-dent.org/prices");
  });

  it("still honours the old NEXT_PUBLIC_ name, so a rename cannot break a live site", () => {
    env({ NEXT_PUBLIC_SITE_URL: "https://azalea-dent.org" });
    expect(siteUrl()).toBe("https://azalea-dent.org");
  });

  it("lets the unprefixed name win when both are set", () => {
    env({
      SITE_URL: "https://azalea-dent.org",
      NEXT_PUBLIC_SITE_URL: "https://old.example.com",
    });
    expect(siteUrl()).toBe("https://azalea-dent.org");
  });

  it("trims trailing slashes so URLs never come out doubled", () => {
    env({ SITE_URL: "https://azalea-dent.org//" });
    expect(siteUrl()).toBe("https://azalea-dent.org");
    expect(absoluteUrl("/prices")).toBe("https://azalea-dent.org/prices");
  });

  it("falls back to the Vercel domain, then to localhost", () => {
    env({ VERCEL_PROJECT_PRODUCTION_URL: "azalea-dent.vercel.app" });
    expect(siteUrl()).toBe("https://azalea-dent.vercel.app");

    env({});
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
