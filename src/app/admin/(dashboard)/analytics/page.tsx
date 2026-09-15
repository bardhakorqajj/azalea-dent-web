import type { Metadata } from "next";
import Link from "next/link";

import { appointmentSourceLabel, formatDateShort } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { BarChart, DonutChart, RankedBars, type Point } from "@/components/admin/Charts";
import {
  IconAnalytics,
  IconExternal,
  IconInfo,
} from "@/components/admin/Icons";
import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/admin/Ui";
import {
  appointmentCounts,
  requestsBySource,
  requestsByService,
  requestsPerDay,
} from "@/lib/db/repos/appointments";
import { messagesPerDay } from "@/lib/db/repos/messages";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";

export const metadata: Metadata = { title: "Analitika" };

/**
 * Analytics.
 *
 * Split in two, and the split is the point. The top half is counted from the
 * clinic's own database and is therefore real. The bottom half is the outside
 * services — Google Analytics, Search Console, Instagram — which are not
 * connected, and it says so instead of showing plausible-looking numbers. An
 * invented visitor count would be worse than an empty panel, because the
 * clinic would make decisions on it.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.analytics.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  /* 30, 90 or 365 days — nothing else, so the label always matches the data. */
  const periods = [
    { days: 30, label: dict.analytics.periodLast30 },
    { days: 90, label: dict.analytics.periodLast90 },
    { days: 365, label: dict.analytics.periodLast12Months },
  ];
  const days = periods.find((period) => String(period.days) === params.days)?.days ?? 30;

  const [requests, messages, byService, bySource, counts] = await Promise.all([
    requestsPerDay(days),
    messagesPerDay(days),
    requestsByService(8, days),
    requestsBySource(days),
    appointmentCounts(),
  ]);

  /* A year of daily bars is unreadable, so longer periods are grouped into
     weeks. The totals are identical either way. */
  const requestPoints: Point[] = groupIfLong(requests, days).map((entry) => ({
    label: formatDateShort(entry.day, locale).slice(0, 5),
    value: entry.count,
    hint: `${formatDateShort(entry.day, locale)}: ${entry.count}`,
  }));

  const messagesByDay = new Map(messages.map((entry) => [entry.day, entry.count]));
  const messagePoints: Point[] = groupIfLong(
    requests.map((entry) => ({ day: entry.day, count: messagesByDay.get(entry.day) ?? 0 })),
    days,
  ).map((entry) => ({
    label: formatDateShort(entry.day, locale).slice(0, 5),
    value: entry.count,
    hint: `${formatDateShort(entry.day, locale)}: ${entry.count}`,
  }));

  const servicePoints: Point[] = byService.map((entry) => ({
    label: entry.title
      ? text(entry.title, locale)
      : (entry.label ?? dict.appointments.serviceOther),
    value: entry.count,
  }));

  const sourcePoints: Point[] = bySource.map((entry) => ({
    label: appointmentSourceLabel(entry.source, dict),
    value: entry.count,
  }));

  const decided =
    counts.byStatus.completed + counts.byStatus.cancelled + counts.byStatus.no_show;

  const outcomePoints: Point[] = [
    { label: dict.analytics.completionRate, value: counts.byStatus.completed },
    { label: dict.analytics.cancellationRate, value: counts.byStatus.cancelled },
    { label: dict.analytics.noShowRate, value: counts.byStatus.no_show },
  ].filter((point) => point.value > 0);

  const totalRequests = requests.reduce((sum, entry) => sum + entry.count, 0);
  const totalMessages = messages.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <>
      <PageHeader
        title={dict.analytics.title}
        description={dict.analytics.subtitle}
        actions={
          <div className="admin-card flex overflow-hidden p-0.5">
            {periods.map((period) => (
              <Link
                key={period.days}
                href={`/analytics?days=${period.days}`}
                aria-current={period.days === days ? "page" : undefined}
                className={
                  "rounded-sm px-3 py-1.5 text-[0.8125rem] font-medium transition-colors " +
                  (period.days === days
                    ? "bg-ink-900 text-bone-50 dark:bg-gold-400 dark:text-ink-950"
                    : "text-ink-500 hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50")
                }
              >
                {period.label}
              </Link>
            ))}
          </div>
        }
      />

      {/* --- The clinic's own numbers ------------------------------------ */}
      <section className="mt-7">
        <h2 className="font-display text-[1.25rem] text-ink-900 dark:text-bone-50">
          {dict.analytics.ownDataTitle}
        </h2>
        <p className="mt-1 text-[0.875rem] text-ink-500 dark:text-bone-300">
          {dict.analytics.ownDataHint}
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={dict.analytics.appointmentRequests}
              hint={`${totalRequests} ${dict.common.total.toLowerCase()}`}
            />
            <CardBody>
              <BarChart
                data={requestPoints}
                emptyLabel={dict.analytics.emptySeries}
                labelEvery={Math.max(1, Math.ceil(requestPoints.length / 8))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={dict.analytics.messagesReceived}
              hint={`${totalMessages} ${dict.common.total.toLowerCase()}`}
            />
            <CardBody>
              <BarChart
                data={messagePoints}
                emptyLabel={dict.analytics.emptySeries}
                labelEvery={Math.max(1, Math.ceil(messagePoints.length / 8))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.analytics.requestsByService} />
            <CardBody>
              <RankedBars data={servicePoints} emptyLabel={dict.analytics.emptySeries} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.analytics.requestsBySource} />
            <CardBody>
              <DonutChart
                data={sourcePoints}
                emptyLabel={dict.analytics.emptySeries}
                centreValue={sourcePoints.reduce((sum, point) => sum + point.value, 0)}
                centreLabel={dict.analytics.appointmentRequests}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title={dict.analytics.conversionsTitle} />
            <CardBody>
              <DonutChart
                data={outcomePoints}
                emptyLabel={dict.analytics.emptySeries}
                centreValue={decided}
                centreLabel={dict.appointments.title}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* --- Outside integrations, honestly labelled --------------------- */}
      <section className="mt-10">
        <h2 className="font-display text-[1.25rem] text-ink-900 dark:text-bone-50">
          {dict.analytics.integrationsTitle}
        </h2>

        <Callout tone="info" className="mt-3">
          {dict.analytics.integrationsHint}
        </Callout>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(
            [
              [dict.analytics.googleAnalytics, dict.analytics.googleAnalyticsHint],
              [dict.analytics.searchConsole, dict.analytics.searchConsoleHint],
              [dict.analytics.googleBusiness, dict.analytics.googleBusinessHint],
              [dict.analytics.instagramInsights, dict.analytics.instagramInsightsHint],
              [dict.analytics.facebookInsights, dict.analytics.facebookInsightsHint],
            ] as const
          ).map(([title, hint]) => (
            <Card key={title} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[0.9375rem] font-medium text-ink-900 dark:text-bone-50">
                    {title}
                  </h3>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
                    {hint}
                  </p>
                </div>
                <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-ink-300 dark:text-ink-500" />
              </div>

              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-900/[0.06] px-2.5 py-0.5 text-[0.75rem] font-medium text-ink-500 dark:bg-bone-100/[0.08] dark:text-ink-300">
                {dict.analytics.notConnected}
              </p>
            </Card>
          ))}

          <Card className="flex flex-col justify-center px-5 py-4">
            <IconAnalytics className="h-5 w-5 text-ink-300 dark:text-ink-500" />
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
              {dict.analytics.connectHint}
            </p>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-700 underline dark:text-bone-200"
            >
              <IconExternal className="h-3.5 w-3.5" />
              Google Analytics
            </a>
          </Card>
        </div>
      </section>
    </>
  );
}

/**
 * Groups a daily series into weeks once the period is long enough that daily
 * bars would be illegible. The label is the first day of each bucket.
 */
function groupIfLong(
  series: { day: string; count: number }[],
  days: number,
): { day: string; count: number }[] {
  if (days <= 90) return series;

  const buckets: { day: string; count: number }[] = [];
  for (let index = 0; index < series.length; index += 7) {
    const week = series.slice(index, index + 7);
    const first = week[0];
    if (!first) continue;
    buckets.push({
      day: first.day,
      count: week.reduce((sum, entry) => sum + entry.count, 0),
    });
  }
  return buckets;
}
