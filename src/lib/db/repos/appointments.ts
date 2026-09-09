import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, likeTerm } from "@/lib/db/sql";
import {
  toPage,
  type AppointmentRow,
  type AppointmentSource,
  type AppointmentStatus,
  type Page,
  type TimeSlotValue,
} from "@/lib/db/types";

/**
 * Appointments — the busiest table in the dashboard.
 *
 * Rows arrive two ways: typed in here, or submitted through the public
 * website's appointment form, which lands as `source = 'website'` and
 * `status = 'pending'` for the clinic to confirm. Both are the same row, so a
 * website request can be confirmed, rescheduled and completed like any other.
 *
 * The date and the time of day are separate columns, deliberately: see the
 * note on the type parsers in `client.ts`.
 */

const PER_PAGE = 25;

/** Columns every read returns, joined with the names the list has to show. */
const SELECT = `
  a.id, a.patient_id::text as patient_id, a.patient_name, a.phone, a.email,
  a.service_id::text as service_id, a.service_label,
  a.team_member_id::text as team_member_id,
  to_char(a.scheduled_date, 'YYYY-MM-DD') as scheduled_date,
  to_char(a.scheduled_time, 'HH24:MI') as scheduled_time,
  a.time_slot, a.duration_minutes, a.status, a.source,
  a.notes, a.internal_notes, a.locale, a.created_at, a.updated_at
`;

export type AppointmentWithNames = AppointmentRow & {
  service_title: Record<string, string> | null;
  team_member_name: string | null;
};

const SELECT_WITH_NAMES = `
  ${SELECT},
  s.title as service_title,
  t.name  as team_member_name
`;

const FROM_WITH_NAMES = `
  from appointment a
  left join service s     on s.id = a.service_id
  left join team_member t on t.id = a.team_member_id
`;

export type AppointmentFilters = {
  search?: string;
  status?: AppointmentStatus | "all";
  from?: string;
  to?: string;
  serviceId?: string;
  teamMemberId?: string;
  patientId?: string;
  page?: number;
  /** Upcoming first for the day list, newest first for the request queue. */
  order?: "date_asc" | "date_desc" | "created_desc";
};

function buildFilters(filters: AppointmentFilters): {
  where: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    conditions.push(
      `(a.patient_name ilike ${p} escape '\\' or a.phone ilike ${p} escape '\\'
        or a.email ilike ${p} escape '\\' or a.notes ilike ${p} escape '\\')`,
    );
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`a.status = $${params.length}`);
  }

  if (filters.from) {
    params.push(filters.from);
    conditions.push(`a.scheduled_date >= $${params.length}::date`);
  }

  if (filters.to) {
    params.push(filters.to);
    conditions.push(`a.scheduled_date <= $${params.length}::date`);
  }

  if (filters.serviceId) {
    params.push(filters.serviceId);
    conditions.push(`a.service_id = $${params.length}::uuid`);
  }

  if (filters.teamMemberId) {
    params.push(filters.teamMemberId);
    conditions.push(`a.team_member_id = $${params.length}::uuid`);
  }

  if (filters.patientId) {
    params.push(filters.patientId);
    conditions.push(`a.patient_id = $${params.length}::uuid`);
  }

  return {
    where: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    params,
  };
}

const ORDERS: Record<NonNullable<AppointmentFilters["order"]>, string> = {
  /* Nulls last, so an appointment with no time yet sits after the timed ones
     for that day rather than leading the morning. */
  date_asc: "a.scheduled_date asc, a.scheduled_time asc nulls last",
  date_desc: "a.scheduled_date desc, a.scheduled_time desc nulls last",
  created_desc: "a.created_at desc",
};

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Page<AppointmentWithNames>> {
  const { where, params } = buildFilters(filters);

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from appointment a ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);

  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PER_PAGE;
  const order = ORDERS[filters.order ?? "date_desc"];

  const rows = await query<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES} ${where}
      order by ${order}
      limit ${PER_PAGE} offset ${offset}`,
    params,
  );

  return toPage(rows, total, page, PER_PAGE);
}

export async function getAppointment(id: string): Promise<AppointmentWithNames | null> {
  return queryOne<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES} where a.id = $1`,
    [id],
  );
}

/** Every appointment in a date range — the calendar's single query. */
export async function appointmentsBetween(
  from: string,
  to: string,
): Promise<AppointmentWithNames[]> {
  return query<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES}
      where a.scheduled_date between $1::date and $2::date
      order by a.scheduled_date asc, a.scheduled_time asc nulls last`,
    [from, to],
  );
}

export async function appointmentsForPatient(
  patientId: string,
): Promise<AppointmentWithNames[]> {
  return query<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES}
      where a.patient_id = $1::uuid
      order by a.scheduled_date desc, a.scheduled_time desc nulls last`,
    [patientId],
  );
}

export type AppointmentInput = {
  patientId: string | null;
  patientName: string;
  phone: string | null;
  email: string | null;
  serviceId: string | null;
  serviceLabel: string | null;
  teamMemberId: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  timeSlot: TimeSlotValue | null;
  durationMinutes: number | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  internalNotes: string | null;
  locale?: string | null;
};

export async function createAppointment(input: AppointmentInput): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into appointment (
       patient_id, patient_name, phone, email, service_id, service_label,
       team_member_id, scheduled_date, scheduled_time, time_slot,
       duration_minutes, status, source, notes, internal_notes, locale
     ) values (
       $1::uuid, $2, $3, $4, $5::uuid, $6,
       $7::uuid, $8::date, $9::time, $10,
       $11, $12, $13, $14, $15, $16
     ) returning id`,
    [
      input.patientId,
      input.patientName,
      input.phone,
      input.email,
      input.serviceId,
      input.serviceLabel,
      input.teamMemberId,
      input.scheduledDate,
      input.scheduledTime,
      input.timeSlot,
      input.durationMinutes,
      input.status,
      input.source,
      input.notes,
      input.internalNotes,
      input.locale ?? null,
    ],
  );
  return row?.id ?? "";
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<void> {
  await execute(
    `update appointment set
       patient_id       = $2::uuid,
       patient_name     = $3,
       phone            = $4,
       email            = $5,
       service_id       = $6::uuid,
       service_label    = $7,
       team_member_id   = $8::uuid,
       scheduled_date   = $9::date,
       scheduled_time   = $10::time,
       time_slot        = $11,
       duration_minutes = $12,
       status           = $13,
       source           = $14,
       notes            = $15,
       internal_notes   = $16,
       updated_at       = now()
     where id = $1`,
    [
      id,
      input.patientId,
      input.patientName,
      input.phone,
      input.email,
      input.serviceId,
      input.serviceLabel,
      input.teamMemberId,
      input.scheduledDate,
      input.scheduledTime,
      input.timeSlot,
      input.durationMinutes,
      input.status,
      input.source,
      input.notes,
      input.internalNotes,
    ],
  );
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  await execute(
    "update appointment set status = $2, updated_at = now() where id = $1",
    [id, status],
  );
}

/** Links a request that arrived without one to a patient record. */
export async function linkAppointmentToPatient(
  id: string,
  patientId: string,
): Promise<void> {
  await execute(
    "update appointment set patient_id = $2::uuid, updated_at = now() where id = $1",
    [id, patientId],
  );
}

export async function deleteAppointment(id: string): Promise<boolean> {
  return deleteById("appointment", id);
}

// === Counts for the dashboard ============================================

export type AppointmentCounts = {
  today: number;
  upcoming: number;
  pending: number;
  completedThisMonth: number;
  byStatus: Record<AppointmentStatus, number>;
};

export async function appointmentCounts(): Promise<AppointmentCounts> {
  /* One round trip rather than five: the dashboard renders these together and
     each of them is a scan of the same small table. */
  const row = await queryOne<{
    today: string;
    upcoming: string;
    pending: string;
    completed_this_month: string;
  }>(
    `select
       count(*) filter (
         where scheduled_date = current_date
           and status in ('pending', 'confirmed')
       )::text as today,
       count(*) filter (
         where scheduled_date > current_date
           and status in ('pending', 'confirmed')
       )::text as upcoming,
       count(*) filter (where status = 'pending')::text as pending,
       count(*) filter (
         where status = 'completed'
           and scheduled_date >= date_trunc('month', current_date)::date
       )::text as completed_this_month
     from appointment`,
  );

  const statusRows = await query<{ status: AppointmentStatus; count: string }>(
    "select status, count(*)::text as count from appointment group by status",
  );

  const byStatus: Record<AppointmentStatus, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
  for (const entry of statusRows) byStatus[entry.status] = Number(entry.count);

  return {
    today: Number(row?.today ?? 0),
    upcoming: Number(row?.upcoming ?? 0),
    pending: Number(row?.pending ?? 0),
    completedThisMonth: Number(row?.completed_this_month ?? 0),
    byStatus,
  };
}

export async function pendingAppointmentCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from appointment where status = 'pending'",
  );
  return Number(row?.count ?? 0);
}

/** Today's list for the dashboard, in the order the clinic works through it. */
export async function todaysAppointments(): Promise<AppointmentWithNames[]> {
  return query<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES}
      where a.scheduled_date = current_date
      order by a.scheduled_time asc nulls last`,
  );
}

export async function upcomingAppointments(limit = 6): Promise<AppointmentWithNames[]> {
  return query<AppointmentWithNames>(
    `select ${SELECT_WITH_NAMES} ${FROM_WITH_NAMES}
      where a.scheduled_date > current_date
        and a.status in ('pending', 'confirmed')
      order by a.scheduled_date asc, a.scheduled_time asc nulls last
      limit $1`,
    [limit],
  );
}

/** Requests per week, for the dashboard chart. Weeks with none are filled in. */
export async function requestsPerWeek(
  weeks: number,
): Promise<{ weekStart: string; count: number }[]> {
  const rows = await query<{ week_start: string; count: string }>(
    `with span as (
       select generate_series(
         date_trunc('week', current_date) - ($1::int - 1) * interval '1 week',
         date_trunc('week', current_date),
         interval '1 week'
       )::date as week_start
     )
     select to_char(span.week_start, 'YYYY-MM-DD') as week_start,
            count(a.id)::text as count
       from span
       left join appointment a
         on date_trunc('week', a.created_at)::date = span.week_start
      group by span.week_start
      order by span.week_start`,
    [weeks],
  );

  return rows.map((row) => ({ weekStart: row.week_start, count: Number(row.count) }));
}

/** Requests per day, for the analytics page. */
export async function requestsPerDay(
  days: number,
): Promise<{ day: string; count: number }[]> {
  const rows = await query<{ day: string; count: string }>(
    `with span as (
       select generate_series(
         current_date - ($1::int - 1),
         current_date,
         interval '1 day'
       )::date as day
     )
     select to_char(span.day, 'YYYY-MM-DD') as day, count(a.id)::text as count
       from span
       left join appointment a on a.created_at::date = span.day
      group by span.day
      order by span.day`,
    [days],
  );
  return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
}

/**
 * Which services are actually being asked for, counted from real requests.
 * Falls back to the free-text label for requests that named no known service.
 */
export async function requestsByService(
  limit = 6,
  sinceDays?: number,
): Promise<{ serviceId: string | null; title: Record<string, string> | null; label: string | null; count: number }[]> {
  const rows = await query<{
    service_id: string | null;
    title: Record<string, string> | null;
    label: string | null;
    count: string;
  }>(
    `select a.service_id::text as service_id, s.title, a.service_label as label,
            count(*)::text as count
       from appointment a
       left join service s on s.id = a.service_id
      where ($2::int is null or a.created_at >= current_date - ($2::int - 1))
        and (a.service_id is not null or a.service_label is not null)
      group by a.service_id, s.title, a.service_label
      order by count(*) desc
      limit $1`,
    [limit, sinceDays ?? null],
  );

  return rows.map((row) => ({
    serviceId: row.service_id,
    title: row.title,
    label: row.label,
    count: Number(row.count),
  }));
}

export async function requestsBySource(
  sinceDays?: number,
): Promise<{ source: AppointmentSource; count: number }[]> {
  const rows = await query<{ source: AppointmentSource; count: string }>(
    `select source, count(*)::text as count
       from appointment
      where ($1::int is null or created_at >= current_date - ($1::int - 1))
      group by source
      order by count(*) desc`,
    [sinceDays ?? null],
  );
  return rows.map((row) => ({ source: row.source, count: Number(row.count) }));
}
