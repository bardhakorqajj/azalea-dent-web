import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { getAdminLocale } from "@/admin/locale";
import { htmlLang } from "@/i18n/config";
import "@/styles/admin.css";

/**
 * The dashboard's root layout.
 *
 * A second root layout, alongside the public site's `app/[locale]/layout.tsx`:
 * the two branches of the route tree render their own `<html>`, which is what
 * lets the dashboard have its own chrome, its own stylesheet and its own
 * language handling without the public site's header and footer wrapping it.
 *
 * The same two typefaces are loaded, so the dashboard reads as the same brand.
 */

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const displaySerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-display-serif",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e0f" },
  ],
  colorScheme: "light dark",
};

/**
 * A private tool. `noindex` here covers the pages; `proxy.ts` adds the same as
 * an `X-Robots-Tag` header on every response the admin host makes, including
 * the API routes and redirects that never render metadata.
 */
export const metadata: Metadata = {
  title: {
    default: "Azalea Dent — Paneli",
    template: "%s | Azalea Dent",
  },
  robots: { index: false, follow: false, nocache: true },
};

/** Sets the theme before first paint, as on the public site. */
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

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getAdminLocale();

  return (
    <html
      lang={htmlLang[locale]}
      data-admin=""
      className={`${inter.variable} ${displaySerif.variable}`}
      // The inline script sets data-theme before hydration, so the attribute
      // React sees on mount never matches the server-rendered markup.
      suppressHydrationWarning
    >
      <head>
        {/* Static string, not user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
