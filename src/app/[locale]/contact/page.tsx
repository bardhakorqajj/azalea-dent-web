import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { MessageForm } from "@/components/forms/MessageForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClinicDetails } from "@/components/sections/ClinicDetails";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { getPublicDictionary } from "@/lib/public/dictionary";
import { publicServices } from "@/lib/public/services";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return pageMetadata({
    locale,
    page: "/contact",
    title: dict.meta.contactTitle,
    description: dict.meta.contactDescription,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, services] = await Promise.all([
    getPublicDictionary(locale),
    publicServices(),
  ]);

  /* Same list the booking page offers; see the note there. */
  const serviceOptions = services.map((service) => ({
    slug: service.slug,
    label: service.title[locale],
  }));

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.contact.eyebrow}
        title={dict.contact.title}
        lead={dict.contact.lead}
        breadcrumbs={[
          { href: path(locale, "/contact"), label: dict.nav.contact },
        ]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                {dict.contact.formTitle}
              </h2>
              <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-ink-600 dark:text-bone-300">
                {dict.appointment.lead}
              </p>
              <div className="mt-9">
                <AppointmentForm
                  locale={locale}
                  dict={dict}
                  options={serviceOptions}
                />
              </div>

              {/* For a visitor who has a question rather than a date in mind.
                  It goes to the clinic's dashboard inbox, where the booking
                  form's requests do not: those are delivered by email and text
                  because they need answering the same day. */}
              <div className="mt-16 border-t border-ink-900/12 pt-12 dark:border-bone-100/12">
                <h2 className="font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                  {dict.message.title}
                </h2>
                <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-ink-600 dark:text-bone-300">
                  {dict.message.lead}
                </p>
                <div className="mt-9">
                  <MessageForm locale={locale} dict={dict} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <ClinicDetails locale={locale} dict={dict} />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={pageSchema({
          locale,
          url: absoluteUrl(path(locale, "/contact")),
          name: dict.meta.contactTitle,
          description: dict.meta.contactDescription,
          breadcrumbs: [
            { name: dict.nav.contact, url: absoluteUrl(path(locale, "/contact")) },
          ],
        })}
      />
    </>
  );
}
