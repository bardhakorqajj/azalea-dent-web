import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/images";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function WhyUs({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.operatoryDaylight;

  return (
    <Section surface="ink" className="surface-grain">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt[locale]}
                placeholder="blur"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="h-full w-full object-cover"
                style={{ objectPosition: photo.focus }}
              />
            </div>
          </Reveal>

          <div className="lg:col-span-7 lg:pl-6">
            <Reveal>
              <SectionHeading
                eyebrow={dict.why.eyebrow}
                title={dict.why.title}
                tone="dark"
              />
            </Reveal>

            <ol className="mt-12 border-t border-bone-100/12">
              {dict.why.items.map((item, index) => (
                <li key={item.title} className="border-b border-bone-100/12">
                  <Reveal delay={Math.min(index * 60, 220)}>
                    <div className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-x-6">
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.9rem] text-gold-400 tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-[1.25rem] leading-snug text-bone-50">
                          {item.title}
                        </h3>
                        <p className="mt-2.5 max-w-xl text-[0.95rem] leading-relaxed text-bone-200/70">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}
