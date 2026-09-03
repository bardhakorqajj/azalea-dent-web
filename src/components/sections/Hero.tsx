import Image from "next/image";
import Link from "next/link";

import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { ButtonLink } from "@/components/ui/Button";
import { photos } from "@/content/images";
import { services } from "@/content/services";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Editorial split hero: the proposition is set as type on the bone surface and
 * the clinic's own treatment room runs full-bleed down the right edge. Keeping
 * the two apart means no text ever sits on a photograph, which holds contrast
 * at every screen size.
 */
export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.operatoryOak;

  /* Three treatments surfaced as a quick index into the services page. */
  const featured = services.filter((service) =>
    ["kirurgji-orale", "protetike", "estetike-dentare"].includes(service.slug),
  );

  return (
    <section className="relative bg-bone-50 pt-20 lg:pt-24 dark:bg-ink-950">
      <div className="mx-auto grid w-full max-w-[100rem] items-stretch lg:grid-cols-12">
        <div className="order-2 flex flex-col justify-center px-6 py-14 sm:px-8 sm:py-20 lg:order-1 lg:col-span-6 lg:py-32 lg:pr-16 lg:pl-12 xl:col-span-6">
          <p className="eyebrow flex items-center gap-3 text-gold-700 dark:text-gold-400">
            <AzaleaMark
              className="h-6 w-6 shrink-0 text-gold-500 dark:text-gold-400"
              weight={3.6}
            />
            {dict.hero.eyebrow}
          </p>

          <h1 className="mt-7 max-w-xl text-[2.6rem] leading-[1.05] text-ink-900 sm:text-[3.4rem] lg:text-[3.9rem] xl:text-[4.4rem] dark:text-bone-50">
            {dict.hero.title}
          </h1>

          <p className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-ink-600 dark:text-bone-300">
            {dict.hero.lead}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={path(locale, "/appointment")} withArrow>
              {dict.actions.bookAppointment}
            </ButtonLink>
            <ButtonLink href={path(locale, "/services")} variant="secondary">
              {dict.actions.seeTreatments}
            </ButtonLink>
          </div>

          <ul className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink-900/10 pt-7 dark:border-bone-100/12">
            {featured.map((service, index) => (
              <li key={service.slug} className="flex items-center gap-4">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-3 w-px bg-ink-900/15 dark:bg-bone-100/20"
                  />
                )}
                <Link
                  href={`${path(locale, "/services")}/${service.slug}`}
                  className="text-[0.8rem] tracking-wide text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline hover:decoration-gold-500 dark:text-bone-300 dark:hover:text-bone-50"
                >
                  {service.title[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative order-1 lg:order-2 lg:col-span-6 xl:col-span-6">
          <div className="relative h-[58vw] max-h-[34rem] min-h-[20rem] w-full sm:h-[50vw] lg:h-full lg:max-h-none">
            <Image
              src={photo.src}
              alt={photo.alt[locale]}
              placeholder="blur"
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full object-cover"
              style={{ objectPosition: photo.focus }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950/70 to-transparent"
            />
            <p className="absolute bottom-5 left-5 text-[0.65rem] tracking-[0.18em] text-bone-50 uppercase lg:bottom-8 lg:left-8">
              {dict.hero.imageCaption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
