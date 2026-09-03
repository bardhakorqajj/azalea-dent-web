import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { DevContentNotice } from "@/components/layout/DevContentNotice";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { JsonLd } from "@/components/ui/JsonLd";
import { clinic } from "@/content/clinic";
import {
  defaultLocale,
  htmlLang,
  isLocale,
  locales,
  path,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { dentistSchema } from "@/lib/schema";
import { absoluteUrl, languageAlternates, siteUrl } from "@/lib/site";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Source Serif 4 for headings. Fraunces was the first choice, but its "j"
 * carries a swashed hook in every one of its axis settings, which read as
 * decorative rather than clinical; this face keeps a short, upright descender.
 * Only weight 400 is used, so only that is downloaded.
 */
const displaySerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-display-serif",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#14171a",
  colorScheme: "light",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: dict.meta.homeTitle,
      template: `%s | ${clinic.name}`,
    },
    description: dict.meta.homeDescription,
    applicationName: clinic.name,
    alternates: {
      canonical: path(locale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: clinic.name,
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      locale: htmlLang[locale].replace("-", "_"),
      url: absoluteUrl(path(locale)),
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <html lang={htmlLang[locale]} className={`${inter.variable} ${displaySerif.variable}`}>
      <head>
        {/* Scroll-reveal is progressive: without JS the content is simply visible. */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: "[data-reveal]{opacity:1!important;transform:none!important}",
            }}
          />
        </noscript>
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only rounded-sm bg-ink-900 px-5 py-3 text-bone-50 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]"
        >
          {dict.nav.skipToContent}
        </a>

        <Header locale={locale} dict={dict} />

        <main id="main" className="pb-[var(--mobile-bar)]">
          {children}
        </main>

        <Footer locale={locale} dict={dict} />
        <MobileActionBar locale={locale} dict={dict} />
        <DevContentNotice />

        <JsonLd data={dentistSchema(locale)} />
      </body>
    </html>
  );
}
