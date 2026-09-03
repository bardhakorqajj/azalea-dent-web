import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/images";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Full-bleed split panel, matching the hero: the photograph runs to the page
 * edge and fills the height of the section rather than sitting inside the
 * container with margin around it.
 */
export function Intro({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.reception;

  return (
    <section id="about" className="bg-bone-100">
      <div className="grid lg:grid-cols-2">
        <div className="relative h-[62vw] max-h-[34rem] min-h-[18rem] w-full lg:h-full lg:max-h-none lg:min-h-[34rem]">
          <Image
            src={photo.src}
            alt={photo.alt[locale]}
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover"
            style={{ objectPosition: photo.focus }}
          />
        </div>

        <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24 xl:px-24">
          <div className="w-full">
            <Reveal>
              <SectionHeading eyebrow={dict.intro.eyebrow} title={dict.intro.title} />
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-600">
                {dict.intro.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140}>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-ink-900/10 pt-8">
                {dict.intro.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block font-display text-[1.9rem] leading-none whitespace-nowrap text-ink-900 sm:text-[2.4rem]">
                        {stat.value}
                      </span>
                      <span className="eyebrow mt-3 block text-ink-500">{stat.label}</span>
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
      </div>
    </section>
  );
}
