import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/images";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Full-bleed split panel like the hero and the intro, with the photograph on
 * the opposite side so the page alternates rather than stacking three
 * identical layouts.
 */
export function WhyUs({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.operatoryDaylight;

  return (
    <section
      data-surface="dark"
      className="surface-grain bg-ink-950 text-bone-100"
    >
      <div className="grid lg:grid-cols-2">
        <div className="relative h-[62vw] max-h-[34rem] min-h-[18rem] w-full lg:order-2 lg:h-full lg:max-h-none lg:min-h-[34rem]">
          <Image
            src={photo.src}
            alt={photo.alt[locale]}
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover"
            style={{ objectPosition: photo.focus }}
          />
        </div>

        <div className="flex items-center px-6 py-16 sm:px-10 lg:order-1 lg:px-16 lg:py-24 xl:px-24">
          <div className="w-full">
            <Reveal>
              <SectionHeading
                eyebrow={dict.why.eyebrow}
                title={dict.why.title}
                tone="dark"
              />
            </Reveal>

            <ol className="mt-11 border-t border-bone-100/12">
              {dict.why.items.map((item, index) => (
                <li key={item.title} className="border-b border-bone-100/12">
                  <Reveal delay={Math.min(index * 60, 220)}>
                    <div className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-x-6">
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.9rem] text-gold-400 tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-[1.2rem] leading-snug text-bone-50">
                          {item.title}
                        </h3>
                        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-bone-200/70">
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
      </div>
    </section>
  );
}
