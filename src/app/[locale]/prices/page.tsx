import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { PriceList } from "@/components/sections/PriceList";
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
    title: dict.prices.title,
    description: dict.meta.pricesDescription,
    alternates: {
      canonical: path(locale, "/prices"),
      languages: { sq: "/sq/prices", en: "/en/prices" },
    },
    openGraph: {
      title: `${dict.prices.title} | Azalea Dent`,
      description: dict.meta.pricesDescription,
      url: absoluteUrl(path(locale, "/prices")),
    },
  };
}

export default async function PricesPage({
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
        eyebrow={dict.prices.eyebrow}
        title={dict.prices.title}
        lead={dict.prices.lead}
        breadcrumbs={[{ href: path(locale, "/prices"), label: dict.nav.prices }]}
      />

      <PriceList locale={locale} dict={dict} />
      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          { name: dict.prices.title, url: absoluteUrl(path(locale, "/prices")) },
        ])}
      />
    </>
  );
}
