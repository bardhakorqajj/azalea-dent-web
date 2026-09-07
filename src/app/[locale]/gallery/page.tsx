import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Gallery } from "@/components/sections/Gallery";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { workPhotos } from "@/content/images";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl, languageAlternates } from "@/lib/site";

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
      languages: languageAlternates("/gallery"),
    },
    openGraph: {
      title: `${dict.gallery.title} | Azalea Dent`,
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
        breadcrumbs={[
          { href: path(locale, "/gallery"), label: dict.nav.gallery },
        ]}
      />

      <Section surface="bone">
        <Container>
          <Gallery locale={locale} dict={dict} />
        </Container>
      </Section>

      {/* Treatment photographs, shown only once there are real ones. */}
      {workPhotos.length > 0 && (
        <Section surface="bone-warm">
          <Container>
            <SectionHeading
              eyebrow={dict.work.eyebrow}
              title={dict.work.title}
              lead={dict.work.lead}
              className="mb-12"
            />
            <Gallery
              locale={locale}
              dict={dict}
              items={workPhotos}
              label={dict.work.title}
              /* Before/after pairs are stacked vertically and carry the
                 clinic's watermark, so the tile holds the whole frame
                 rather than cropping to a landscape shape. */
              aspect="aspect-[9/10]"
              fit="object-contain"
            />
          </Container>
        </Section>
      )}

      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          {
            name: dict.gallery.title,
            url: absoluteUrl(path(locale, "/gallery")),
          },
        ])}
      />
    </>
  );
}
