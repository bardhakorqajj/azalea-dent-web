import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ContactChannelList,
  MessagingLinks,
} from "@/components/layout/ContactChannels";
import { Faq } from "@/components/sections/Faq";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
import { clinic } from "@/content/clinic";
import { formatDayRange, formatHours } from "@/lib/hours";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl, languageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return {
    title: dict.appointment.title,
    description: dict.meta.appointmentDescription,
    alternates: {
      canonical: path(locale, "/appointment"),
      languages: languageAlternates("/appointment"),
    },
    openGraph: {
      title: `${dict.appointment.title} | Azalea Dent`,
      description: dict.meta.appointmentDescription,
      url: absoluteUrl(path(locale, "/appointment")),
    },
  };
}

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.appointment.eyebrow}
        title={dict.appointment.title}
        lead={dict.appointment.lead}
        breadcrumbs={[
          { href: path(locale, "/appointment"), label: dict.nav.appointment },
        ]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <AppointmentForm locale={locale} dict={dict} />
            </div>

            <aside className="lg:col-span-5">
              <div className="border border-ink-900/12 bg-bone-100 p-7 sm:p-9 dark:border-bone-100/12 dark:bg-ink-900">
                <h2 className="font-display text-[1.5rem] text-ink-900 dark:text-bone-50">
                  {dict.appointment.directTitle}
                </h2>
                <ContactChannelList
                  dict={dict}
                  className="mt-5 border-t border-ink-900/10 dark:border-bone-100/12"
                />
                <MessagingLinks dict={dict} className="mt-6" />

                {clinic.hours.length > 0 && (
                  <div className="mt-8">
                    <h3 className="eyebrow text-ink-500 dark:text-bone-300">
                      {dict.visit.hoursTitle}
                    </h3>
                    <dl className="mt-3 space-y-2 text-[0.95rem]">
                      {clinic.hours.map((rule) => (
                        <div
                          key={rule.days.join("-")}
                          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5"
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
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Faq dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          {
            name: dict.appointment.title,
            url: absoluteUrl(path(locale, "/appointment")),
          },
        ])}
      />
    </>
  );
}
