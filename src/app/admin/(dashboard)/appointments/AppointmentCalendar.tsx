import Link from "next/link";

import { appointmentStatusTone, formatMonth, formatTime } from "@/admin/format";
import type { AdminDictionary } from "@/admin/get-dictionary";
import { IconChevronLeft, IconChevronRight } from "@/components/admin/Icons";
import { Badge, Card, buttonClass } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import type { AppointmentStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/**
 * A month of appointments.
 *
 * A server component: the month is part of the address, so moving between
 * months is an ordinary navigation and each month can be linked to directly.
 * Nothing here needs client-side state, and the grid renders before any
 * JavaScript loads.
 *
 * Weeks start on Monday, as the clinic's own opening hours are written.
 */

export type CalendarDay = {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  time: string | null;
  patientName: string;
  status: AppointmentStatus;
  statusLabel: string;
};

export function AppointmentCalendar({
  year,
  month,
  locale,
  days,
  labels,
}: {
  year: number;
  month: number;
  locale: Locale;
  days: CalendarDay[];
  labels: {
    appointments: AdminDictionary["appointments"];
    common: AdminDictionary["common"];
  };
}) {
  const { appointments: t, common } = labels;

  const byDate = new Map<string, CalendarDay[]>();
  for (const day of days) {
    const existing = byDate.get(day.date);
    if (existing) existing.push(day);
    else byDate.set(day.date, [day]);
  }

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  /* getUTCDay() is Sunday-based; shift it so Monday is the first column. */
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7;

  const todayIso = new Date().toISOString().slice(0, 10);

  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const weekdayFormatter = new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
    weekday: "short",
    timeZone: "UTC",
  });
  /* 2024-01-01 was a Monday, so this labels the columns in order. */
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(new Date(Date.UTC(2024, 0, 1 + index))),
  );

  return (
    <Card>
      <div className="admin-divide flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
        <h2 className="font-display text-[1.125rem] text-ink-900 dark:text-bone-50">
          {formatMonth(year, month, locale)}
        </h2>

        <div className="flex items-center gap-2">
          <Link
            href={`/appointments?view=calendar&year=${previous.year}&month=${previous.month}`}
            aria-label={t.previousMonth}
            className={buttonClass("secondary", "sm")}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href="/appointments?view=calendar"
            className={buttonClass("quiet", "sm")}
          >
            {t.monthToday}
          </Link>
          <Link
            href={`/appointments?view=calendar&year=${next.year}&month=${next.month}`}
            aria-label={t.nextMonth}
            className={buttonClass("secondary", "sm")}
          >
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* The grid scrolls inside its own box on a narrow screen rather than
          making the page scroll sideways. */}
      <div className="overflow-x-auto">
        <div className="min-w-[44rem] p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {weekdayNames.map((name) => (
              <div
                key={name}
                className="pb-1 text-center text-[0.6875rem] font-semibold tracking-wide text-ink-400 uppercase dark:text-ink-300"
              >
                {name}
              </div>
            ))}

            {Array.from({ length: leadingBlanks }).map((_, index) => (
              <div key={`blank-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const dayNumber = index + 1;
              const iso = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
              const entries = byDate.get(iso) ?? [];
              const isToday = iso === todayIso;

              return (
                <div
                  key={iso}
                  className={cn(
                    "min-h-[6.25rem] rounded-sm border p-1.5",
                    isToday
                      ? "border-gold-500/60 bg-gold-400/[0.08] dark:border-gold-400/45"
                      : "border-ink-900/8 dark:border-bone-100/10",
                  )}
                >
                  <div className="mb-1 flex items-baseline justify-between">
                    <span
                      className={cn(
                        "tnum text-[0.75rem]",
                        isToday
                          ? "font-semibold text-ink-900 dark:text-gold-300"
                          : "text-ink-400 dark:text-ink-300",
                      )}
                    >
                      {dayNumber}
                    </span>
                    {entries.length > 2 && (
                      <span className="text-[0.625rem] text-ink-400 dark:text-ink-300">
                        {entries.length}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1">
                    {entries.slice(0, 3).map((entry) => (
                      <li key={entry.id}>
                        <Link
                          href={`/appointments/${entry.id}`}
                          title={`${entry.patientName} — ${entry.statusLabel}`}
                          className="block rounded-[2px] bg-ink-900/[0.05] px-1.5 py-1 text-[0.6875rem] leading-tight transition-colors hover:bg-ink-900/[0.10] dark:bg-bone-100/[0.07] dark:hover:bg-bone-100/[0.13]"
                        >
                          <span className="tnum block text-ink-500 dark:text-bone-300">
                            {entry.time ? formatTime(entry.time) : "—"}
                          </span>
                          <span className="block truncate text-ink-800 dark:text-bone-100">
                            {entry.patientName}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {entries.length > 3 && (
                    <Link
                      href={`/appointments?from=${iso}&to=${iso}`}
                      className="mt-1 block px-1.5 text-[0.625rem] text-ink-500 underline dark:text-bone-300"
                    >
                      +{entries.length - 3}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* A legend, because the day cells have no room for a status badge. */}
      <div className="admin-divide flex flex-wrap items-center gap-2 border-t px-5 py-3">
        <span className="text-[0.75rem] text-ink-400 dark:text-ink-300">
          {common.status}:
        </span>
        {(
          [
            ["pending", t.statusPending],
            ["confirmed", t.statusConfirmed],
            ["completed", t.statusCompleted],
            ["cancelled", t.statusCancelled],
            ["no_show", t.statusNoShow],
          ] as const
        ).map(([status, label]) => (
          <Badge key={status} tone={appointmentStatusTone(status)}>
            {label}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
