import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import {
  ChannelIconLinks,
  ContactChannelList,
} from "@/components/layout/ContactChannels";
import { Reveal } from "@/components/ui/Reveal";
import { clinic, formatAddress } from "@/content/clinic";
import { photos } from "@/content/images";
import { formatDayRange, formatHours } from "@/lib/hours";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Full-bleed split band: the clinic's own shopfront on one side, the practical
 * details of visiting on the other. Address and opening hours appear only once
 * they are set in `content/clinic.ts`.
 */
export function VisitBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const photo = photos.facadeNight;
  const address = formatAddress();
  const hasHours = clinic.hours.length > 0;

  return (
    <section
      id="contact"
      data-surface="dark"
      className="surface-grain bg-ink-950 text-bone-100"
    >
      <div className="grid lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[3/2] w-full lg:self-center">
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
          <Reveal className="w-full">
            <p className="eyebrow flex items-center gap-3 text-gold-400">
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
              {dict.visit.eyebrow}
            </p>
            <h2 className="mt-5 text-[2rem] leading-[1.12] text-bone-50 sm:text-[2.5rem]">
              {dict.visit.title}
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-bone-200/75">
              {dict.visit.lead}
            </p>

            <div className="mt-10 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-12">
              <div>
                <h3 className="eyebrow font-sans text-bone-300/60">
                  {dict.visit.addressTitle}
                </h3>
                {address ? (
                  <address className="mt-3 text-[0.98rem] leading-relaxed text-bone-100 not-italic">
                    {address}
                  </address>
                ) : (
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-bone-300/55">
                    {dict.visit.addressPending}
                  </p>
                )}
                {clinic.mapsUrl && (
                  <a
                    href={clinic.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-[0.85rem] text-gold-300 underline underline-offset-4"
                  >
                    {dict.actions.directions}
                  </a>
                )}
              </div>

              <div>
                <h3 className="eyebrow font-sans text-bone-300/60">
                  {dict.visit.hoursTitle}
                </h3>
                {hasHours ? (
                  <dl className="mt-3 space-y-1.5 text-[0.95rem]">
                    {clinic.hours.map((rule) => (
                      <div
                        key={rule.days.join("-")}
                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5"
                      >
                        <dt className="whitespace-nowrap text-bone-200/70">
                          {formatDayRange(rule.days, locale)}
                        </dt>
                        <dd className="whitespace-nowrap text-bone-100 tabular-nums">
                          {formatHours(rule, dict.visit.closed)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-bone-300/55">
                    {dict.visit.hoursPending}
                  </p>
                )}
              </div>
            </div>

            <ContactChannelList dict={dict} tone="dark" className="mt-10 border-t border-bone-100/12" />

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
              <ButtonLink
                href={path(locale, "/appointment")}
                variant="onDark"
                withArrow
              >
                {dict.actions.bookAppointment}
              </ButtonLink>
              <ChannelIconLinks dict={dict} tone="dark" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
