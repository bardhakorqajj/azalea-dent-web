import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/images";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function GalleryPreview({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const wide = photos.facadeNight;
  const left = photos.reception;
  const right = photos.glassDetail;

  return (
    <Section surface="bone-warm">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <SectionHeading
                eyebrow={dict.gallery.eyebrow}
                title={dict.gallery.title}
                lead={dict.gallery.lead}
              >
                <ButtonLink href={path(locale, "/gallery")} variant="secondary">
                  {dict.actions.viewGallery}
                </ButtonLink>
              </SectionHeading>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal>
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image
                  src={wide.src}
                  alt={wide.alt[locale]}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: wide.focus }}
                />
              </div>
            </Reveal>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6">
              <Reveal delay={80}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={left.src}
                    alt={left.alt[locale]}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: left.focus }}
                  />
                </div>
              </Reveal>
              <Reveal delay={160} className="sm:mt-12">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={right.src}
                    alt={right.alt[locale]}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: right.focus }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
