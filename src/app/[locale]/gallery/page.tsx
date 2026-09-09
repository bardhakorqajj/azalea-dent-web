import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/CtaBand";
import { Gallery } from "@/components/sections/Gallery";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { galleryOrder, photos, workPhotos } from "@/content/images";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { getPublicDictionary } from "@/lib/public/dictionary";
import { photosOfKind, publicGalleryPhotos } from "@/lib/public/gallery";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return pageMetadata({
    locale,
    page: "/gallery",
    title: dict.meta.galleryTitle,
    description: dict.meta.galleryDescription,
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, uploaded] = await Promise.all([
    getPublicDictionary(locale),
    publicGalleryPhotos(),
  ]);

  /* The site's own photography, extended by whatever the clinic has published.
     Additive on purpose: the rooms shot for the site are the gallery's
     foundation, and an upload adds to it rather than replacing it. */
  const clinicPhotos = [
    ...galleryOrder.map((key) => photos[key]),
    ...photosOfKind(uploaded, "clinic"),
    ...photosOfKind(uploaded, "other"),
  ];
  const treatmentPhotos = [...workPhotos, ...photosOfKind(uploaded, "work")];

  return (
    <>
      {/* Each set carries its own heading directly above its photographs, so
          the two read as two galleries rather than a page title followed by a
          loose strip. The top padding stands in for the page header this
          replaced, clearing the fixed site header. */}
      <Section
        surface="bone"
        spacing="none"
        className="pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-28"
      >
        <Container>
          <SectionHeading
            as="h1"
            title={dict.gallery.title}
            lead={dict.gallery.pageLead}
            className="mb-12"
          />
          <Gallery
            locale={locale}
            dict={dict}
            items={clinicPhotos}
            label={dict.gallery.title}
          />
        </Container>
      </Section>

      {/* Treatment photographs, shown only once there are real ones. */}
      {treatmentPhotos.length > 0 && (
        <Section surface="bone-warm">
          <Container>
            <SectionHeading
              title={dict.work.title}
              lead={dict.work.lead}
              className="mb-12"
            />
            <Gallery
              locale={locale}
              dict={dict}
              items={treatmentPhotos}
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
        data={pageSchema({
          locale,
          url: absoluteUrl(path(locale, "/gallery")),
          name: dict.meta.galleryTitle,
          description: dict.meta.galleryDescription,
          breadcrumbs: [
            { name: dict.nav.gallery, url: absoluteUrl(path(locale, "/gallery")) },
          ],
        })}
      />
    </>
  );
}
