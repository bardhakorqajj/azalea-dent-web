import type { Metadata } from "next";
import Link from "next/link";

import {
  appointmentSourceLabel,
  appointmentStatusLabel,
  appointmentStatusTone,
  formatDateShort,
  formatTime,
  monthBounds,
  timeSlotLabel,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { FilterBar } from "@/components/admin/FilterBar";
import { IconCalendar, IconPlus } from "@/components/admin/Icons";
import { Pagination } from "@/components/admin/Pagination";
import {
  ActionLink,
  Badge,
  Card,
  Dash,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { Toast } from "@/components/admin/Toast";
import {
  appointmentsBetween,
  listAppointments,
  type AppointmentFilters,
} from "@/lib/db/repos/appointments";
import { serviceOptions } from "@/lib/db/repos/services";
import { databaseReady } from "@/lib/db/status";
import { APPOINTMENT_STATUSES, oneOf, text } from "@/lib/db/types";
import { pageNumber } from "@/lib/db/sql";

import { AppointmentCalendar } from "./AppointmentCalendar";

export const metadata: Metadata = { title: "Takimet" };

/**
 * The appointment list, and the calendar view of the same rows.
 *
 * Filters live in the query string rather than in component state: a filtered
 * view then has its own address that can be bookmarked and shared, the browser
 * Back button behaves, and none of it needs JavaScript.
 */
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.appointments.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const view = params.view === "calendar" ? "calendar" : "list";
  const services = await serviceOptions();

  const header = (
    <PageHeader
      title={dict.appointments.title}
      description={dict.appointments.subtitle}
      actions={
        <>
          <div className="admin-card flex overflow-hidden p-0.5">
            <ViewTab
              href="/appointments"
              active={view === "list"}
              label={dict.appointments.listView}
            />
            <ViewTab
              href="/appointments?view=calendar"
              active={view === "calendar"}
              label={dict.appointments.calendarView}
            />
          </div>
          <ActionLink href="/appointments/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.appointments.create}
          </ActionLink>
        </>
      }
    />
  );

  const toast = (
    <Toast
      closeLabel={dict.common.close}
      messages={{
        saved: dict.appointments.savedNotice,
        deleted: dict.appointments.deletedNotice,
        error: dict.errors.body,
      }}
    />
  );

  if (view === "calendar") {
    /* One month at a time, one query. The month comes from the query string so
       paging through the calendar is a normal navigation. */
    const now = new Date();
    const year = Number(params.year) || now.getFullYear();
    const month = Number(params.month) || now.getMonth() + 1;
    const safeMonth = Math.min(12, Math.max(1, month));
    const { from, to } = monthBounds(year, safeMonth);
    const rows = await appointmentsBetween(from, to);

    return (
      <>
        {header}
        {toast}
        <div className="mt-6">
          <AppointmentCalendar
            year={year}
            month={safeMonth}
            locale={locale}
            labels={{
              appointments: dict.appointments,
              common: dict.common,
            }}
            days={rows.map((row) => ({
              id: row.id,
              date: row.scheduled_date,
              time: row.scheduled_time,
              patientName: row.patient_name,
              status: row.status,
              statusLabel: appointmentStatusLabel(row.status, dict),
            }))}
          />
        </div>
      </>
    );
  }

  const filters: AppointmentFilters = {
    search: params.q,
    status: oneOf(APPOINTMENT_STATUSES, params.status) ?? "all",
    from: params.from,
    to: params.to,
    serviceId: params.service,
    page: pageNumber(params.page),
    order: "date_desc",
  };

  const page = await listAppointments(filters);
  const hasFilters = Boolean(
    params.q || params.status || params.from || params.to || params.service,
  );

  return (
    <>
      {header}
      {toast}

      <Card className="mt-6">
        <FilterBar
          action="/appointments"
          search={params.q}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          submitLabel={dict.common.filter}
          clearHref="/appointments"
          clearLabel={dict.common.clearFilters}
          hasFilters={hasFilters}
          dateFrom={params.from}
          dateTo={params.to}
          dateLabels={{
            from: dict.appointments.dateFrom,
            to: dict.appointments.dateTo,
          }}
          selects={[
            {
              name: "status",
              label: dict.common.status,
              value: params.status ?? "",
              options: [
                { value: "", label: dict.common.all },
                { value: "pending", label: dict.appointments.statusPending },
                { value: "confirmed", label: dict.appointments.statusConfirmed },
                { value: "completed", label: dict.appointments.statusCompleted },
                { value: "cancelled", label: dict.appointments.statusCancelled },
                { value: "no_show", label: dict.appointments.statusNoShow },
              ],
            },
            {
              name: "service",
              label: dict.appointments.service,
              value: params.service ?? "",
              options: [
                { value: "", label: dict.common.all },
                ...services.map((service) => ({
                  value: service.id,
                  label: text(service.title, locale),
                })),
              ],
            },
          ]}
        />

        {page.rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.appointments.emptyFiltered : dict.appointments.empty}
            hint={hasFilters ? undefined : dict.appointments.emptyHint}
            icon={<IconCalendar />}
            action={
              hasFilters ? (
                <ActionLink href="/appointments" tone="secondary" size="sm">
                  {dict.common.clearFilters}
                </ActionLink>
              ) : (
                <ActionLink href="/appointments/new" tone="primary" size="sm">
                  {dict.appointments.create}
                </ActionLink>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">{dict.common.date}</th>
                  <th scope="col">{dict.appointments.patient}</th>
                  <th scope="col" className="hidden md:table-cell">
                    {dict.appointments.service}
                  </th>
                  <th scope="col" className="hidden lg:table-cell">
                    {dict.appointments.teamMember}
                  </th>
                  <th scope="col" className="hidden sm:table-cell">
                    {dict.appointments.source}
                  </th>
                  <th scope="col">{dict.common.status}</th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="tnum whitespace-nowrap">
                      <Link
                        href={`/appointments/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {formatDateShort(row.scheduled_date, locale)}
                      </Link>
                      <span className="mt-0.5 block text-[0.75rem] text-ink-400 dark:text-ink-300">
                        {row.scheduled_time
                          ? formatTime(row.scheduled_time)
                          : timeSlotLabel(row.time_slot, dict) || dict.appointments.noTime}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/appointments/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.patient_name}
                      </Link>
                      {row.phone && (
                        <span className="mt-0.5 block text-[0.75rem] text-ink-400 dark:text-ink-300">
                          {row.phone}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {row.service_title ? (
                        text(row.service_title, locale)
                      ) : row.service_label ? (
                        row.service_label
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      {row.team_member_name ?? <Dash />}
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {appointmentSourceLabel(row.source, dict)}
                      </span>
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

            <Pagination
              page={page}
              basePath="/appointments"
              params={{
                q: params.q,
                status: params.status,
                from: params.from,
                to: params.to,
                service: params.service,
              }}
              labels={{
                previous: dict.common.previous,
                next: dict.common.next,
                page: dict.common.page,
                of: dict.common.of,
                results: dict.common.results,
              }}
            />
          </>
        )}
      </Card>
    </>
  );
}

function ViewTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "rounded-sm px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors " +
        (active
          ? "bg-ink-900 text-bone-50 dark:bg-gold-400 dark:text-ink-950"
          : "text-ink-500 hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50")
      }
    >
      {label}
    </Link>
  );
}
