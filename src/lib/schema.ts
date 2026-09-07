import { clinic, formatAddress } from "@/content/clinic";
import { photos } from "@/content/images";
import { implantPrices, priceGroups } from "@/content/prices";
import { services, type Service } from "@/content/services";
import { openingHoursSchema } from "@/lib/hours";
import { absoluteUrl, siteUrl } from "@/lib/site";
import {
  htmlLang,
  localeNames,
  locales,
  path,
  type Locale,
} from "@/i18n/config";

/**
 * ---------------------------------------------------------------------------
 * JSON-LD for the site.
 * ---------------------------------------------------------------------------
 *
 * Everything here is derived from `content/clinic.ts`, `content/services.ts`
 * and `content/prices.ts`, so the structured data cannot claim anything the
 * page itself does not say. Fields whose source is unset are omitted rather
 * than filled in with a plausible guess: Google treats invented structured
 * data as a manual-action offence, and an incomplete truthful record ranks
 * better than a complete invented one.
 *
 * Nodes are linked by `@id` rather than nested, so the clinic is described
 * once per page and everything else points at it. The ids are stable absolute
 * URLs with a fragment, which is what lets a `WebPage` node in one script tag
 * reference the `Dentist` node emitted by the layout in another.
 */

const CLINIC_ID = `${siteUrl()}/#clinic`;
const WEBSITE_ID = `${siteUrl()}/#website`;

export const schemaIds = { clinic: CLINIC_ID, website: WEBSITE_ID };

/** Wraps nodes in the envelope Google expects for a multi-node document. */
function graph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** BCP-47 tag for a locale, e.g. "sq-AL". */
function language(locale: Locale): string {
  return htmlLang[locale];
}

/**
 * The clinic's own photographs, as absolute URLs. Google asks for real images
 * of the business on a `LocalBusiness`, and these are the actual rooms rather
 * than the generated share card.
 */
function clinicImages(): string[] {
  return [
    photos.facadeNight,
    photos.reception,
    photos.operatoryOak,
    photos.operatoryDaylight,
  ].map((photo) => absoluteUrl(photo.src.src));
}

/**
 * The span the printed price list actually covers, e.g. "10–500 €". Derived
 * from the sheet rather than expressed as Google's "€€" banding, which would
 * be a judgement about the clinic rather than a fact from it.
 */
function priceRange(): string | undefined {
  const prices = priceGroups.flatMap((group) =>
    group.items.map((item) => item.price),
  );
  if (prices.length === 0) return undefined;
  return `${Math.min(...prices)}–${Math.max(...prices)} €`;
}

/**
 * Expansions of the ISO 3166-1 codes the address may carry. A `Country` node
 * takes a name, and passing the bare code as the name would publish "XK" as
 * though that were what the country is called. Only the codes the site can
 * actually produce are listed; anything else falls back to the code itself,
 * which is still true, just terser.
 */
const COUNTRY_NAMES: Record<string, string> = {
  XK: "Kosovo",
  AL: "Albania",
  MK: "North Macedonia",
};

/** Everywhere the clinic can reasonably be said to serve, from its address. */
function areaServed() {
  const address = clinic.address;
  if (!address) return undefined;
  return [
    { "@type": "City", name: address.locality },
    {
      "@type": "Country",
      name: COUNTRY_NAMES[address.country] ?? address.country,
      identifier: address.country,
    },
  ];
}

function postalAddress() {
  const a = clinic.address;
  if (!a) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: a.street,
    addressLocality: a.locality,
    ...(a.region ? { addressRegion: a.region } : {}),
    ...(a.postalCode ? { postalCode: a.postalCode } : {}),
    addressCountry: a.country,
  };
}

/**
 * The clinic itself.
 *
 * `Dentist` is the most specific type schema.org offers, and it inherits from
 * both `LocalBusiness` and `MedicalOrganization`, so one node satisfies the
 * organisation, local-business and dentist readings at once — Google resolves
 * the type hierarchy itself, and three overlapping nodes for one clinic would
 * only split the entity.
 */
export function dentistSchema(locale: Locale) {
  const hours = openingHoursSchema();
  const address = postalAddress();
  const area = areaServed();
  const range = priceRange();
  const readableAddress = formatAddress();

  return graph([
    {
      "@type": ["Dentist", "MedicalClinic"],
      "@id": CLINIC_ID,
      name: clinic.name,
      alternateName: clinic.alternateNames,
      description: `${clinic.name} — ${clinic.descriptor}${
        readableAddress ? `, ${readableAddress}` : ""
      }.`,
      url: absoluteUrl(path(locale)),
      image: clinicImages(),
      logo: {
        "@type": "ImageObject",
        "@id": `${siteUrl()}/#logo`,
        url: absoluteUrl("/icon.svg"),
        caption: clinic.name,
      },
      medicalSpecialty: "Dentistry",
      ...(clinic.phones.length > 0 ? { telephone: clinic.phones } : {}),
      ...(clinic.email ? { email: clinic.email } : {}),
      ...(clinic.foundingYear
        ? { foundingDate: String(clinic.foundingYear) }
        : {}),
      ...(address ? { address } : {}),
      ...(clinic.geo
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: clinic.geo.latitude,
              longitude: clinic.geo.longitude,
            },
          }
        : {}),
      ...(hours ? { openingHoursSpecification: hours } : {}),
      ...(clinic.mapsUrl ? { hasMap: clinic.mapsUrl } : {}),
      ...(area ? { areaServed: area } : {}),
      ...(range ? { priceRange: range } : {}),
      currenciesAccepted: "EUR",
      /* The languages the site is actually published in — the pair a patient
         can expect to be understood in. */
      availableLanguage: locales.map((code) => ({
        "@type": "Language",
        name: localeNames[code],
        alternateName: htmlLang[code],
      })),
      ...(clinic.team.length > 0
        ? {
            employee: clinic.team.map((member) => ({
              "@type": "Person",
              name: member.name,
              jobTitle: member.role[locale],
            })),
          }
        : {}),
      sameAs: [
        clinic.social.instagram.url,
        clinic.social.facebook,
        clinic.social.tiktok,
      ].filter((value): value is string => Boolean(value)),
      /* Each area of treatment, priced from the clinic's own sheet. */
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: clinic.name,
        itemListElement: services.map((service) =>
          serviceOfferCatalog(service, locale),
        ),
      },
      availableService: services.map((service) => ({
        "@type": "MedicalProcedure",
        name: service.title[locale],
        description: service.summary[locale],
        url: absoluteUrl(`${path(locale, "/services")}/${service.slug}`),
      })),
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: absoluteUrl(path(locale)),
      name: clinic.name,
      alternateName: clinic.alternateNames,
      inLanguage: language(locale),
      publisher: { "@id": CLINIC_ID },
    },
  ]);
}

/** One area of treatment as a catalogue of its real, priced entries. */
function serviceOfferCatalog(service: Service, locale: Locale) {
  const group = priceGroups.find((g) => g.id === service.priceGroupId);
  const url = absoluteUrl(`${path(locale, "/services")}/${service.slug}`);

  return {
    "@type": "OfferCatalog",
    name: service.title[locale],
    url,
    itemListElement:
      group?.items.map((item) => ({
        "@type": "Offer",
        name: item.name[locale],
        price: item.price,
        priceCurrency: "EUR",
        availableAtOrFrom: { "@id": CLINIC_ID },
        itemOffered: {
          "@type": "MedicalProcedure",
          name: item.name[locale],
        },
      })) ?? [],
  };
}

export type Crumb = { name: string; url: string };

/**
 * The page itself, its trail, and anything it is specifically about.
 *
 * `WebPage` is what carries the page's own language and title into the graph;
 * without it every page inherits only the site-level record and Google has to
 * infer which of them is which.
 */
export function pageSchema({
  locale,
  url,
  name,
  description,
  breadcrumbs = [],
  about,
  primaryImage,
  extra = [],
}: {
  locale: Locale;
  /** Absolute URL of this page. */
  url: string;
  name: string;
  description: string;
  /** Trail after "Home", which is prepended here. */
  breadcrumbs?: Crumb[];
  /** `@id` of the entity the page is chiefly about, e.g. a treatment. */
  about?: string;
  primaryImage?: string;
  /** Further nodes to publish in the same graph. */
  extra?: object[];
}) {
  const pageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const trail: Crumb[] = [
    { name: homeCrumb(locale), url: absoluteUrl(path(locale)) },
    ...breadcrumbs,
  ];

  return graph([
    {
      "@type": "WebPage",
      "@id": pageId,
      url,
      name,
      description,
      inLanguage: language(locale),
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": about ?? CLINIC_ID },
      ...(primaryImage
        ? {
            primaryImageOfPage: {
              "@type": "ImageObject",
              url: primaryImage,
            },
          }
        : {}),
      ...(trail.length > 1 ? { breadcrumb: { "@id": breadcrumbId } } : {}),
    },
    ...(trail.length > 1
      ? [
          {
            "@type": "BreadcrumbList",
            "@id": breadcrumbId,
            itemListElement: trail.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url,
            })),
          },
        ]
      : []),
    ...extra,
  ]);
}

/**
 * "Ballina" / "Home" for the first breadcrumb. Kept here rather than passed in
 * from every caller, since it is the same word on every page of a locale.
 */
const HOME_CRUMB: Record<Locale, string> = { sq: "Ballina", en: "Home" };
function homeCrumb(locale: Locale): string {
  return HOME_CRUMB[locale];
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * A treatment, described twice over on purpose.
 *
 * `MedicalProcedure` is what the treatment *is* and carries the clinical
 * detail; `Service` is what the clinic *offers* and is the type that takes an
 * offer catalogue and a provider. Search engines read the two differently, and
 * both are true of the same page, so both are published and linked by `@id`.
 */
export function treatmentSchema(service: Service, locale: Locale) {
  const url = absoluteUrl(`${path(locale, "/services")}/${service.slug}`);
  const procedureId = `${url}#procedure`;
  const body = service.body.map((paragraph) => paragraph[locale]).join(" ");
  const group = priceGroups.find((g) => g.id === service.priceGroupId);
  const prices = group?.items.map((item) => item.price) ?? [];

  return {
    procedureId,
    nodes: [
      {
        "@type": "MedicalProcedure",
        "@id": procedureId,
        name: service.title[locale],
        alternateName: service.title[locale === "sq" ? "en" : "sq"],
        description: service.summary[locale],
        url,
        inLanguage: language(locale),
        /* No `procedureType`: the eight areas span everything from a check-up
           to implant surgery, so neither of schema.org's two values would be
           true of the whole page. */
        howPerformed: body,
        provider: { "@id": CLINIC_ID },
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        serviceType: service.title[locale],
        name: service.title[locale],
        description: service.summary[locale],
        url,
        provider: { "@id": CLINIC_ID },
        ...(areaServed() ? { areaServed: areaServed() } : {}),
        hasOfferCatalog: serviceOfferCatalog(service, locale),
        ...(prices.length > 0
          ? {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "EUR",
                lowPrice: Math.min(...prices),
                highPrice: Math.max(...prices),
                offerCount: prices.length,
              },
            }
          : {}),
      },
    ],
  };
}

/**
 * The dental-implant page.
 *
 * Its `MedicalProcedure` is narrower than the eight areas of treatment — an
 * implant genuinely is a surgical procedure, so unlike `treatmentSchema` this
 * one can state a `procedureType` truthfully. The stages come from the page's
 * own copy, and the offers from the clinic's price sheet, so the structured
 * data and the visible page say the same thing.
 */
export function implantsSchema(locale: Locale, url: string) {
  const procedureId = `${url}#procedure`;
  const dict = implantCopy(locale);
  const prices = implantPrices();

  return {
    procedureId,
    nodes: [
      {
        "@type": "MedicalProcedure",
        "@id": procedureId,
        name: dict.name,
        alternateName: dict.alternateName,
        description: dict.description,
        url,
        inLanguage: language(locale),
        procedureType: "https://schema.org/SurgicalProcedure",
        bodyLocation: dict.bodyLocation,
        provider: { "@id": CLINIC_ID },
        howPerformed: dict.stages.map((stage) => stage.detail).join(" "),
        preparation: dict.preparation,
        followup: dict.followup,
      },
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: dict.name,
        serviceType: dict.name,
        description: dict.description,
        url,
        provider: { "@id": CLINIC_ID },
        ...(areaServed() ? { areaServed: areaServed() } : {}),
        ...(prices.length > 0
          ? {
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: dict.name,
                itemListElement: prices.map((item) => ({
                  "@type": "Offer",
                  name: item.name[locale],
                  price: item.price,
                  priceCurrency: "EUR",
                  availableAtOrFrom: { "@id": CLINIC_ID },
                  itemOffered: {
                    "@type": "MedicalProcedure",
                    name: item.name[locale],
                  },
                })),
              },
            }
          : {}),
      },
    ],
  };
}

/**
 * The few strings the implant structured data needs that are not on the page
 * verbatim — the schema-only fields. Kept beside the schema rather than in the
 * dictionaries, which describe what is rendered.
 */
function implantCopy(locale: Locale) {
  const stages = [
    {
      detail:
        locale === "sq"
          ? "Ekzaminimi dhe imazhet diagnostikuese përcaktojnë nëse implanti është i mundur."
          : "An examination and diagnostic imaging determine whether an implant is possible.",
    },
    {
      detail:
        locale === "sq"
          ? "Implanti prej titani vendoset në kockën e nofullës me anestezi lokale, në ambient steril."
          : "The titanium implant is placed in the jawbone under local anaesthetic, in a sterile setting.",
    },
    {
      detail:
        locale === "sq"
          ? "Pas një periudhe shërimi gjatë së cilës kocka lidhet me implantin, mbi të fiksohet kurora."
          : "After a healing period during which the bone bonds to the implant, the crown is fitted on top.",
    },
  ];

  if (locale === "sq") {
    return {
      name: "Implante dentare",
      alternateName: ["Implanti dentar", "Implantologji", "Dental implant"],
      description:
        "Zëvendësimi i rrënjës së një dhëmbi që mungon me një rrënjë artificiale prej titani, mbi të cilën fiksohet kurora. Trajtimi zhvillohet në faza.",
      bodyLocation: "Nofulla",
      preparation:
        "Konsultë me ekzaminim të gojës dhe imazhe diagnostikuese për të vlerësuar kockën në vendin e implantit.",
      followup:
        "Kontrolle gjatë periudhës së shërimit, pastrim profesional dhe kujdes i rregullt në shtëpi.",
      stages,
    };
  }

  return {
    name: "Dental implants",
    alternateName: ["Dental implant", "Implantology", "Implante dentare"],
    description:
      "Replacing the root of a missing tooth with an artificial titanium root, onto which the crown is fixed. Treatment happens in stages.",
    bodyLocation: "Jaw",
    preparation:
      "A consultation with an examination of the mouth and diagnostic imaging to assess the bone at the implant site.",
    followup:
      "Check-ups through the healing period, professional cleaning and regular care at home.",
    stages,
  };
}
