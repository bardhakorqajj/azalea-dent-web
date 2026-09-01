import Image from "next/image";

import { ContactChannelList } from "@/components/layout/ContactChannels";
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
      <h2 className="font-display text-[1.6rem] text-ink-900">
        {dict.contact.infoTitle}
      </h2>

      <div className="mt-8">
        <h3 className="eyebrow text-ink-500">{dict.visit.addressTitle}</h3>
        {address ? (
          <address className="mt-3 text-[1rem] leading-relaxed text-ink-800 not-italic">
            {address}
          </address>
        ) : (
          <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-500">
            {dict.visit.addressPending}
          </p>
        )}
        {clinic.mapsUrl && (
          <a
            href={clinic.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[0.88rem] text-ink-900 underline underline-offset-4 hover:text-gold-500"
          >
            {dict.actions.directions}
          </a>
        )}
      </div>

      <div className="mt-9">
        <h3 className="eyebrow text-ink-500">{dict.visit.hoursTitle}</h3>
        {hasHours ? (
          <dl className="mt-3 space-y-2 text-[0.98rem]">
            {clinic.hours.map((rule) => (
              <div
                key={rule.days.join("-")}
                className="flex justify-between gap-6 border-b border-ink-900/8 pb-2"
              >
                <dt className="text-ink-600">{formatDayRange(rule.days, locale)}</dt>
                <dd className="text-ink-900 tabular-nums">
                  {formatHours(rule, dict.visit.closed)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-500">
            {dict.visit.hoursPending}
          </p>
        )}
      </div>

      <div className="mt-9">
        <h3 className="eyebrow text-ink-500">{dict.visit.contactTitle}</h3>
        <ContactChannelList dict={dict} className="mt-2 border-t border-ink-900/10" />
        {!clinic.phone && (
          <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-500">
            {dict.visit.contactPending}
          </p>
        )}
      </div>

      {showMap && (
        <div className="mt-10">
          {clinic.mapsEmbedUrl ? (
            <iframe
              src={clinic.mapsEmbedUrl}
              title={`${clinic.name} — ${dict.visit.addressTitle}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full border border-ink-900/12"
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
              <figcaption className="mt-3 text-[0.85rem] text-ink-500">
                {dict.visit.mapUnavailable}
              </figcaption>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}
