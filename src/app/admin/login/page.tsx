import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminContext } from "@/admin/locale";
import { Callout } from "@/components/admin/Ui";
import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { clinic } from "@/content/clinic";
import { adminAccountAvailable } from "@/lib/admin/account";
import { getAdminSession } from "@/lib/admin/auth";
import { adminHostConfigured } from "@/lib/admin/host";
import { databaseStatus } from "@/lib/db/status";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Hyr",
  robots: { index: false, follow: false },
};

/**
 * The one page of the dashboard that is served without a session.
 *
 * It reports an unconfigured deployment plainly — a missing database, an
 * un-migrated schema, no admin account yet — because those are the operator's
 * problem and a generic "wrong password" would send them looking in the wrong
 * place. It never reveals whether a particular *email* exists.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;
  const { dict } = await getAdminContext();

  /* Already signed in: no reason to show a login form. */
  if (await getAdminSession()) redirect("/admin");

  const status = await databaseStatus();
  const accountReady = status.state === "ready" ? await adminAccountAvailable() : false;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <main className="w-full max-w-[24rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <AzaleaMark className="h-11 w-11 text-gold-500 dark:text-gold-400" />
          <h1 className="mt-5 font-display text-[1.625rem] leading-tight text-ink-900 dark:text-bone-50">
            {dict.auth.signInTitle}
          </h1>
          <p className="mt-1.5 text-[0.875rem] text-ink-500 dark:text-bone-300">
            {dict.auth.signInSubtitle}
          </p>
        </div>

        <div className="admin-card px-6 py-7">
          {notice === "signed_out" && (
            <Callout tone="success" className="mb-5">
              {dict.auth.signedOut}
            </Callout>
          )}

          {status.state === "missing" && (
            <Callout tone="warning" title={dict.errors.databaseMissing}>
              {dict.errors.databaseMissingBody}
            </Callout>
          )}

          {status.state === "unreachable" && (
            <Callout tone="danger" title={dict.errors.databaseMissing}>
              {dict.auth.noDatabase}
            </Callout>
          )}

          {status.state === "unmigrated" && (
            <Callout tone="warning" title={dict.errors.migrationsMissing}>
              {dict.errors.migrationsMissingBody}
            </Callout>
          )}

          {status.state === "ready" && !accountReady && (
            <Callout tone="warning">{dict.auth.notConfigured}</Callout>
          )}

          {status.state === "ready" && accountReady && (
            <LoginForm labels={dict.auth} next={next} />
          )}
        </div>

        {/* On a development machine the dashboard shares the site's hostname.
            Saying so avoids the impression that the domain split is missing. */}
        {!adminHostConfigured() && (
          <p className="mt-6 text-center text-[0.75rem] leading-relaxed text-ink-400 dark:text-ink-300">
            ADMIN_HOST is not set, so the dashboard is being served from this
            hostname. In production it answers only on its own subdomain.
          </p>
        )}

        <p className="mt-8 text-center text-[0.75rem] text-ink-400 dark:text-ink-300">
          {clinic.name} · {clinic.descriptor}
        </p>
      </main>
    </div>
  );
}
