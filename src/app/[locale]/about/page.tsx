import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { Team } from "@/components/sections/Team";
import { Testimonials } from "@/components/sections/Testimonials";
import { VisitBand } from "@/components/sections/VisitBand";
import { WhyUs } from "@/components/sections/WhyUs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { photos } from "@/content/images";
import { services } from "@/content/services";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { breadcrumbSchema } from "@/lib/schema";
import { absoluteUrl, languageAlternates } from "@/lib/site";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return {
    title: dict.about.title,
    description: dict.meta.aboutDescription,
    alternates: {
      canonical: path(locale, "/about"),
      languages: languageAlternates("/about"),
    },
    openGraph: {
      title: `${dict.about.title} | Azalea Dent`,
      description: dict.meta.aboutDescription,
      url: absoluteUrl(path(locale, "/about")),
    },
  };
}

export default async function AboutPage({
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
        eyebrow={dict.about.eyebrow}
        title={dict.about.title}
        lead={dict.about.lead}
        breadcrumbs={[{ href: path(locale, "/about"), label: dict.nav.about }]}
      />

      <Section surface="bone">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="font-display text-[1.75rem] text-ink-900 sm:text-[2.1rem]">
                  {dict.about.storyTitle}
                </h2>
                <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-700">
                  {dict.about.story.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="mt-14 font-display text-[1.75rem] text-ink-900 sm:text-[2.1rem]">
                  {dict.about.approachTitle}
                </h2>
                <div className="mt-7 space-y-5 text-[1.0625rem] leading-relaxed text-ink-700">
                  {dict.about.approach.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={120}>
                <h2 className="mt-14 eyebrow text-ink-500">
                  {dict.about.servicesTitle}
                </h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`${path(locale, "/services")}/${service.slug}`}
                        className="group flex items-center gap-3 border-b border-ink-900/10 py-3 text-[0.98rem] text-ink-700 transition-colors hover:text-ink-900"
                      >
                        <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold-500" />
                        {service.title[locale]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={60}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={photos.reception.src}
                    alt={photos.reception.alt[locale]}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: photos.reception.focus }}
                  />
                </div>
                <p className="eyebrow mt-3 text-ink-500">
                  {photos.reception.caption[locale]}
                </p>
              </Reveal>

              <Reveal delay={140}>
                <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={photos.glassDetail.src}
                    alt={photos.glassDetail.alt[locale]}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: photos.glassDetail.focus }}
                  />
                </div>
                <p className="eyebrow mt-3 text-ink-500">
                  {photos.glassDetail.caption[locale]}
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <WhyUs locale={locale} dict={dict} />
      <Team locale={locale} dict={dict} />
      <Testimonials locale={locale} dict={dict} />
      <VisitBand locale={locale} dict={dict} />
      <CtaBand locale={locale} dict={dict} />

      <JsonLd
        data={breadcrumbSchema([
          { name: dict.nav.home, url: absoluteUrl(path(locale)) },
          { name: dict.about.title, url: absoluteUrl(path(locale, "/about")) },
        ])}
      />
    </>
  );
}
