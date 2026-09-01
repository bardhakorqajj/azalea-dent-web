import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClinicDetails } from "@/components/sections/ClinicDetails";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Section } from "@/components/ui/Section";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return {
    title: dict.contact.title,
    description: dict.meta.contactDescription,
    alternates: {
      canonical: path(locale, "/contact"),
      languages: { sq: "/sq/contact", en: "/en/contact" },
    },
    openGraph: {
      title: `${dict.contact.title} | Azalea Dent`,
      description: dict.meta.contactDescription,
      url: absoluteUrl(path(locale, "/contact")),
    },
  };
}

export default async function ContactPage({
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
        eyebrow={dict.contact.eyebrow}
        title={dict.contact.title}
        lead={dict.contact.lead}
        breadcrumbs={[{ href: path(locale, "/contact"), label: dict.nav.contact }]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-display text-[1.6rem] text-ink-900">
                {dict.contact.formTitle}
              </h2>
              <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-ink-600">
                {dict.appointment.lead}
              </p>
              <div className="mt-9">
                <AppointmentForm locale={locale} dict={dict} />
              </div>
            </div>

            <div className="lg:col-span-5">
              <ClinicDetails locale={locale} dict={dict} />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          { name: dict.contact.title, url: absoluteUrl(path(locale, "/contact")) },
        ])}
      />
    </>
  );
}
