import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, likeTerm } from "@/lib/db/sql";
import { toPage, type Page, type PatientRow, type PatientTreatmentRow } from "@/lib/db/types";

/**
 * Patient records.
 *
 * Deliberately thin: a name, how to reach them, and the clinic's own notes.
 * The clinical record proper lives in the clinic's clinical system — this is
 * the contact and scheduling side of it, which is all a website dashboard has
 * any business holding. Nothing in this table is ever rendered on the public
 * website; there is no public route that reads it.
 */

const PER_PAGE = 25;

/** Unqualified, for the single-row reads. */
const SELECT = `
  id, full_name, phone, email,
  to_char(date_of_birth, 'YYYY-MM-DD') as date_of_birth,
  address, notes, is_archived, created_at, updated_at
`;

/** The same columns qualified, for the list query, which joins. */
const SELECT_P = `
  p.id, p.full_name, p.phone, p.email,
  to_char(p.date_of_birth, 'YYYY-MM-DD') as date_of_birth,
  p.address, p.notes, p.is_archived, p.created_at, p.updated_at
`;

/** The list rows, with the two counts the list column shows. */
export type PatientListRow = PatientRow & {
  appointment_count: number;
  last_visit: string | null;
};

export async function listPatients(filters: {
  search?: string;
  includeArchived?: boolean;
  page?: number;
} = {}): Promise<Page<PatientListRow>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    conditions.push(
      `(p.full_name ilike ${p} escape '\\' or p.phone ilike ${p} escape '\\'
        or p.email ilike ${p} escape '\\')`,
    );
  }

  if (!filters.includeArchived) conditions.push("p.is_archived = false");

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from patient p ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);
  const page = Math.max(1, filters.page ?? 1);

  /* The two aggregates come from a lateral rather than a group-by over the
     join, so a patient with no appointments still appears and the counts stay
     correct when more columns are added to the select. */
  const rows = await query<PatientListRow & { appointment_count: string }>(
    `select ${SELECT_P},
            coalesce(stats.appointment_count, 0)::text as appointment_count,
            to_char(stats.last_visit, 'YYYY-MM-DD') as last_visit
       from patient p
       left join lateral (
         select count(*) as appointment_count,
                max(a.scheduled_date) filter (where a.status = 'completed') as last_visit
           from appointment a
          where a.patient_id = p.id
       ) stats on true
       ${where}
      order by p.created_at desc
      limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    params,
  );

  return toPage(
    rows.map((row) => ({ ...row, appointment_count: Number(row.appointment_count) })),
    total,
    page,
    PER_PAGE,
  );
}

export async function getPatient(id: string): Promise<PatientRow | null> {
  return queryOne<PatientRow>(`select ${SELECT} from patient where id = $1`, [id]);
}

export async function patientCounts(): Promise<{ total: number; newLast30Days: number }> {
  const row = await queryOne<{ total: string; recent: string }>(
    `select count(*) filter (where is_archived = false)::text as total,
            count(*) filter (
              where is_archived = false and created_at >= now() - interval '30 days'
            )::text as recent
       from patient`,
  );
  return { total: Number(row?.total ?? 0), newLast30Days: Number(row?.recent ?? 0) };
}

/**
 * Finds an existing record for someone who has been in touch before, so a
 * website request from a returning patient is not filed as a new person.
 * Matched on phone digits and on email, both of which people write
 * inconsistently.
 */
export async function findPatientByContact(contact: {
  phone?: string | null;
  email?: string | null;
}): Promise<PatientRow | null> {
  const digits = contact.phone?.replace(/\D/g, "") ?? "";
  const email = contact.email?.trim().toLowerCase() ?? "";

  if (digits.length < 6 && email === "") return null;

  return queryOne<PatientRow>(
    `select ${SELECT} from patient
      where (length($1) >= 6 and regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = $1)
         or ($2 <> '' and lower(coalesce(email, '')) = $2)
      order by created_at asc
      limit 1`,
    [digits, email],
  );
}

export type PatientInput = {
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
};

export async function createPatient(input: PatientInput): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into patient (full_name, phone, email, date_of_birth, address, notes)
     values ($1, $2, $3, $4::date, $5, $6)
     returning id`,
    [
      input.fullName,
      input.phone,
      input.email,
      input.dateOfBirth,
      input.address,
      input.notes,
    ],
  );
  return row?.id ?? "";
}

export async function updatePatient(id: string, input: PatientInput): Promise<void> {
  await execute(
    `update patient set
       full_name = $2, phone = $3, email = $4, date_of_birth = $5::date,
       address = $6, notes = $7, updated_at = now()
     where id = $1`,
    [
      id,
      input.fullName,
      input.phone,
      input.email,
      input.dateOfBirth,
      input.address,
      input.notes,
    ],
  );
}

export async function setPatientArchived(id: string, archived: boolean): Promise<void> {
  await execute(
    "update patient set is_archived = $2, updated_at = now() where id = $1",
    [id, archived],
  );
}

export async function deletePatient(id: string): Promise<boolean> {
  /* `patient_treatment` cascades; appointments keep their contact snapshot and
     lose only the link, which is what the schema's `on delete set null` does. */
  return deleteById("patient", id);
}

// === Treatment history ====================================================

export type PatientTreatmentWithName = PatientTreatmentRow & {
  treatment_title: Record<string, string> | null;
};

export async function patientTreatments(
  patientId: string,
): Promise<PatientTreatmentWithName[]> {
  return query<PatientTreatmentWithName>(
    `select pt.id, pt.patient_id::text as patient_id,
            pt.treatment_id::text as treatment_id,
            pt.appointment_id::text as appointment_id,
            pt.label, to_char(pt.performed_on, 'YYYY-MM-DD') as performed_on,
            pt.cost_text, pt.notes, pt.created_at, pt.updated_at,
            t.title as treatment_title
       from patient_treatment pt
       left join treatment t on t.id = pt.treatment_id
      where pt.patient_id = $1::uuid
      order by pt.performed_on desc, pt.created_at desc`,
    [patientId],
  );
}

export async function addPatientTreatment(input: {
  patientId: string;
  treatmentId: string | null;
  appointmentId: string | null;
  label: string;
  performedOn: string;
  costText: string | null;
  notes: string | null;
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into patient_treatment (
       patient_id, treatment_id, appointment_id, label, performed_on, cost_text, notes
     ) values ($1::uuid, $2::uuid, $3::uuid, $4, $5::date, $6, $7)
     returning id`,
    [
      input.patientId,
      input.treatmentId,
      input.appointmentId,
      input.label,
      input.performedOn,
      input.costText,
      input.notes,
    ],
  );
  return row?.id ?? "";
}

export async function deletePatientTreatment(id: string): Promise<boolean> {
  return deleteById("patient_treatment", id);
}
