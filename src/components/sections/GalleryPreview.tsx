import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos, type PhotoKey } from "@/content/images";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Three photographs at one size, on one line, in the order you meet the clinic. */
const PREVIEW: PhotoKey[] = ["facadeNight", "reception", "glassDetail"];

export function GalleryPreview({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <Section id="gallery" surface="bone-warm">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow={dict.gallery.eyebrow}
              title={dict.gallery.title}
              lead={dict.gallery.lead}
              className="max-w-xl"
            />
            <ButtonLink
              href={path(locale, "/gallery")}
              variant="secondary"
              className="shrink-0"
            >
              {dict.actions.viewGallery}
            </ButtonLink>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:mt-16 lg:gap-8">
          {PREVIEW.map((key, index) => {
            const photo = photos[key];
            return (
              <Reveal key={key} delay={index * 80}>
                <figure>
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={photo.src}
                      alt={photo.alt[locale]}
                      placeholder="blur"
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="h-full w-full object-cover"
                      style={{ objectPosition: photo.focus }}
                    />
                  </div>
                  <figcaption className="eyebrow mt-3 text-ink-500 dark:text-bone-300">
                    {photo.caption[locale]}
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
