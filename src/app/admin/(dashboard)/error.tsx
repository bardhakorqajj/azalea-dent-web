"use client";

import { useEffect } from "react";
import Link from "next/link";

import { IconWarning } from "@/components/admin/Icons";
import { buttonClass } from "@/components/admin/Ui";

/**
 * The dashboard's error boundary.
 *
 * Deliberately plain, and deliberately not showing `error.message`: a database
 * error can carry a query, a column list or a connection string, and this
 * screen is the wrong place for any of them. The digest is shown so a report
 * can be matched to a server log, where the detail belongs.
 *
 * The strings are hardcoded rather than translated: this renders when
 * something has already failed, and reading the dictionary means another
 * server call that might fail the same way.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#b4442f]/10 text-[#96371f] dark:bg-[#e0806b]/12 dark:text-[#e8a08d]">
        <IconWarning />
      </div>

      <h1 className="font-display text-[1.5rem] text-ink-900 dark:text-bone-50">
        Diçka shkoi keq
      </h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-500 dark:text-bone-300">
        Veprimi nuk përfundoi. Provoni përsëri, dhe nëse vazhdon, kontrolloni
        regjistrat e serverit.
      </p>

      {error.digest && (
        <p className="mt-3 font-mono text-[0.75rem] text-ink-400 dark:text-ink-500">
          {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClass("primary", "md")}>
          Provo përsëri
        </button>
        <Link href="/" className={buttonClass("secondary", "md")}>
          Kthehu në panel
        </Link>
      </div>
    </div>
  );
}
