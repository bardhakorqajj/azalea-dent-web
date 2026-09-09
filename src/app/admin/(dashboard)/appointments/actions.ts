"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  bool,
  dateStr,
  Errors,
  errorState,
  isValidEmail,
  isValidPhone,
  optionalStr,
  positiveInt,
  str,
  textBlock,
  timeStr,
  type ActionState,
} from "@/lib/admin/forms";
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  setAppointmentStatus,
  updateAppointment,
  type AppointmentInput,
} from "@/lib/db/repos/appointments";
import { createPatient, findPatientByContact } from "@/lib/db/repos/patients";
import { logActivity } from "@/lib/db/repos/activity";
import { asUuid } from "@/lib/db/sql";
import { APPOINTMENT_SOURCES, APPOINTMENT_STATUSES, oneOf, TIME_SLOTS } from "@/lib/db/types";

/**
 * Appointment mutations.
 *
 * Every one starts with `requireAdminMutation`, which checks the session, the
 * CSRF token and the request's origin together — a server action is reachable
 * by a direct POST, so the page having been rendered behind a guard proves
 * nothing about the request that arrives here.
 *
 * The public website's appointment form writes through the same repository,
 * which is why a request from a patient lands as an ordinary row the clinic
 * can confirm, reschedule and complete.
 */

/** Reads and validates the form. Shared by create and update. */
async function readForm(formData: FormData): Promise<
  | { ok: true; input: AppointmentInput }
  | { ok: false; state: ActionState }
> {
  const dict = getAdminDictionary(await getAdminLocale());
  const errors = new Errors();

  const patientName = str(formData, "patientName", 160);
  const phone = str(formData, "phone", 40);
  const email = str(formData, "email", 160);
  const scheduledDate = dateStr(formData, "scheduledDate");

  errors.require("patientName", patientName, dict);

  if (phone !== "" && !isValidPhone(phone)) {
    errors.add("phone", dict.errors.invalidPhone);
  }
  if (email !== "" && !isValidEmail(email)) {
    errors.add("email", dict.errors.invalidEmail);
  }
  /* A date is the one field an appointment cannot do without: without it there
     is nothing to put on the calendar. */
  if (!scheduledDate) errors.add("scheduledDate", dict.errors.invalidDate);

  const status = oneOf(APPOINTMENT_STATUSES, str(formData, "status", 20)) ?? "pending";
  const source = oneOf(APPOINTMENT_SOURCES, str(formData, "source", 20)) ?? "admin";
  const timeSlot = oneOf(TIME_SLOTS, str(formData, "timeSlot", 20));

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      patientId: asUuid(formData.get("patientId")),
      patientName,
      phone: phone === "" ? null : phone,
      email: email === "" ? null : email,
      serviceId: asUuid(formData.get("serviceId")),
      serviceLabel: optionalStr(formData, "serviceLabel", 120),
      teamMemberId: asUuid(formData.get("teamMemberId")),
      scheduledDate: scheduledDate as string,
      scheduledTime: timeStr(formData, "scheduledTime"),
      timeSlot,
      durationMinutes: positiveInt(formData, "durationMinutes"),
      status,
      source,
      notes: textBlock(formData, "notes", 4000) || null,
      internalNotes: textBlock(formData, "internalNotes", 4000) || null,
    },
  };
}

export async function createAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  /* Offered as a checkbox on the form: file this visit against a patient
     record, reusing an existing one when the contact details already match. */
  let patientId = parsed.input.patientId;
  if (!patientId && bool(formData, "createPatient")) {
    const existing = await findPatientByContact({
      phone: parsed.input.phone,
      email: parsed.input.email,
    });
    patientId =
      existing?.id ??
      (await createPatient({
        fullName: parsed.input.patientName,
        phone: parsed.input.phone,
        email: parsed.input.email,
        dateOfBirth: null,
        address: null,
        notes: null,
      }));
  }

  const id = await createAppointment({ ...parsed.input, patientId });

  await logActivity({
    kind: "appointment.created",
    summary: `${parsed.input.patientName} — ${parsed.input.scheduledDate}`,
    entity: "appointment",
    entityId: id,
  });

  revalidatePath("/admin", "layout");
  redirect(`/appointments/${id}?notice=saved`);
}

export async function updateAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  await updateAppointment(id, parsed.input);

  revalidatePath("/admin", "layout");
  redirect(`/appointments/${id}?notice=saved`);
}

/** The one-click status buttons on the detail page. */
export async function setAppointmentStatusAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const status = oneOf(APPOINTMENT_STATUSES, formData.get("status"));
  if (!id || !status) return;

  const before = await getAppointment(id);
  await setAppointmentStatus(id, status);

  if (before && before.status !== status) {
    await logActivity({
      kind: "appointment.status_changed",
      summary: `${before.patient_name}: ${before.status} → ${status}`,
      entity: "appointment",
      entityId: id,
    });
  }

  revalidatePath("/admin", "layout");
  redirect(`/appointments/${id}?notice=saved`);
}

export async function deleteAppointmentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/appointments");

  await deleteAppointment(id);

  revalidatePath("/admin", "layout");
  redirect("/appointments?notice=deleted");
}

/** Creates a patient record from a request that arrived without one. */
export async function createPatientFromAppointmentAction(
  formData: FormData,
): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/appointments");

  const appointment = await getAppointment(id);
  if (!appointment) redirect("/appointments");

  const existing = await findPatientByContact({
    phone: appointment.phone,
    email: appointment.email,
  });

  const patientId =
    existing?.id ??
    (await createPatient({
      fullName: appointment.patient_name,
      phone: appointment.phone,
      email: appointment.email,
      dateOfBirth: null,
      address: null,
      notes: null,
    }));

  await updateAppointment(id, {
    patientId,
    patientName: appointment.patient_name,
    phone: appointment.phone,
    email: appointment.email,
    serviceId: appointment.service_id,
    serviceLabel: appointment.service_label,
    teamMemberId: appointment.team_member_id,
    scheduledDate: appointment.scheduled_date,
    scheduledTime: appointment.scheduled_time,
    timeSlot: appointment.time_slot,
    durationMinutes: appointment.duration_minutes,
    status: appointment.status,
    source: appointment.source,
    notes: appointment.notes,
    internalNotes: appointment.internal_notes,
  });

  revalidatePath("/admin", "layout");
  redirect(`/patients/${patientId}?notice=saved`);
}
