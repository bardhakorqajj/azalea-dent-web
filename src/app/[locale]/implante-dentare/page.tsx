import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Faq } from "@/components/sections/Faq";
import { VisitBand } from "@/components/sections/VisitBand";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { photos } from "@/content/images";
import { formatPrice, implantPrices } from "@/content/prices";
import { getService } from "@/content/services";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { implantsSchema, pageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { getPublicDictionary } from "@/lib/public/dictionary";
import { publicFaq } from "@/lib/public/faq";
import { absoluteUrl } from "@/lib/site";

/**
 * The dental-implant page.
 *
 * Implants are the treatment patients search for by name more than any other
 * ("implante dentare", "implantet dentare"), but on this site they live inside
 * "Kirurgji orale" among the extractions, sharing a page with treatments that
 * have nothing to do with them. A search for the term had nowhere specific to
 * land. This page is that landing place: it covers the treatment properly and
 * links back into oral surgery and prosthetics for everything around it, so it
 * adds a route into the site rather than a duplicate of one.
 *
 * Every fact on it comes from `content/services.ts` and the clinic's own price
 * sheet. It makes no claim about success rates or how long an implant lasts.
 */

export const ROUTE = "/implante-dentare";

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
    page: ROUTE,
    title: dict.meta.implantsTitle,
    description: dict.meta.implantsDescription,
  });
}

export default async function ImplantsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, faq] = await Promise.all([
    getPublicDictionary(locale),
    publicFaq(locale),
  ]);
  const photo = photos.operatoryDaylight;
  const url = absoluteUrl(path(locale, ROUTE));
  const prices = implantPrices();

  /* The two areas of treatment an implant actually spans, linked by their real
     slugs so the cross-links break at build time if a slug is ever renamed. */
  const surgery = getService("kirurgji-orale");
  const prosthetics = getService("protetike");
  const related = [surgery, prosthetics].filter(
    (service): service is NonNullable<typeof service> => Boolean(service),
  );

  const schema = implantsSchema(locale, url);

  return (
    <>
      <PageHeader
        locale={locale}
        dict={dict}
        eyebrow={dict.implants.eyebrow}
        title={dict.implants.title}
        lead={dict.implants.lead}
        breadcrumbs={[{ href: path(locale, ROUTE), label: dict.implants.eyebrow }]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="font-display text-[1.75rem] text-ink-900 sm:text-[2.1rem] dark:text-bone-50">
                  {dict.implants.whatTitle}
                </h2>
                <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-700 dark:text-bone-200">
                  {dict.implants.what.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                  {dict.implants.whenTitle}
                </h2>
                <ul className="mt-7 space-y-3.5">
                  {dict.implants.when.map((item) => (
                    <li
                      key={item.slice(0, 24)}
                      className="flex gap-3 text-[1rem] leading-relaxed text-ink-700 dark:text-bone-200"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-4 shrink-0 bg-gold-500 dark:bg-gold-400"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={120}>
                <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                  {dict.implants.stagesTitle}
                </h2>
                <ol className="mt-8 border-t border-ink-900/12 dark:border-bone-100/12">
                  {dict.implants.stages.map((stage, index) => (
                    <li
                      key={stage.title}
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
                          {stage.title}
                        </h3>
                        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-600 dark:text-bone-300">
                          {stage.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>

              {prices.length > 0 && (
                <Reveal delay={140}>
                  <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                    {dict.implants.pricesTitle}
                  </h2>
                  <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-600 dark:text-bone-300">
                    {dict.implants.pricesLead}
                  </p>
                  <dl className="mt-7 border-t border-ink-900/12 dark:border-bone-100/12">
                    {prices.map((item) => (
                      <div
                        key={item.name.sq}
                        className="flex items-baseline justify-between gap-6 border-b border-ink-900/8 py-3.5 dark:border-bone-100/10"
                      >
                        <dt className="text-[0.98rem] leading-snug text-ink-700 dark:text-bone-200">
                          {item.name[locale]}
                        </dt>
                        <dd className="shrink-0 text-[0.98rem] font-medium whitespace-nowrap text-ink-900 tabular-nums dark:text-bone-50">
                          {formatPrice(item.price)}
                        </dd>
                      </div>
                    ))}
                  </dl>
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
                </Reveal>
              )}

              <Reveal delay={160}>
                <h2 className="mt-14 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
                  {dict.implants.relatedTitle}
                </h2>
                <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-600 dark:text-bone-300">
                  {dict.implants.relatedLead}
                </p>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {related.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`${path(locale, "/services")}/${service.slug}`}
                        className="group flex items-center gap-3 border-b border-ink-900/10 py-3 text-[0.98rem] text-ink-700 transition-colors hover:text-ink-900 dark:border-bone-100/12 dark:text-bone-200 dark:hover:text-bone-50"
                      >
                        <span
                          aria-hidden="true"
                          className="h-px w-4 shrink-0 bg-gold-500 dark:bg-gold-400"
                        />
                        {service.title[locale]}
                      </Link>
                    </li>
                  ))}
                </ul>
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

                <div className="mt-8 border-t border-ink-900/15 pt-7 dark:border-bone-100/15">
                  <h2 className="eyebrow text-ink-500 dark:text-bone-300">
                    {dict.implants.goodToKnowTitle}
                  </h2>
                  <ul className="mt-5 space-y-3.5">
                    {dict.implants.goodToKnow.map((item) => (
                      <li
                        key={item.slice(0, 24)}
                        className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-700 dark:text-bone-200"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-px w-4 shrink-0 bg-gold-500 dark:bg-gold-400"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 bg-ink-950 p-7" data-surface="dark">
                  <h2 className="font-display text-[1.3rem] text-bone-50">
                    {dict.implants.ctaTitle}
                  </h2>
                  <p className="mt-3 text-[0.93rem] leading-relaxed text-bone-200/75">
                    {dict.implants.ctaBody}
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

      <VisitBand locale={locale} dict={dict} />
      <Faq dict={dict} items={faq} />
      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={pageSchema({
          locale,
          url,
          name: dict.meta.implantsTitle,
          description: dict.meta.implantsDescription,
          about: schema.procedureId,
          primaryImage: absoluteUrl(photo.src.src),
          breadcrumbs: [{ name: dict.implants.eyebrow, url }],
          extra: schema.nodes,
        })}
      />
    </>
  );
}
