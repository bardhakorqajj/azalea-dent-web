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
import {
  defaultLocale,
  isLocale,
  locales,
  path,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageSchema, treatmentSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { getPublicDictionary } from "@/lib/public/dictionary";
import {
  prerenderedServiceSlugs,
  publicService,
  publicServices,
} from "@/lib/public/services";
import { absoluteUrl } from "@/lib/site";

/**
 * The pages to prerender at build time: the eight services the site ships
 * with.
 *
 * A service the clinic adds in the dashboard is deliberately not listed here.
 * A build must not depend on a reachable database, nor bake in whatever
 * happened to be published that minute — and Next renders a param that this
 * did not return on demand, which is exactly the behaviour wanted.
 */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    prerenderedServiceSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const service = await publicService(slug);
  if (!service) return {};

  const dict = getDictionary(locale);

  /* The heading on the page is just the treatment ("Protetikë"); the title
     tag adds the city, because the person reading it is still in a results
     list and has not arrived yet. The clinic can override both from the
     dashboard's SEO fields. */
  const title =
    service.seoTitle?.[locale] ||
    `${service.title[locale]} ${dict.meta.serviceTitleSuffix}`;

  return pageMetadata({
    locale,
    page: `/services/${slug}`,
    title,
    description: service.seoDescription?.[locale] || service.summary[locale],
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, service, services] = await Promise.all([
    getPublicDictionary(locale),
    publicService(slug),
    publicServices(),
  ]);

  if (!service) notFound();

  const photo = photos.operatoryDaylight;
  const priceGroup = priceGroups.find(
    (group) => group.id === service.priceGroupId,
  );
  /* The price the clinic typed into the dashboard, shown only when this
     treatment has no price table of its own. Where there is a table, the
     table is the published price list and two figures could disagree. */
  const priceLine = priceGroup ? "" : (service.priceText?.[locale] ?? "").trim();

  const url = absoluteUrl(`${path(locale, "/services")}/${slug}`);
  const treatment = treatmentSchema(service, locale);

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
          {
            href: `${path(locale, "/services")}/${slug}`,
            label: service.title[locale],
          },
        ]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="space-y-6 text-[1.0625rem] leading-relaxed text-ink-700 dark:text-bone-200">
                  {service.body.map((paragraph) => (
                    <p key={paragraph[locale].slice(0, 24)}>
                      {paragraph[locale]}
                    </p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                  {dict.services.stepsTitle}
                </h2>
                <ol className="mt-8 border-t border-ink-900/12 dark:border-bone-100/12">
                  {service.steps.map((step, index) => (
                    <li
                      key={step.title[locale]}
                      className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-ink-900/12 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-x-6 dark:border-bone-100/12"
                    >
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.9rem] text-gold-700 tabular-nums dark:text-gold-400"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-[1.15rem] text-ink-900 dark:text-bone-50">
                          {step.title[locale]}
                        </h3>
                        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-600 dark:text-bone-300">
                          {step.detail[locale]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                {priceGroup && (
                  <>
                    <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                      {dict.prices.title}
                    </h2>
                    <div className="mt-8 border-t border-ink-900/12 dark:border-bone-100/12">
                      <PriceGroupTable group={priceGroup} locale={locale} />
                    </div>
                    <p className="mt-5 text-[0.9rem] leading-relaxed text-ink-500 dark:text-bone-300">
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
                  {service.imageId ? (
                    /* The clinic's own photograph for this treatment. No
                       `placeholder="blur"`: a file uploaded after the build has
                       no build-time blur data. */
                    <Image
                      src={`/api/media/${service.imageId}`}
                      alt={service.title[locale]}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src={photo.src}
                      alt={photo.alt[locale]}
                      placeholder="blur"
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="h-full w-full object-cover"
                      style={{ objectPosition: photo.focus }}
                    />
                  )}
                </div>

                {priceLine && (
                  <div className="mt-8 border-t border-ink-900/15 pt-7 dark:border-bone-100/15">
                    <h2 className="eyebrow text-ink-500 dark:text-bone-300">
                      {dict.services.priceTitle}
                    </h2>
                    <p className="mt-4 font-display text-[1.5rem] text-ink-900 dark:text-bone-50">
                      {priceLine}
                    </p>
                    <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-500 dark:text-bone-300">
                      {dict.prices.note}
                    </p>
                  </div>
                )}

                <div className="mt-8 border-t border-ink-900/15 pt-7 dark:border-bone-100/15">
                  <h2 className="eyebrow text-ink-500 dark:text-bone-300">
                    {dict.services.highlightsTitle}
                  </h2>
                  <ul className="mt-5 space-y-3.5">
                    {service.highlights.map((item) => (
                      <li
                        key={item[locale]}
                        className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-700 dark:text-bone-200"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-px w-4 shrink-0 bg-gold-500 dark:bg-gold-400"
                        />
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
        services={services}
        variant="page"
        exclude={slug}
        eyebrow={dict.services.eyebrow}
        title={dict.services.otherTitle}
        lead={dict.services.lead}
      />

      <JsonLd
        data={pageSchema({
          locale,
          url,
          name: `${service.title[locale]} ${dict.meta.serviceTitleSuffix}`,
          description: service.summary[locale],
          about: treatment.procedureId,
          primaryImage: absoluteUrl(
            service.imageId ? `/api/media/${service.imageId}` : photo.src.src,
          ),
          breadcrumbs: [
            {
              name: dict.services.pageTitle,
              url: absoluteUrl(path(locale, "/services")),
            },
            { name: service.title[locale], url },
          ],
          extra: treatment.nodes,
        })}
      />
    </>
  );
}
