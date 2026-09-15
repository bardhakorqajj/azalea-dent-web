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
import { getPublicDictionary } from "@/lib/public/dictionary";
import { dentistSchema } from "@/lib/schema";
import {
  absoluteUrl,
  isUnlistedDeployment,
  languageAlternates,
  siteUrl,
} from "@/lib/site";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e0f" },
  ],
  colorScheme: "light dark",
};

/**
 * Sets `data-theme` before the browser paints, from a stored choice or the OS
 * setting, so the page never flashes the wrong theme on load. Runs as a
 * blocking inline script rather than a `useEffect`, which would only run
 * after hydration — too late to prevent the flash it exists to avoid.
 */
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      var theme =
        stored === "light" || stored === "dark"
          ? stored
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {}
  })();
`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);

  /* Site-wide defaults only. Every page supplies its own title, description,
     canonical, hreflang, Open Graph, Twitter card and robots directives
     through `pageMetadata`, which is what keeps the two social blocks in step
     with the page instead of inheriting the home page's. What stays here is
     what genuinely is the same everywhere. */
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: dict.meta.homeTitle,
      template: `%s | ${clinic.name}`,
    },
    description: dict.meta.homeDescription,
    applicationName: clinic.name,
    authors: [{ name: clinic.name, url: siteUrl() }],
    creator: clinic.name,
    publisher: clinic.name,
    category: "Dentistry",
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
    /* A preview deployment is the same site on a throwaway address. robots.txt
       already disallows it, but a disallowed URL can still be indexed from an
       external link — only `noindex` on the page keeps it out, and a blocked
       crawler never gets to read it. */
    robots: isUnlistedDeployment()
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    formatDetection: { telephone: true, address: true, email: true },
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

  /* The dashboard can edit the footer's tagline and note, and the footer is
     rendered here rather than on any page — so this reads the same merged
     dictionary the pages do. It falls back to the shipped copy, so an
     unreachable database changes nothing. */
  const dict = await getPublicDictionary(locale);

  return (
    <html
      lang={htmlLang[locale]}
      className={`${inter.variable} ${displaySerif.variable}`}
      // The inline script below sets data-theme before hydration, so the
      // attribute React sees on mount never matches the server-rendered
      // markup — expected, not a real mismatch.
      suppressHydrationWarning
    >
      <head>
        {/* Static string, not user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        {/* Scroll-reveal is progressive: without JS the content is simply visible. */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "[data-reveal]{opacity:1!important;transform:none!important}",
            }}
          />
        </noscript>
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only rounded-sm bg-ink-900 px-5 py-3 text-bone-50 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] dark:bg-gold-400 dark:text-ink-950"
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
