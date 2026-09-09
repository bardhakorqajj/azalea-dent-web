import type { Metadata } from "next";
import Link from "next/link";

import {
  appointmentStatusLabel,
  appointmentStatusTone,
  excerpt,
  formatDateShort,
  formatDateTime,
  formatTime,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { BarChart, DonutChart, RankedBars, type Point } from "@/components/admin/Charts";
import { IconCalendar, IconPlus } from "@/components/admin/Icons";
import {
  ActionLink,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Dash,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { text } from "@/lib/db/types";
import { databaseReady } from "@/lib/db/status";
import {
  appointmentCounts,
  requestsByService,
  requestsPerWeek,
  todaysAppointments,
  upcomingAppointments,
} from "@/lib/db/repos/appointments";
import { patientCounts } from "@/lib/db/repos/patients";
import { recentMessages, unreadMessageCount } from "@/lib/db/repos/messages";
import { activePromotionCount } from "@/lib/db/repos/promotions";
import { recentReviews } from "@/lib/db/repos/reviews";

export const metadata: Metadata = { title: "Paneli" };

/**
 * The overview.
 *
 * Every number here is counted from the clinic's own database. There are no
 * estimates, no sample series and no placeholder trend lines: a chart with
 * nothing behind it renders its empty state and says so. Website traffic is
 * absent for the same reason — it needs Google Analytics connected, which the
 * Analytics page explains rather than filling in with invented figures.
 */
export default async function DashboardPage() {
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.dashboard.title} description={dict.dashboard.subtitle} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  /* Fetched together: they are independent queries against a small database,
     and doing them in sequence would make the first paint wait on all of them
     one after another. */
  const [
    counts,
    patients,
    unread,
    promotions,
    today,
    upcoming,
    weekly,
    popular,
    messages,
    reviews,
  ] = await Promise.all([
    appointmentCounts(),
    patientCounts(),
    unreadMessageCount(),
    activePromotionCount(),
    todaysAppointments(),
    upcomingAppointments(5),
    requestsPerWeek(12),
    requestsByService(5),
    recentMessages(4),
    recentReviews(3),
  ]);

  const weeklyPoints: Point[] = weekly.map((week) => ({
    label: formatDateShort(week.weekStart, locale).slice(0, 5),
    value: week.count,
    hint: `${formatDateShort(week.weekStart, locale)}: ${week.count}`,
  }));

  const popularPoints: Point[] = popular.map((entry) => ({
    label: entry.title
      ? text(entry.title, locale)
      : (entry.label ?? dict.appointments.serviceOther),
    value: entry.count,
  }));

  const statusPoints: Point[] = (
    [
      ["pending", dict.appointments.statusPending],
      ["confirmed", dict.appointments.statusConfirmed],
      ["completed", dict.appointments.statusCompleted],
      ["cancelled", dict.appointments.statusCancelled],
      ["no_show", dict.appointments.statusNoShow],
    ] as const
  )
    .map(([key, label]) => ({ label, value: counts.byStatus[key] }))
    .filter((point) => point.value > 0);

  const totalAppointments = Object.values(counts.byStatus).reduce(
    (sum, value) => sum + value,
    0,
  );

  return (
    <>
      <PageHeader
        title={dict.dashboard.title}
        description={dict.dashboard.subtitle}
        actions={
          <>
            <ActionLink href="/appointments/new" tone="primary">
              <IconPlus className="h-4 w-4" />
              {dict.dashboard.newAppointment}
            </ActionLink>
            <ActionLink href="/appointments?view=calendar" tone="secondary">
              <IconCalendar className="h-4 w-4" />
              {dict.dashboard.viewCalendar}
            </ActionLink>
          </>
        }
      />

      {/* --- The numbers ------------------------------------------------- */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={dict.dashboard.todaysAppointments}
          value={counts.today}
          href="/appointments"
        />
        <StatTile
          label={dict.dashboard.pendingRequests}
          value={counts.pending}
          href="/appointments?status=pending"
          emphasis={counts.pending > 0}
        />
        <StatTile
          label={dict.dashboard.upcomingAppointments}
          value={counts.upcoming}
          href="/appointments?status=confirmed"
        />
        <StatTile
          label={dict.dashboard.completedThisMonth}
          value={counts.completedThisMonth}
          href="/appointments?status=completed"
        />
        <StatTile
          label={dict.dashboard.totalPatients}
          value={patients.total}
          href="/patients"
        />
        <StatTile
          label={dict.dashboard.newPatients}
          value={patients.newLast30Days}
          hint={dict.dashboard.newPatientsHint}
          href="/patients"
        />
        <StatTile
          label={dict.dashboard.unreadMessages}
          value={unread}
          href="/messages?unread=1"
          emphasis={unread > 0}
        />
        <StatTile
          label={dict.dashboard.activePromotions}
          value={promotions}
          href="/promotions"
        />
      </div>

      {/* --- Today ------------------------------------------------------- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={dict.dashboard.todaysAppointments}
            actions={
              <Link
                href="/appointments"
                className="text-[0.8125rem] text-ink-500 underline hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50"
              >
                {dict.notifications.viewAll}
              </Link>
            }
          />

          {today.length === 0 ? (
            <EmptyState
              title={dict.dashboard.noAppointmentsToday}
              icon={<IconCalendar />}
              action={
                <ActionLink href="/appointments/new" tone="secondary" size="sm">
                  {dict.dashboard.newAppointment}
                </ActionLink>
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">{dict.common.time}</th>
                  <th scope="col">{dict.appointments.patient}</th>
                  <th scope="col" className="hidden sm:table-cell">
                    {dict.appointments.service}
                  </th>
                  <th scope="col">{dict.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {today.map((row) => (
                  <tr key={row.id}>
                    <td className="tnum whitespace-nowrap">
                      {row.scheduled_time ? (
                        formatTime(row.scheduled_time)
                      ) : (
                        <span className="text-[0.8125rem] text-ink-400 dark:text-ink-300">
                          {dict.appointments.noTime}
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/appointments/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.patient_name}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell">
                      {row.service_title ? (
                        text(row.service_title, locale)
                      ) : row.service_label ? (
                        row.service_label
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td>
                      <Badge tone={appointmentStatusTone(row.status)}>
                        {appointmentStatusLabel(row.status, dict)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardHeader title={dict.dashboard.upcomingAppointments} />
          {upcoming.length === 0 ? (
            <EmptyState title={dict.appointments.empty} />
          ) : (
            <ul className="admin-divide divide-y">
              {upcoming.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/appointments/${row.id}`}
                    className="flex items-baseline gap-3 px-5 py-3 transition-colors hover:bg-ink-900/[0.03] dark:hover:bg-bone-100/[0.05]"
                  >
                    <span className="tnum shrink-0 text-[0.8125rem] text-ink-500 dark:text-bone-300">
                      {formatDateShort(row.scheduled_date, locale)}
                      {row.scheduled_time && ` · ${formatTime(row.scheduled_time)}`}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.9375rem]">
                      {row.patient_name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* --- Charts ------------------------------------------------------ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={dict.dashboard.requestsChart}
            hint={dict.dashboard.requestsChartHint}
          />
          <CardBody>
            <BarChart
              data={weeklyPoints}
              emptyLabel={dict.analytics.emptySeries}
              labelEvery={3}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={dict.dashboard.appointmentsByStatus} />
          <CardBody>
            <DonutChart
              data={statusPoints}
              emptyLabel={dict.analytics.emptySeries}
              centreValue={totalAppointments}
              centreLabel={dict.common.total}
            />
          </CardBody>
        </Card>
      </div>

      {/* --- Lists ------------------------------------------------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title={dict.dashboard.popularServices}
            hint={dict.dashboard.popularServicesHint}
          />
          <CardBody>
            <RankedBars data={popularPoints} emptyLabel={dict.analytics.emptySeries} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={dict.dashboard.recentMessages}
            actions={
              <Link
                href="/messages"
                className="text-[0.8125rem] text-ink-500 underline hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50"
              >
                {dict.notifications.viewAll}
              </Link>
            }
          />
          {messages.length === 0 ? (
            <EmptyState title={dict.messages.empty} hint={dict.messages.emptyHint} />
          ) : (
            <ul className="admin-divide divide-y">
              {messages.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/messages/${row.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-ink-900/[0.03] dark:hover:bg-bone-100/[0.05]"
                  >
                    <span className="flex items-center gap-2">
                      {!row.is_read && (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500 dark:bg-gold-400"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium">
                        {row.name}
                      </span>
                      <span className="tnum shrink-0 text-[0.75rem] text-ink-400 dark:text-ink-300">
                        {formatDateShort(row.created_at.toISOString().slice(0, 10), locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-ink-500 dark:text-bone-300">
                      {excerpt(row.body, 70)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={dict.dashboard.recentReviews}
            actions={
              <Link
                href="/reviews"
                className="text-[0.8125rem] text-ink-500 underline hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50"
              >
                {dict.notifications.viewAll}
              </Link>
            }
          />
          {reviews.length === 0 ? (
            <EmptyState title={dict.reviews.empty} hint={dict.reviews.emptyHint} />
          ) : (
            <ul className="admin-divide divide-y">
              {reviews.map((row) => (
                <li key={row.id} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.9375rem] font-medium">
                      {row.author_name}
                    </span>
                    <Badge tone={row.is_published ? "positive" : "neutral"}>
                      {row.is_published ? dict.common.published : dict.common.unpublished}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
                    {excerpt(text(row.body, locale), 80)}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-ink-400 dark:text-ink-300">
                    {formatDateTime(row.created_at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * One number, with a link to the list it came from.
 *
 * `emphasis` marks the two tiles that mean "something is waiting for you" —
 * pending requests and unread messages — and only when the count is non-zero,
 * so nothing shouts when the clinic is up to date.
 */
function StatTile({
  label,
  value,
  hint,
  href,
  emphasis = false,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "admin-card block px-5 py-4 transition-colors hover:border-ink-900/25 dark:hover:border-bone-100/25 " +
        (emphasis ? "border-gold-500/45 dark:border-gold-400/35" : "")
      }
    >
      <p className="text-[0.75rem] font-medium tracking-wide text-ink-500 uppercase dark:text-ink-300">
        {label}
      </p>
      <p className="tnum mt-2 font-display text-[2rem] leading-none text-ink-900 dark:text-bone-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[0.75rem] text-ink-400 dark:text-ink-300">{hint}</p>
      )}
    </Link>
  );
}
