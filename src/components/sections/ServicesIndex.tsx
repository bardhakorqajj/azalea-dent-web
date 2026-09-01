import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/content/services";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type ServicesIndexProps = {
  locale: Locale;
  dict: Dictionary;
  /** `page` drops the section CTA and uses an h1-level heading elsewhere. */
  variant?: "home" | "page";
  /** Hide one slug — used on a treatment page to list the others. */
  exclude?: string;
  title?: string;
  lead?: string;
  eyebrow?: string;
  /** Shows a link to the price list beneath the heading. */
  pricesHref?: string;
};

/**
 * The treatments presented as a numbered index rather than a grid of cards:
 * eight rows separated by hairlines, with the heading pinned alongside on
 * desktop. It reads like a contents page, which suits eight items far better
 * than eight boxes.
 */
export function ServicesIndex({
  locale,
  dict,
  variant = "home",
  exclude,
  title,
  lead,
  eyebrow,
  pricesHref,
}: ServicesIndexProps) {
  const items = services.filter((service) => service.slug !== exclude);

  return (
    <Section id="services" surface="bone">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <SectionHeading
                  eyebrow={eyebrow ?? dict.services.eyebrow}
                  title={title ?? dict.services.title}
                  lead={lead ?? dict.services.lead}
                >
                  {variant === "home" && (
                    <ButtonLink href={path(locale, "/services")} variant="secondary">
                      {dict.actions.allTreatments}
                    </ButtonLink>
                  )}
                  {pricesHref && (
                    <ButtonLink href={pricesHref} variant="secondary">
                      {dict.actions.viewPrices}
                    </ButtonLink>
                  )}
                </SectionHeading>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-ink-900/12">
              {items.map((service, index) => (
                <li key={service.slug} className="border-b border-ink-900/12">
                  <Reveal delay={Math.min(index * 40, 200)}>
                    <Link
                      href={`${path(locale, "/services")}/${service.slug}`}
                      className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-7 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-x-6 sm:py-8"
                    >
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.9rem] text-gold-700 tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="min-w-0">
                        <span className="block font-display text-[1.4rem] leading-snug text-ink-900 transition-transform duration-500 group-hover:translate-x-1 sm:text-[1.6rem]">
                          {service.title[locale]}
                        </span>
                        <span className="mt-2 block max-w-xl text-[0.95rem] leading-relaxed text-ink-500">
                          {service.summary[locale]}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className="self-center text-ink-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-gold-500"
                      >
                        &rarr;
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
