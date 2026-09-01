import { clinic } from "@/content/clinic";
import { services } from "@/content/services";
import { openingHoursSchema } from "@/lib/hours";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { path } from "@/i18n/config";

/**
 * Structured data for the clinic. Only fields that are actually known are
 * emitted — an incomplete but truthful record is far better than a complete
 * invented one, and Google penalises the latter.
 */
export function dentistSchema(locale: Locale) {
  const hours = openingHoursSchema();

  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${siteUrl()}#clinic`,
    name: clinic.name,
    alternateName: `${clinic.name} ${clinic.descriptor}`,
    url: absoluteUrl(path(locale)),
    image: absoluteUrl("/opengraph-image"),
    ...(clinic.phones.length > 0 ? { telephone: clinic.phones } : {}),
    ...(clinic.email ? { email: clinic.email } : {}),
    ...(clinic.foundingYear ? { foundingDate: String(clinic.foundingYear) } : {}),
    ...(clinic.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: clinic.address.street,
            addressLocality: clinic.address.locality,
            ...(clinic.address.region ? { addressRegion: clinic.address.region } : {}),
            ...(clinic.address.postalCode
              ? { postalCode: clinic.address.postalCode }
              : {}),
            addressCountry: clinic.address.country,
          },
        }
      : {}),
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
    sameAs: [
      clinic.social.instagram.url,
      clinic.social.facebook,
      clinic.social.tiktok,
    ].filter((value): value is string => Boolean(value)),
    availableService: services.map((service) => ({
      "@type": "MedicalProcedure",
      name: service.title[locale],
      description: service.summary[locale],
      url: absoluteUrl(`${path(locale, "/services")}/${service.slug}`),
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
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

export function serviceSchema(
  name: string,
  description: string,
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name,
    description,
    url,
    provider: { "@id": `${siteUrl()}#clinic` },
  };
}
