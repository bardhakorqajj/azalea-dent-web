import Image from "next/image";

import {
  ContactChannelList,
  MessagingLinks,
} from "@/components/layout/ContactChannels";
import { clinic, formatAddress } from "@/content/clinic";
import { photos } from "@/content/images";
import { formatDayRange, formatHours } from "@/lib/hours";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Address, opening hours, contact channels and the map, on whatever is known. */
export function ClinicDetails({
  locale,
  dict,
  showMap = true,
}: {
  locale: Locale;
  dict: Dictionary;
  showMap?: boolean;
}) {
  const address = formatAddress();
  const hasHours = clinic.hours.length > 0;

  return (
    <div>
      <h2 className="font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
        {dict.contact.infoTitle}
      </h2>

      <div className="mt-8">
        <h3 className="eyebrow text-ink-500 dark:text-bone-300">
          {dict.visit.addressTitle}
        </h3>
        {address ? (
          <address className="mt-3 text-[1rem] leading-relaxed text-ink-800 not-italic dark:text-bone-100">
            {address}
          </address>
        ) : (
          <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-500 dark:text-bone-300">
            {dict.visit.addressPending}
          </p>
        )}
        {clinic.mapsUrl && (
          <a
            href={clinic.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[0.88rem] text-ink-900 underline underline-offset-4 hover:text-gold-500 dark:text-bone-50 dark:hover:text-gold-400"
          >
            {dict.actions.directions}
          </a>
        )}
      </div>

      <div className="mt-9">
        <h3 className="eyebrow text-ink-500 dark:text-bone-300">
          {dict.visit.hoursTitle}
        </h3>
        {hasHours ? (
          <dl className="mt-3 space-y-2 text-[0.98rem]">
            {clinic.hours.map((rule) => (
              <div
                key={rule.days.join("-")}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 border-b border-ink-900/8 pb-2 dark:border-bone-100/10"
              >
                <dt className="whitespace-nowrap text-ink-600 dark:text-bone-300">
                  {formatDayRange(rule.days, locale)}
                </dt>
                <dd className="whitespace-nowrap text-ink-900 tabular-nums dark:text-bone-50">
                  {formatHours(rule, dict.visit.closed)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-500 dark:text-bone-300">
            {dict.visit.hoursPending}
          </p>
        )}
      </div>

      <div className="mt-9">
        <h3 className="eyebrow text-ink-500 dark:text-bone-300">
          {dict.visit.contactTitle}
        </h3>
        <ContactChannelList
          dict={dict}
          className="mt-2 border-t border-ink-900/10 dark:border-bone-100/12"
        />
        {clinic.phones.length === 0 && (
          <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-500 dark:text-bone-300">
            {dict.visit.contactPending}
          </p>
        )}
        <h3 className="eyebrow mt-8 text-ink-500 dark:text-bone-300">
          {dict.visit.messagingTitle}
        </h3>
        <MessagingLinks dict={dict} className="mt-4" />
      </div>

      {showMap && (
        <div className="mt-10">
          {clinic.mapsEmbedUrl ? (
            <iframe
              src={clinic.mapsEmbedUrl}
              title={`${clinic.name}, ${dict.visit.addressTitle}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full border border-ink-900/12 dark:border-bone-100/12"
            />
          ) : (
            <figure>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={photos.facadeNight.src}
                  alt={photos.facadeNight.alt[locale]}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: photos.facadeNight.focus }}
                />
              </div>
              <figcaption className="mt-3 text-[0.85rem] text-ink-500 dark:text-bone-300">
                {dict.visit.mapUnavailable}
              </figcaption>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}
