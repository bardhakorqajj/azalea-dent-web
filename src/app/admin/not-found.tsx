import Link from "next/link";

import { getAdminContext } from "@/admin/locale";
import { buttonClass } from "@/components/admin/Ui";

/**
 * A URL on the admin host that matches no route at all.
 *
 * Distinct from `(dashboard)/not-found.tsx`, which is what `notFound()`
 * reaches when a record has been deleted or an id was mistyped: that one
 * renders inside the dashboard's shell, behind the sign-in guard. This one
 * sits directly under the admin root layout, because a mistyped address is
 * answered before anything knows whether there is a session — so it shows
 * the dashboard's own chrome rather than falling through to the public
 * website's 404 page, which is not this hostname's to show.
 */
export default async function AdminNotFound() {
  const { dict } = await getAdminContext();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-ink-500 dark:text-bone-300">Azalea Dent</p>

      <h1 className="mt-4 font-display text-[1.6rem] text-ink-900 dark:text-bone-50">
        {dict.errors.notFound}
      </h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-500 dark:text-bone-300">
        {dict.errors.notFoundBody}
      </p>

      <Link href="/" className={buttonClass("secondary", "md", "mt-7")}>
        {dict.errors.backToDashboard}
      </Link>
    </div>
  );
}
