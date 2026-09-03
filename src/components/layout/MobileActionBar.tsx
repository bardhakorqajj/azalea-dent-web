import Link from "next/link";

import { clinic, telHref, whatsappHref } from "@/content/clinic";
import { InstagramBrand, WhatsAppBrand } from "@/components/ui/BrandIcons";
import { Phone } from "@/components/ui/Icons";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Sticky bar on small screens: booking is always one tap away, alongside
 * whichever direct channels the clinic has configured.
 */
export function MobileActionBar({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const tel = telHref();
  const wa = whatsappHref();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-bone-50/97 backdrop-blur-md lg:hidden dark:border-bone-100/12 dark:bg-ink-950/97">
      <div className="flex items-center gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href={path(locale, "/appointment")}
          className="flex min-h-12 flex-1 items-center justify-center rounded-sm bg-ink-900 px-4 text-[0.72rem] font-medium tracking-[0.14em] text-bone-50 uppercase dark:bg-gold-400 dark:text-ink-950"
        >
          {dict.nav.appointment}
        </Link>

        {tel && (
          <a
            href={tel}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-ink-900/20 text-ink-900 dark:border-bone-100/20 dark:text-bone-50"
          >
            <span className="sr-only">{dict.actions.call}</span>
            <Phone className="h-5 w-5" />
          </a>
        )}

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-ink-900/20 text-ink-900 dark:border-bone-100/20 dark:text-bone-50"
          >
            <span className="sr-only">{dict.actions.whatsapp}</span>
            <WhatsAppBrand className="h-5 w-5" />
          </a>
        )}

        {!tel && !wa && (
          <a
            href={clinic.social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-ink-900/20 text-ink-900 dark:border-bone-100/20 dark:text-bone-50"
          >
            <span className="sr-only">{dict.actions.instagram}</span>
            <InstagramBrand className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
