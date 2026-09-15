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
  str,
  textBlock,
  type ActionState,
} from "@/lib/admin/forms";
import {
  addPatientTreatment,
  createPatient,
  deletePatient,
  deletePatientTreatment,
  setPatientArchived,
  updatePatient,
  type PatientInput,
} from "@/lib/db/repos/patients";
import { asUuid } from "@/lib/db/sql";

/**
 * Patient mutations.
 *
 * Nothing here touches the public cache, because nothing about a patient is
 * ever published: there is no public route that reads this table, and no
 * `refreshPublic` call to make.
 */

async function readForm(
  formData: FormData,
): Promise<{ ok: true; input: PatientInput } | { ok: false; state: ActionState }> {
  const dict = getAdminDictionary(await getAdminLocale());
  const errors = new Errors();

  const fullName = str(formData, "fullName", 160);
  const phone = str(formData, "phone", 40);
  const email = str(formData, "email", 160);

  errors.require("fullName", fullName, dict);
  if (phone !== "" && !isValidPhone(phone)) errors.add("phone", dict.errors.invalidPhone);
  if (email !== "" && !isValidEmail(email)) errors.add("email", dict.errors.invalidEmail);

  const dateOfBirth = str(formData, "dateOfBirth", 10);
  if (dateOfBirth !== "" && dateStr(formData, "dateOfBirth") === null) {
    errors.add("dateOfBirth", dict.errors.invalidDate);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      fullName,
      phone: phone === "" ? null : phone,
      email: email === "" ? null : email,
      dateOfBirth: dateStr(formData, "dateOfBirth"),
      address: optionalStr(formData, "address", 300),
      notes: textBlock(formData, "notes", 4000) || null,
    },
  };
}

export async function createPatientAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createPatient(parsed.input);
  revalidatePath("/admin", "layout");
  redirect(`/patients/${id}?notice=saved`);
}

export async function updatePatientAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  await updatePatient(id, parsed.input);
  revalidatePath("/admin", "layout");
  redirect(`/patients/${id}?notice=saved`);
}

export async function setPatientArchivedAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await setPatientArchived(id, bool(formData, "archived"));
    revalidatePath("/admin", "layout");
  }
  redirect(id ? `/patients/${id}?notice=saved` : "/patients");
}

export async function deletePatientAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deletePatient(id);
    revalidatePath("/admin", "layout");
  }
  redirect("/patients?notice=deleted");
}

/** Adds one entry to a patient's treatment history. */
export async function addPatientTreatmentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const patientId = asUuid(formData.get("patientId"));
  if (!patientId) redirect("/patients");

  const label = str(formData, "label", 200);
  const performedOn = dateStr(formData, "performedOn");

  /* Both are required for the entry to mean anything; the form marks them as
     such, and a direct POST without them simply does not record a row. */
  if (label === "" || !performedOn) {
    redirect(`/patients/${patientId}?notice=error`);
  }

  await addPatientTreatment({
    patientId,
    treatmentId: asUuid(formData.get("treatmentId")),
    appointmentId: asUuid(formData.get("appointmentId")),
    label,
    performedOn,
    costText: optionalStr(formData, "costText", 60),
    notes: textBlock(formData, "treatmentNotes", 2000) || null,
  });

  redirect(`/patients/${patientId}?notice=saved`);
}

export async function deletePatientTreatmentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const patientId = asUuid(formData.get("patientId"));
  if (id) await deletePatientTreatment(id);

  redirect(patientId ? `/patients/${patientId}?notice=deleted` : "/patients");
}
