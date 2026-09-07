import { describe, expect, it } from "vitest";

import { clinic } from "@/content/clinic";
import { IMPLANT_PRICE_NAMES, implantPrices } from "@/content/prices";
import { services } from "@/content/services";
import { locales, path } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { sq } from "@/i18n/dictionaries/sq";
import {
  dentistSchema,
  implantsSchema,
  pageSchema,
  treatmentSchema,
} from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/site";

/** Pulls the node of a given @type out of a `@graph` envelope. */
function node(graph: { "@graph": object[] }, type: string) {
  return graph["@graph"]
    .map((n) => n as Record<string, unknown>)
    .find((n) => {
      const t = n["@type"];
      return Array.isArray(t) ? t.includes(type) : t === type;
    });
}

describe("structured data", () => {
  it("describes the clinic as a dentist with a place and hours", () => {
    const clinicNode = node(dentistSchema("sq"), "Dentist") as
      | Record<string, unknown>
      | undefined;

    expect(clinicNode).toBeDefined();
    expect(clinicNode?.name).toBe("Azalea Dent");
    expect(clinicNode?.medicalSpecialty).toBe("Dentistry");
    // Without an address, coordinates and hours, a local pack has nothing to
    // match a "dentist near me" against.
    expect(clinicNode?.address).toMatchObject({
      addressLocality: "Prishtinë",
      addressCountry: "XK",
    });
    expect(clinicNode?.geo).toMatchObject({
      latitude: 42.6390286,
      longitude: 21.1638098,
    });
    expect(clinicNode?.openingHoursSpecification).toBeDefined();
    expect(clinicNode?.telephone).toEqual(clinic.phones);
  });

  it("names the country rather than repeating its ISO code", () => {
    const clinicNode = node(dentistSchema("sq"), "Dentist") as Record<
      string,
      unknown
    >;
    const area = clinicNode.areaServed as { name: string }[];
    expect(area.map((a) => a.name)).toContain("Kosovo");
    expect(area.map((a) => a.name)).not.toContain("XK");
  });

  it("links the clinic to the profiles it actually has", () => {
    const clinicNode = node(dentistSchema("en"), "Dentist") as Record<
      string,
      unknown
    >;
    const sameAs = clinicNode.sameAs as string[];
    expect(sameAs).toContain(clinic.social.instagram.url);
    // `null` profiles are dropped rather than published as empty strings.
    expect(sameAs.every(Boolean)).toBe(true);
  });

  it("publishes one clinic node that every other node points at", () => {
    const graph = pageSchema({
      locale: "sq",
      url: "https://example.org/prices",
      name: "Çmimet",
      description: "…",
      breadcrumbs: [{ name: "Çmimet", url: "https://example.org/prices" }],
    });

    const page = node(graph, "WebPage") as Record<string, unknown>;
    expect(page.inLanguage).toBe("sq-AL");
    expect(page.isPartOf).toEqual({ "@id": expect.stringContaining("#website") });
    expect(node(graph, "BreadcrumbList")).toBeDefined();
  });

  it("starts every breadcrumb trail at the home page", () => {
    for (const locale of locales) {
      const graph = pageSchema({
        locale,
        url: "https://example.org/x",
        name: "X",
        description: "…",
        breadcrumbs: [{ name: "X", url: "https://example.org/x" }],
      });
      const trail = node(graph, "BreadcrumbList") as {
        itemListElement: { position: number; name: string }[];
      };
      expect(trail.itemListElement[0]?.position).toBe(1);
      expect(trail.itemListElement).toHaveLength(2);
    }
  });

  it("omits a breadcrumb list on a page that has no trail", () => {
    const graph = pageSchema({
      locale: "sq",
      url: "https://example.org/",
      name: "Ballina",
      description: "…",
    });
    // A one-item trail is not a trail; publishing it would just be noise.
    expect(node(graph, "BreadcrumbList")).toBeUndefined();
  });

  it("gives every treatment both a procedure and a priced service", () => {
    for (const service of services) {
      for (const locale of locales) {
        const { nodes } = treatmentSchema(service, locale);
        const procedure = nodes.find((n) => n["@type"] === "MedicalProcedure");
        const offered = nodes.find((n) => n["@type"] === "Service") as Record<
          string,
          unknown
        >;

        expect(procedure, `${service.slug} has no procedure`).toBeDefined();
        expect(offered, `${service.slug} has no service`).toBeDefined();

        // Prices come from the clinic's own sheet, so every area has some.
        const offers = offered.offers as { lowPrice: number; highPrice: number };
        expect(offers.lowPrice).toBeGreaterThan(0);
        expect(offers.highPrice).toBeGreaterThanOrEqual(offers.lowPrice);
      }
    }
  });

  it("describes implants as a surgical procedure with real offers", () => {
    const { nodes } = implantsSchema("sq", "https://example.org/implante-dentare");
    const procedure = nodes.find(
      (n) => n["@type"] === "MedicalProcedure",
    ) as Record<string, unknown>;

    expect(procedure.procedureType).toBe(
      "https://schema.org/SurgicalProcedure",
    );
    expect(procedure.provider).toEqual({
      "@id": expect.stringContaining("#clinic"),
    });
  });
});

describe("page metadata", () => {
  it("keeps the Twitter card saying the same thing as the page", () => {
    // The bug this guards: a page that sets `openGraph` but not `twitter`
    // inherits the *layout's* twitter block, so every share advertises the
    // home page instead of the page shared.
    const meta = pageMetadata({
      locale: "sq",
      page: "/prices",
      title: sq.meta.pricesTitle,
      description: sq.meta.pricesDescription,
    });

    expect(meta.twitter?.title).toBe(meta.openGraph?.title);
    expect(meta.twitter?.description).toBe(meta.openGraph?.description);
    expect(meta.twitter?.title).toContain(sq.meta.pricesTitle);
  });

  it("points the canonical at the locale's own address", () => {
    expect(
      pageMetadata({
        locale: "sq",
        page: "/contact",
        title: "x",
        description: "y",
      }).alternates?.canonical,
    ).toBe("/contact");

    expect(
      pageMetadata({
        locale: "en",
        page: "/contact",
        title: "x",
        description: "y",
      }).alternates?.canonical,
    ).toBe("/en/contact");
  });

  it("offers both languages plus an x-default on every page", () => {
    const languages = languageAlternates("/prices");
    expect(languages).toEqual({
      sq: "/prices",
      en: "/en/prices",
      "x-default": "/prices",
    });
  });

  it("is indexable by default", () => {
    const robots = pageMetadata({
      locale: "sq",
      page: "/",
      title: "x",
      description: "y",
    }).robots as { index: boolean };
    // VERCEL_ENV is unset under test, which is the "not a preview" case.
    expect(robots.index).toBe(true);
  });
});

describe("search copy", () => {
  it("gives every page its own title and description", () => {
    for (const dict of [sq, en]) {
      const titles = Object.entries(dict.meta)
        .filter(([key]) => key.endsWith("Title"))
        .map(([, value]) => value);
      const descriptions = Object.entries(dict.meta)
        .filter(([key]) => key.endsWith("Description"))
        .map(([, value]) => value);

      // Duplicated titles or descriptions make Google pick one page and drop
      // the rest as near-duplicates.
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });

  it("keeps descriptions inside the length Google will show", () => {
    for (const dict of [sq, en]) {
      for (const [key, value] of Object.entries(dict.meta)) {
        if (!key.endsWith("Description")) continue;
        expect(value.length, `${key} is too short`).toBeGreaterThan(70);
        expect(value.length, `${key} is too long`).toBeLessThanOrEqual(185);
      }
    }
  });

  it("names the city on the pages a local search would land on", () => {
    for (const dict of [sq, en]) {
      for (const key of [
        "homeTitle",
        "servicesTitle",
        "pricesTitle",
        "implantsTitle",
        "contactTitle",
      ] as const) {
        expect(dict.meta[key]).toMatch(/Prishtin/);
      }
    }
  });
});

describe("the dental implant page", () => {
  it("quotes prices that still exist on the clinic's sheet", () => {
    // Named rather than filtered, so a rename in `prices.ts` fails here
    // instead of silently emptying the table on the page.
    expect(implantPrices()).toHaveLength(IMPLANT_PRICE_NAMES.length);
  });

  it("links to the two areas of treatment it sits between", () => {
    // The page cross-links these by slug; a rename must not leave a dead link.
    expect(services.map((s) => s.slug)).toEqual(
      expect.arrayContaining(["kirurgji-orale", "protetike"]),
    );
  });

  it("is reachable at the same path in both languages", () => {
    expect(path("sq", "/implante-dentare")).toBe("/implante-dentare");
    expect(path("en", "/implante-dentare")).toBe("/en/implante-dentare");
  });
});
