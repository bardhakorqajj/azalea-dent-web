import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type Crumb = { href: string; label: string };

/** Standard opening band for every page that does not have its own hero. */
export function PageHeader({
  locale,
  dict,
  eyebrow,
  title,
  lead,
  breadcrumbs,
}: {
  locale: Locale;
  dict: Dictionary;
  eyebrow?: string;
  title: string;
  lead?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="border-b border-ink-900/8 bg-bone-100 pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-48 lg:pb-24">
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[0.78rem] text-ink-500">
              <li>
                <Link href={path(locale)} className="hover:text-ink-900">
                  {dict.nav.home}
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-ink-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-ink-900">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <p className="eyebrow flex items-center gap-3 text-gold-700">
          <AzaleaMark className="h-5 w-5 text-gold-500" weight={4} />
          {eyebrow ?? dict.hero.eyebrow}
        </p>

        <h1 className="mt-6 max-w-3xl text-[2.4rem] leading-[1.08] text-ink-900 sm:text-[3.1rem] lg:text-[3.6rem]">
          {title}
        </h1>

        {lead && (
          <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-600">
            {lead}
          </p>
        )}
      </Container>
    </div>
  );
}
