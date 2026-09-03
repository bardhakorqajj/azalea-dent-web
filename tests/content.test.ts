import { describe, expect, it } from "vitest";

import {
  clinic,
  displayNumber,
  formatAddress,
  mailtoHref,
  primaryPhone,
  telHref,
  viberHref,
  whatsappHref,
} from "@/content/clinic";
import { fallbackChannels } from "@/components/layout/ContactChannels";
import { galleryOrder, photos } from "@/content/images";
import { formatPrice, priceGroups, priceItemCount } from "@/content/prices";
import { getService, services, serviceSlugs } from "@/content/services";
import { locales } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { sq } from "@/i18n/dictionaries/sq";

describe("services", () => {
  it("covers the eight areas on the clinic's price list", () => {
    expect(services).toHaveLength(8);
  });

  it("maps every treatment to a group in the price list", () => {
    const groupIds = new Set(priceGroups.map((group) => group.id));
    for (const service of services) {
      expect(
        groupIds.has(service.priceGroupId),
        `${service.slug} has no prices`,
      ).toBe(true);
    }
    // Every price group is reachable from a treatment page.
    expect(new Set(services.map((s) => s.priceGroupId)).size).toBe(
      priceGroups.length,
    );
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
        expect(service.highlights.every((h) => h[locale].length > 0)).toBe(
          true,
        );
        expect(
          service.steps.every(
            (s) => s.title[locale].length > 0 && s.detail[locale].length > 0,
          ),
        ).toBe(true);
      }
    }
  });

  it("looks up by slug and returns undefined for unknown slugs", () => {
    expect(getService("kirurgji-orale")?.title.en).toBe("Oral surgery");
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
        for (const [key, value] of Object.entries(node))
          walk(value, `${path}.${key}`);
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

  it("pre-fills mailto: without turning spaces into plus signs", () => {
    expect(mailtoHref()).toBe("mailto:azaleadent@hotmail.com");

    const href = mailtoHref({
      subject: "Kërkesë për takim",
      body: "Emri: A B",
    });
    expect(href).toContain("subject=K%C3%ABrkes%C3%AB%20p%C3%ABr%20takim");
    expect(href).toContain("body=Emri%3A%20A%20B");
    expect(href).not.toContain("+");
  });

  it("shows messaging numbers the way they are published elsewhere", () => {
    // WhatsApp and Viber store bare digits; patients should read the spaced form.
    expect(displayNumber("38348306376")).toBe("+383 48 306 376");
    expect(displayNumber("+38348306376")).toBe("+383 48 306 376");
    // An unpublished number is still rendered, just without invented spacing.
    expect(displayNumber("+38344000000")).toBe("+38344000000");
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
    expect(clinic.team[0]?.name).toBe("Dr. Spec. Arbëreshë Korçaj");
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
          expect(
            item.name[locale].length,
            `${item.name.sq} missing ${locale}`,
          ).toBeGreaterThan(0);
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

describe("fallback channels", () => {
  /* When a request fails to send, every route to the clinic is offered at
     once. A channel quietly going missing here would leave a patient with a
     dead end, so the list is pinned down rather than smoke-tested. */
  it("offers every published way of reaching the clinic", () => {
    const keys = fallbackChannels(sq).map((channel) => channel.key);
    expect(keys).toEqual([
      "phone-+383 48 306 376",
      "phone-+383 43 779 909",
      "whatsapp",
      "viber",
      "email",
      "instagram",
      "facebook",
    ]);
  });

  it("carries the request into the channels that can take a message", () => {
    const summary = "Emri: Test";
    const byKey = Object.fromEntries(
      fallbackChannels(sq, summary).map((channel) => [
        channel.key,
        channel.href,
      ]),
    );

    expect(byKey.whatsapp).toContain(`text=${encodeURIComponent(summary)}`);
    expect(byKey.email).toContain(`body=${encodeURIComponent(summary)}`);
    expect(byKey.email).toContain("subject=");

    // Dialling and profile links cannot carry one, so they stay bare.
    expect(byKey["phone-+383 48 306 376"]).toBe("tel:+38348306376");
    expect(byKey.viber).not.toContain("text");
    expect(byKey.instagram).toBe(clinic.social.instagram.url);
  });

  it("names each channel by something the patient can recognise", () => {
    const byKey = Object.fromEntries(
      fallbackChannels(sq).map((channel) => [channel.key, channel.value]),
    );
    expect(byKey.whatsapp).toBe("+383 48 306 376");
    expect(byKey.viber).toBe("+383 48 306 376");
    expect(byKey.instagram).toBe("@azalea.dent");
    // Never the bare word "Facebook" twice over: the page is the clinic's own.
    expect(byKey.facebook).toBe(clinic.name);
  });

  it("labels each channel in both languages", () => {
    for (const dict of [sq, en]) {
      for (const channel of fallbackChannels(dict)) {
        expect(channel.label.length).toBeGreaterThan(0);
        expect(channel.value.length).toBeGreaterThan(0);
      }
    }
  });
});
