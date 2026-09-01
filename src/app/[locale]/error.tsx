"use client";

import { useEffect } from "react";

import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { Container } from "@/components/ui/Container";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dict = getDictionary(defaultLocale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container width="text" className="py-40 text-center sm:py-52">
      <AzaleaMark className="mx-auto h-12 w-12 text-gold-500" weight={2.6} />
      <h1 className="mt-9 text-[2rem] text-ink-900 sm:text-[2.5rem]">
        {dict.error.title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[1.0625rem] leading-relaxed text-ink-600">
        {dict.error.body}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-9 inline-flex min-h-12 items-center rounded-sm bg-ink-900 px-7 text-[0.72rem] font-medium tracking-[0.14em] text-bone-50 uppercase transition-colors hover:bg-ink-700"
      >
        {dict.error.retry}
      </button>
    </Container>
  );
}
