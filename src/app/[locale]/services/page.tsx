import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/CtaBand";
import { ServicesIndex } from "@/components/sections/ServicesIndex";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/ui/JsonLd";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return {
    title: dict.services.pageTitle,
    description: dict.meta.servicesDescription,
    alternates: {
      canonical: path(locale, "/services"),
      languages: { sq: "/sq/services", en: "/en/services" },
    },
    openGraph: {
      title: `${dict.services.pageTitle} — Azalea Dent`,
      description: dict.meta.servicesDescription,
      url: absoluteUrl(path(locale, "/services")),
    },
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.services.eyebrow}
        title={dict.services.pageTitle}
        lead={dict.services.pageLead}
        breadcrumbs={[
          { href: path(locale, "/services"), label: dict.nav.services },
        ]}
      />

      <ServicesIndex
        locale={locale}
        dict={dict}
        variant="page"
        eyebrow={dict.services.eyebrow}
        title={dict.services.title}
        lead={dict.services.lead}
      />

      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          {
            name: dict.services.pageTitle,
            url: absoluteUrl(path(locale, "/services")),
          },
        ])}
      />
    </>
  );
}
