import Link from "next/link";

import { getAdminContext } from "@/admin/locale";
import { IconSearch } from "@/components/admin/Icons";
import { buttonClass } from "@/components/admin/Ui";

/** Reached by `notFound()` — a deleted record, or a mistyped id. */
export default async function DashboardNotFound() {
  const { dict } = await getAdminContext();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/[0.06] text-ink-400 dark:bg-bone-100/[0.08] dark:text-ink-300">
        <IconSearch />
      </div>

      <h1 className="font-display text-[1.5rem] text-ink-900 dark:text-bone-50">
        {dict.errors.notFound}
      </h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-500 dark:text-bone-300">
        {dict.errors.notFoundBody}
      </p>

      <Link href="/" className={buttonClass("secondary", "md", "mt-6")}>
        {dict.errors.backToDashboard}
      </Link>
    </div>
  );
}
