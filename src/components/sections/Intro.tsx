import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/images";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function Intro({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.reception;

  return (
    <Section surface="bone-warm">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt[locale]}
                placeholder="blur"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-full w-full object-cover"
                style={{ objectPosition: photo.focus }}
              />
            </div>
          </Reveal>

          <div className="lg:col-span-6 lg:pl-6">
            <Reveal>
              <SectionHeading
                eyebrow={dict.intro.eyebrow}
                title={dict.intro.title}
              />
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-600">
                {dict.intro.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <dl className="mt-10 flex gap-12 border-t border-ink-900/10 pt-8">
                {dict.intro.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block font-display text-[2.6rem] leading-none text-ink-900">
                        {stat.value}
                      </span>
                      <span className="eyebrow mt-3 block text-ink-500">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <ButtonLink
                href={path(locale, "/about")}
                variant="secondary"
                className="mt-10"
              >
                {dict.actions.learnMore}
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
