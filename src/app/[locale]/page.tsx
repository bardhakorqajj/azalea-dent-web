import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/CtaBand";
import { Faq } from "@/components/sections/Faq";
import { Promotions } from "@/components/sections/Promotions";
import { GalleryPreview } from "@/components/sections/GalleryPreview";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { ServicesIndex } from "@/components/sections/ServicesIndex";
import { Team } from "@/components/sections/Team";
import { Testimonials } from "@/components/sections/Testimonials";
import { VisitBand } from "@/components/sections/VisitBand";
import { WhyUs } from "@/components/sections/WhyUs";
import { JsonLd } from "@/components/ui/JsonLd";
import { photos } from "@/content/images";
import { defaultLocale, isLocale, path, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { faqSchema, pageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { getPublicFaq, getPublicPromotions } from "@/lib/public/content";
import { getPublicDictionary } from "@/lib/public/dictionary";
import { publicReviews } from "@/lib/public/reviews";
import { publicServices } from "@/lib/public/services";
import { publicTeam } from "@/lib/public/team";
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
    page: "/",
    title: dict.meta.homeTitle,
    /* The home page names the clinic and the city on its own, so the
       `%s | Azalea Dent` template would only repeat the brand. */
    absoluteTitle: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  /* Everything the clinic can change from the dashboard, read together: these
     are independent cached reads, so doing them in sequence would make the
     page wait on each in turn. Each one falls back to the copy the site ships
     with, so an unreachable database changes nothing here. */
  const [dict, services, team, reviews, promotions, faqItems] = await Promise.all([
    getPublicDictionary(locale),
    publicServices(),
    publicTeam(),
    publicReviews(),
    getPublicPromotions(),
    getPublicFaq(),
  ]);

  /* The clinic's own questions where it has added any, and the site's
     otherwise — the schema below has to describe whatever is rendered. */
  const faq =
    faqItems.length > 0
      ? faqItems.map((item) => ({
          question: item.question[locale] ?? item.question.sq ?? "",
          answer: item.answer[locale] ?? item.answer.sq ?? "",
        }))
      : dict.faq.items.map((item) => ({ ...item }));

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <Intro locale={locale} dict={dict} />
      <ServicesIndex locale={locale} dict={dict} services={services} />
      <WhyUs locale={locale} dict={dict} />
      <Promotions locale={locale} dict={dict} promotions={promotions} />
      <GalleryPreview locale={locale} dict={dict} />
      <Team locale={locale} dict={dict} members={team} />
      <Testimonials locale={locale} dict={dict} reviews={reviews} />
      <VisitBand locale={locale} dict={dict} />
      <Faq dict={dict} items={faq} />
      <CtaBand locale={locale} dict={dict} />

      <JsonLd data={faqSchema(faq)} />
      <JsonLd
        data={pageSchema({
          locale,
          url: absoluteUrl(path(locale)),
          name: dict.meta.homeTitle,
          description: dict.meta.homeDescription,
          primaryImage: absoluteUrl(photos.operatoryOak.src.src),
        })}
      />
    </>
  );
}
