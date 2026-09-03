import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { ServicesIndex } from "@/components/sections/ServicesIndex";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { PriceGroupTable } from "@/components/sections/PriceList";
import { photos } from "@/content/images";
import { priceGroups } from "@/content/prices";
import { getService, serviceSlugs } from "@/content/services";
import {
  defaultLocale,
  isLocale,
  locales,
  path,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema, serviceSchema } from "@/lib/schema";
import { absoluteUrl, languageAlternates } from "@/lib/site";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    serviceSlugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const service = getService(slug);
  if (!service) return {};

  const url = `${path(locale, "/services")}/${slug}`;

  return {
    title: service.title[locale],
    description: service.summary[locale],
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates(`/services/${slug}`),
      },
    },
    openGraph: {
      title: `${service.title[locale]} | Azalea Dent`,
      description: service.summary[locale],
      url: absoluteUrl(url),
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const service = getService(slug);
  if (!service) notFound();

  const dict = getDictionary(locale);
  const photo = photos.operatoryDaylight;
  const priceGroup = priceGroups.find((group) => group.id === service.priceGroupId);
  const url = absoluteUrl(`${path(locale, "/services")}/${slug}`);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.services.eyebrow}
        title={service.title[locale]}
        lead={service.summary[locale]}
        breadcrumbs={[
          { href: path(locale, "/services"), label: dict.nav.services },
          { href: `${path(locale, "/services")}/${slug}`, label: service.title[locale] },
        ]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="space-y-6 text-[1.0625rem] leading-relaxed text-ink-700">
                  {service.body.map((paragraph) => (
                    <p key={paragraph[locale].slice(0, 24)}>{paragraph[locale]}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="mt-14 font-display text-[1.6rem] text-ink-900">
                  {dict.services.stepsTitle}
                </h2>
                <ol className="mt-8 border-t border-ink-900/12">
                  {service.steps.map((step, index) => (
                    <li
                      key={step.title[locale]}
                      className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-ink-900/12 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-x-6"
                    >
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.9rem] text-gold-700 tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-[1.15rem] text-ink-900">
                          {step.title[locale]}
                        </h3>
                        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-600">
                          {step.detail[locale]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                {priceGroup && (
                  <>
                    <h2 className="mt-14 font-display text-[1.6rem] text-ink-900">
                      {dict.prices.title}
                    </h2>
                    <div className="mt-8 border-t border-ink-900/12">
                      <PriceGroupTable group={priceGroup} locale={locale} />
                    </div>
                    <p className="mt-5 text-[0.9rem] leading-relaxed text-ink-500">
                      {dict.prices.note}
                    </p>
                    <ButtonLink
                      href={path(locale, "/prices")}
                      variant="secondary"
                      size="sm"
                      className="mt-6"
                    >
                      {dict.actions.viewPrices}
                    </ButtonLink>
                  </>
                )}
              </Reveal>
            </div>

            <aside className="lg:col-span-5">
              <Reveal delay={60}>
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt[locale]}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: photo.focus }}
                  />
                </div>

                <div className="mt-8 border-t border-ink-900/15 pt-7">
                  <h2 className="eyebrow text-ink-500">
                    {dict.services.highlightsTitle}
                  </h2>
                  <ul className="mt-5 space-y-3.5">
                    {service.highlights.map((item) => (
                      <li
                        key={item[locale]}
                        className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-700"
                      >
                        <span aria-hidden="true" className="mt-2 h-px w-4 shrink-0 bg-gold-500" />
                        {item[locale]}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 bg-ink-950 p-7" data-surface="dark">
                  <h2 className="font-display text-[1.3rem] text-bone-50">
                    {dict.services.ctaTitle}
                  </h2>
                  <p className="mt-3 text-[0.93rem] leading-relaxed text-bone-200/75">
                    {dict.services.ctaBody}
                  </p>
                  <ButtonLink
                    href={path(locale, "/appointment")}
                    variant="onDark"
                    size="sm"
                    className="mt-6"
                    withArrow
                  >
                    {dict.actions.bookAppointment}
                  </ButtonLink>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </Section>

      <ServicesIndex
        locale={locale}
        dict={dict}
        variant="page"
        exclude={slug}
        eyebrow={dict.services.eyebrow}
        title={dict.services.otherTitle}
        lead={dict.services.lead}
      />

      <JsonLd data={serviceSchema(service.title[locale], service.summary[locale], url)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          { name: dict.services.pageTitle, url: absoluteUrl(path(locale, "/services")) },
          { name: service.title[locale], url },
        ])}
      />
    </>
  );
}
