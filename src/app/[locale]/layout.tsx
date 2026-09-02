import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

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
import { absoluteUrl, siteUrl } from "@/lib/site";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Fraunces is loaded as a variable font so its WONK axis can be switched off in
 * globals.css. With wonk on, the "j" and "g" take quirky swashed forms that read
 * as decorative rather than clinical.
 */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
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
      languages: {
        sq: "/sq",
        en: "/en",
        "x-default": "/sq",
      },
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
    <html lang={htmlLang[locale]} className={`${inter.variable} ${fraunces.variable}`}>
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
