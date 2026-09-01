import { describe, expect, it } from "vitest";

import {
  clinic,
  formatAddress,
  primaryPhone,
  telHref,
  viberHref,
  whatsappHref,
} from "@/content/clinic";
import { galleryOrder, photos } from "@/content/images";
import { formatPrice, priceGroups, priceItemCount } from "@/content/prices";
import { getService, services, serviceSlugs } from "@/content/services";
import { locales } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { sq } from "@/i18n/dictionaries/sq";

describe("services", () => {
  it("covers the eight treatments listed on the clinic shopfront", () => {
    expect(services).toHaveLength(8);
  });

  it("uses unique slugs", () => {
    expect(new Set(serviceSlugs).size).toBe(serviceSlugs.length);
  });

  it("has copy in every locale for every field", () => {
    for (const service of services) {
      for (const locale of locales) {
        expect(service.title[locale]?.length).toBeGreaterThan(0);
        expect(service.summary[locale]?.length).toBeGreaterThan(0);
        expect(service.body.every((p) => p[locale].length > 0)).toBe(true);
        expect(service.highlights.every((h) => h[locale].length > 0)).toBe(true);
        expect(
          service.steps.every(
            (s) => s.title[locale].length > 0 && s.detail[locale].length > 0,
          ),
        ).toBe(true);
      }
    }
  });

  it("looks up by slug and returns undefined for unknown slugs", () => {
    expect(getService("implantologji")?.title.en).toBe("Dental implants");
    expect(getService("nope")).toBeUndefined();
  });
});

describe("photos", () => {
  it("gives every photo alt text and a caption in both locales", () => {
    for (const photo of Object.values(photos)) {
      for (const locale of locales) {
        expect(photo.alt[locale].length).toBeGreaterThan(10);
        expect(photo.caption[locale].length).toBeGreaterThan(0);
      }
    }
  });

  it("orders the gallery from real photo keys only", () => {
    for (const key of galleryOrder) expect(photos[key]).toBeDefined();
    expect(new Set(galleryOrder).size).toBe(galleryOrder.length);
  });
});

describe("dictionaries", () => {
  /** Guards against a locale silently drifting out of shape. */
  function shape(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(shape);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value as object)
          .sort()
          .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
      );
    }
    return typeof value;
  }

  it("has identical structure across locales", () => {
    expect(shape(en)).toEqual(shape(sq));
  });

  it("never leaves a string empty", () => {
    const walk = (node: unknown, path: string) => {
      if (typeof node === "string") {
        expect(node.trim(), `empty string at ${path}`).not.toBe("");
      } else if (Array.isArray(node)) {
        node.forEach((item, i) => walk(item, `${path}[${i}]`));
      } else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`);
      }
    };
    walk(sq, "sq");
    walk(en, "en");
  });
});

describe("clinic contact helpers", () => {
  it("returns null rather than inventing details that are not configured", () => {
    if (clinic.phones.length === 0) expect(telHref()).toBeNull();
    if (!clinic.whatsapp) expect(whatsappHref()).toBeNull();
    if (!clinic.viber) expect(viberHref()).toBeNull();
    if (!clinic.address) expect(formatAddress()).toBeNull();
  });

  it("formats the address in postal order", () => {
    expect(formatAddress()).toBe("Holger Petersen, 10000 Prishtinë");
  });

  it("publishes the clinic's real numbers", () => {
    expect(clinic.phones).toEqual(["+383 48 306 376", "+383 43 779 909"]);
    expect(primaryPhone()).toBe("+383 48 306 376");
  });

  it("strips formatting from tel: links so they dial correctly", () => {
    expect(telHref()).toBe("tel:+38348306376");
    expect(telHref("+383 43 779 909")).toBe("tel:+38343779909");
  });

  it("builds wa.me and viber links from the messaging number", () => {
    expect(whatsappHref()).toBe("https://wa.me/38348306376");
    expect(whatsappHref("Test")).toBe("https://wa.me/38348306376?text=Test");
    expect(viberHref()).toBe("viber://chat?number=%2B38348306376");
  });

  it("exposes the clinic's real social profiles", () => {
    expect(clinic.social.instagram.handle).toBe("azalea.dent");
    expect(clinic.social.instagram.url).toContain("instagram.com/azalea.dent");
    expect(clinic.social.facebook).toContain("facebook.com");
  });

  it("opens weekday afternoons and closes at the weekend", () => {
    const weekday = clinic.hours.find((rule) => rule.days.includes("mon"));
    expect(weekday).toMatchObject({ opens: "14:00", closes: "20:00" });
    expect(weekday?.days).toEqual(["mon", "tue", "wed", "thu", "fri"]);

    const weekend = clinic.hours.find((rule) => rule.days.includes("sun"));
    expect(weekend?.opens).toBeNull();
  });

  it("lists the clinical team without inventing credentials", () => {
    expect(clinic.team).toHaveLength(1);
    expect(clinic.team[0]?.name).toBe("Dr. Spec. Arbëreshë Korqaj");
    expect(clinic.team[0]?.role.sq).toBe("Mjeke specialiste");
  });
});

describe("price list", () => {
  it("keeps the eight categories from the printed sheet", () => {
    expect(priceGroups).toHaveLength(8);
    expect(priceGroups.map((g) => g.id)).toEqual([
      "e-pergjithshme",
      "pedodonci",
      "kirurgji-orale",
      "endodonci",
      "protetike",
      "estetike",
      "ortodonci",
      "parodontologji",
    ]);
  });

  it("transcribes all 49 priced treatments", () => {
    expect(priceItemCount).toBe(49);
  });

  it("gives every treatment a positive price and both languages", () => {
    for (const group of priceGroups) {
      for (const locale of locales) {
        expect(group.title[locale].length).toBeGreaterThan(0);
      }
      for (const item of group.items) {
        expect(item.price, `${item.name.sq} has no price`).toBeGreaterThan(0);
        expect(Number.isInteger(item.price)).toBe(true);
        for (const locale of locales) {
          expect(item.name[locale].length, `${item.name.sq} missing ${locale}`)
            .toBeGreaterThan(0);
        }
      }
    }
  });

  /** Spot checks against the sheet, so a mistyped figure fails the build. */
  it("matches the sheet on the prices patients ask about most", () => {
    const priceOf = (sq: string) =>
      priceGroups.flatMap((g) => g.items).find((i) => i.name.sq === sq)?.price;

    expect(priceOf("Kontrollë stomatologjike")).toBe(10);
    expect(priceOf("Implanti")).toBe(450);
    expect(priceOf("Sinus lift")).toBe(500);
    expect(priceOf("Pastrimi i dhëmbëve")).toBe(30);
    expect(priceOf("Zbardhimi i dhëmbëve")).toBe(120);
    expect(priceOf("Kurora zircon")).toBe(120);
    expect(priceOf("Faseta estetike (veneer)")).toBe(200);
  });

  it("formats a price with the euro sign", () => {
    expect(formatPrice(450)).toBe("450 €");
  });
});
