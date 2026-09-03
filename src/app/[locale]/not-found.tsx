"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { Container } from "@/components/ui/Container";
import { defaultLocale, isLocale, path } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function NotFound() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <Container width="text" className="py-40 text-center sm:py-52">
      <AzaleaMark
        className="mx-auto h-12 w-12 text-gold-500 dark:text-gold-400"
        weight={2.6}
      />
      <p className="mt-9 font-display text-[3.5rem] leading-none text-ink-400 dark:text-bone-400/70">
        404
      </p>
      <h1 className="mt-4 text-[2rem] text-ink-900 sm:text-[2.5rem] dark:text-bone-50">
        {dict.notFound.title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[1.0625rem] leading-relaxed text-ink-600 dark:text-bone-300">
        {dict.notFound.body}
      </p>
      <Link
        href={path(locale)}
        className="mt-9 inline-flex min-h-12 items-center rounded-sm bg-ink-900 px-7 text-[0.72rem] font-medium tracking-[0.14em] text-bone-50 uppercase transition-colors hover:bg-ink-700 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300"
      >
        {dict.actions.backToHome}
      </Link>
    </Container>
  );
}
