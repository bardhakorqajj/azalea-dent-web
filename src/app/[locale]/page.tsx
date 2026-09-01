import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/CtaBand";
import { Faq } from "@/components/sections/Faq";
import { GalleryPreview } from "@/components/sections/GalleryPreview";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { ServicesIndex } from "@/components/sections/ServicesIndex";
import { Team } from "@/components/sections/Team";
import { Testimonials } from "@/components/sections/Testimonials";
import { VisitBand } from "@/components/sections/VisitBand";
import { WhyUs } from "@/components/sections/WhyUs";
import { JsonLd } from "@/components/ui/JsonLd";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { faqSchema } from "@/lib/schema";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <Hero locale={locale} dict={dict} />
      <Intro locale={locale} dict={dict} />
      <ServicesIndex locale={locale} dict={dict} />
      <WhyUs locale={locale} dict={dict} />
      <GalleryPreview locale={locale} dict={dict} />
      <Team locale={locale} dict={dict} />
      <Testimonials locale={locale} dict={dict} />
      <VisitBand locale={locale} dict={dict} />
      <Faq dict={dict} />
      <CtaBand locale={locale} dict={dict} />

      <JsonLd data={faqSchema(dict.faq.items.map((item) => ({ ...item })))} />
    </>
  );
}
