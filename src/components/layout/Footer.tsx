import Link from "next/link";

import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { Container } from "@/components/ui/Container";
import {
  ContactChannelList,
  MessagingLinks,
} from "@/components/layout/ContactChannels";
import { clinic, formatAddress } from "@/content/clinic";
import { services } from "@/content/services";
import { formatDayRange, formatHours } from "@/lib/hours";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const address = formatAddress();
  const year = new Date().getFullYear();

  const clinicLinks = [
    { href: path(locale, "/prices"), label: dict.nav.prices },
    { href: path(locale, "/about"), label: dict.nav.about },
    { href: path(locale, "/gallery"), label: dict.nav.gallery },
    { href: path(locale, "/contact"), label: dict.nav.contact },
    { href: path(locale, "/appointment"), label: dict.nav.appointment },
  ];

  return (
    <footer className="surface-grain bg-ink-950 text-bone-100" data-surface="dark">
      <Container className="py-16 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <span className="flex items-center gap-3.5">
              <AzaleaMark className="h-11 w-11 text-gold-400" />
              <span className="flex flex-col leading-none">
                <span className="text-[1.05rem] font-semibold tracking-[0.16em] uppercase">
                  {clinic.name}
                </span>
                <span className="mt-1.5 text-[0.55rem] tracking-[0.32em] text-bone-300/60 uppercase">
                  {clinic.descriptor}
                </span>
              </span>
            </span>

            {address && (
              <p className="mt-7 max-w-xs text-[0.95rem] leading-relaxed text-bone-200/70">
                {address}
              </p>
            )}

            {clinic.hours.length > 0 && (
              <dl className="mt-7 space-y-1.5 text-[0.9rem] text-bone-200/70">
                {clinic.hours.map((rule) => (
                  <div
                    key={rule.days.join("-")}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5"
                  >
                    <dt className="min-w-36 whitespace-nowrap">
                      {formatDayRange(rule.days, locale)}
                    </dt>
                    <dd className="whitespace-nowrap text-bone-100 tabular-nums">
                      {formatHours(rule, dict.visit.closed)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <nav className="lg:col-span-3" aria-labelledby="footer-treatments">
            <h2 id="footer-treatments" className="eyebrow font-sans text-gold-400">
              {dict.footer.treatments}
            </h2>
            <ul className="mt-6 space-y-3">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`${path(locale, "/services")}/${service.slug}`}
                    className="text-[0.95rem] text-bone-200/75 transition-colors hover:text-gold-300"
                  >
                    {service.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="lg:col-span-2" aria-labelledby="footer-clinic">
            <h2 id="footer-clinic" className="eyebrow font-sans text-gold-400">
              {dict.footer.clinic}
            </h2>
            <ul className="mt-6 space-y-3">
              {clinicLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.95rem] text-bone-200/75 transition-colors hover:text-gold-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow font-sans text-gold-400">{dict.footer.contact}</h2>
            <ContactChannelList dict={dict} tone="dark" className="mt-3" />
            <h2 className="eyebrow mt-8 font-sans text-gold-400">
              {dict.visit.messagingTitle}
            </h2>
            <MessagingLinks dict={dict} tone="dark" className="mt-4" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-bone-100/12 pt-8 text-[0.8rem] text-bone-300/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {clinic.name}. {dict.footer.rights}
          </p>
          <p>{dict.footer.credit}</p>
        </div>
      </Container>
    </footer>
  );
}
