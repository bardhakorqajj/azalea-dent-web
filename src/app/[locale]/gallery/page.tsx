import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Gallery } from "@/components/sections/Gallery";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
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
    title: dict.gallery.title,
    description: dict.meta.galleryDescription,
    alternates: {
      canonical: path(locale, "/gallery"),
      languages: { sq: "/sq/gallery", en: "/en/gallery" },
    },
    openGraph: {
      title: `${dict.gallery.title} — Azalea Dent`,
      description: dict.meta.galleryDescription,
      url: absoluteUrl(path(locale, "/gallery")),
    },
  };
}

export default async function GalleryPage({
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
        eyebrow={dict.gallery.eyebrow}
        title={dict.gallery.title}
        lead={dict.gallery.pageLead}
        breadcrumbs={[{ href: path(locale, "/gallery"), label: dict.nav.gallery }]}
      />

      <Section surface="bone">
        <Container>
          <Gallery locale={locale} dict={dict} />
        </Container>
      </Section>

      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          { name: dict.gallery.title, url: absoluteUrl(path(locale, "/gallery")) },
        ])}
      />
    </>
  );
}
