import { getAdminContext } from "@/admin/locale";
import { Sidebar, type NavCounts } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { Callout } from "@/components/admin/Ui";
import { getAdminAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/auth";
import { readCsrfToken } from "@/lib/admin/session";
import { activityHref, recentActivity, unreadActivityCount } from "@/lib/db/repos/activity";
import { pendingAppointmentCount } from "@/lib/db/repos/appointments";
import { unreadMessageCount } from "@/lib/db/repos/messages";
import { postsForApprovalCount } from "@/lib/db/repos/social";
import { databaseStatus } from "@/lib/db/status";

/**
 * The dashboard shell: sidebar, top bar, and the guard in front of everything.
 *
 * `requireAdmin()` runs here, so every page in this route group is behind it —
 * but it is not the *only* place it runs. Each server action and API route
 * checks again, because those are reachable by a direct POST without this
 * layout ever rendering.
 */

/**
 * Nothing in the dashboard can be prerendered: every page of it is a view of
 * one signed-in person's data, read from the request's own cookie. Saying so
 * here keeps the build from attempting it — and from a build machine, which
 * has no session and may have no database, ever producing a cached page of it.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const { dict, locale } = await getAdminContext();
  const status = await databaseStatus();

  /* The badge counts and the notification list, fetched together rather than
     one after another — they are independent, and the shell renders on every
     page in the dashboard. */
  const [pending, unreadMessages, forApproval, activity, unreadActivity, account, csrfToken] =
    await Promise.all([
      pendingAppointmentCount(),
      unreadMessageCount(),
      postsForApprovalCount(),
      recentActivity(8),
      unreadActivityCount(),
      getAdminAccount(),
      readCsrfToken(),
    ]);

  const counts: NavCounts = {
    pendingAppointments: pending,
    unreadMessages,
    postsForApproval: forApproval,
  };

  const dateFormatter = new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const notifications = activity.map((row) => ({
    id: row.id,
    summary: row.summary,
    href: activityHref(row),
    createdAt: dateFormatter.format(row.created_at),
    unread: row.read_at === null,
  }));

  /* Rendered once and used twice: the fixed desktop aside, and the mobile
     panel inside the top bar's toggle. */
  const sidebar = <Sidebar nav={dict.nav} counts={counts} />;

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#admin-main"
        className="sr-only rounded-sm bg-ink-900 px-5 py-3 text-bone-50 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] dark:bg-gold-400 dark:text-ink-950"
      >
        {dict.nav.skipToContent}
      </a>

      {/* The fixed sidebar, desktop only. The mobile panel renders the same
          component inside the toggle in the top bar. */}
      <aside className="admin-divide hidden w-[var(--admin-sidebar)] shrink-0 border-r bg-bone-50 lg:block dark:bg-ink-900">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          dict={dict}
          locale={locale}
          csrfToken={csrfToken ?? ""}
          sidebar={sidebar}
          notifications={notifications}
          unreadCount={unreadActivity}
          accountEmail={account?.email ?? null}
        />

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {status.state !== "ready" && (
            <Callout tone="warning" title={dict.errors.databaseMissing} className="mb-6">
              {status.state === "unmigrated"
                ? dict.errors.migrationsMissingBody
                : dict.errors.databaseMissingBody}
            </Callout>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
