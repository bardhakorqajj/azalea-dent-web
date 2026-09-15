import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  appointmentStatusLabel,
  appointmentStatusTone,
  formatDate,
  formatDateShort,
  formatTime,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { SelectField, TextField, TextareaField } from "@/components/admin/Fields";
import { IconPlus, IconTrash } from "@/components/admin/Icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  Dash,
  EmptyState,
  FieldValue,
  PageHeader,
  TableWrap,
  buttonClass,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { appointmentsForPatient } from "@/lib/db/repos/appointments";
import { getPatient, patientTreatments } from "@/lib/db/repos/patients";
import { treatmentOptions } from "@/lib/db/repos/treatments";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";
import { todayIso } from "@/admin/format";

import {
  addPatientTreatmentAction,
  deletePatientAction,
  deletePatientTreatmentAction,
  setPatientArchivedAction,
  updatePatientAction,
} from "../actions";
import { PatientForm } from "../PatientForm";

export const metadata: Metadata = { title: "Pacienti" };

/**
 * One patient: their details, their appointments, and their treatment
 * history.
 *
 * Everything on this page is clinic-internal. There is no "view on site"
 * link because there is no public page for a patient, and there never will
 * be one.
 */
export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();

  const [patient, appointments, history, treatments, csrfToken] = await Promise.all([
    getPatient(id),
    appointmentsForPatient(id),
    patientTreatments(id),
    treatmentOptions(),
    readCsrfToken(),
  ]);

  if (!patient) notFound();
  const csrf = csrfToken ?? "";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.patients.title, href: "/patients" },
          { label: patient.full_name },
        ]}
      />

      <PageHeader
        title={patient.full_name}
        description={dict.patients.subtitle}
        actions={
          <form action={setPatientArchivedAction}>
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="id" value={patient.id} />
            <input
              type="hidden"
              name="archived"
              value={patient.is_archived ? "" : "on"}
            />
            <button type="submit" className={buttonClass("secondary", "md")}>
              {patient.is_archived ? dict.patients.unarchive : dict.patients.archive}
            </button>
          </form>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.patients.savedNotice,
          deleted: dict.patients.savedNotice,
          error: dict.errors.body,
        }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title={dict.patients.editTitle} />
            <CardBody>
              <PatientForm
                action={updatePatientAction}
                csrfToken={csrf}
                patient={patient}
                cancelHref="/patients"
                labels={{ patients: dict.patients, common: dict.common }}
                deleteSlot={
                  <ConfirmSubmit
                    formAction={deletePatientAction}
                    label={dict.common.delete}
                    title={dict.patients.deleteConfirm}
                    body={dict.patients.deleteConfirmBody}
                    confirmLabel={dict.common.delete}
                    cancelLabel={dict.common.cancel}
                    icon={<IconTrash className="h-4 w-4" />}
                  />
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.patients.appointmentHistory} />
            {appointments.length === 0 ? (
              <EmptyState title={dict.patients.noAppointments} />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th scope="col">{dict.common.date}</th>
                    <th scope="col" className="hidden sm:table-cell">
                      {dict.appointments.service}
                    </th>
                    <th scope="col">{dict.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((row) => (
                    <tr key={row.id}>
                      <td className="tnum whitespace-nowrap">
                        <Link
                          href={`/appointments/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {formatDateShort(row.scheduled_date, locale)}
                        </Link>
                        {row.scheduled_time && (
                          <span className="ml-2 text-[0.75rem] text-ink-400 dark:text-ink-300">
                            {formatTime(row.scheduled_time)}
                          </span>
                        )}
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
            <CardHeader title={dict.patients.treatmentHistory} />
            {history.length === 0 ? (
              <EmptyState title={dict.patients.noTreatments} />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th scope="col">{dict.patients.performedOn}</th>
                    <th scope="col">{dict.patients.treatmentLabel}</th>
                    <th scope="col" className="hidden sm:table-cell">
                      {dict.patients.cost}
                    </th>
                    <th scope="col" className="text-right">
                      {dict.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id}>
                      <td className="tnum whitespace-nowrap">
                        {formatDateShort(row.performed_on, locale)}
                      </td>
                      <td>
                        <span className="font-medium">{row.label}</span>
                        {row.notes && (
                          <span className="mt-0.5 block text-[0.8125rem] text-ink-500 dark:text-bone-300">
                            {row.notes}
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">{row.cost_text ?? <Dash />}</td>
                      <td>
                        <div className="flex justify-end">
                          <form action={deletePatientTreatmentAction}>
                            <input type="hidden" name="csrf" value={csrf} />
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="patientId" value={patient.id} />
                            <ConfirmSubmit
                              label={dict.common.delete}
                              title={dict.common.delete}
                              confirmLabel={dict.common.delete}
                              cancelLabel={dict.common.cancel}
                              tone="quiet"
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={dict.common.total} />
            <CardBody>
              <dl className="space-y-4">
                <FieldValue label={dict.patients.appointmentsCount}>
                  <span className="tnum">{appointments.length}</span>
                </FieldValue>
                <FieldValue label={dict.patients.dateOfBirth}>
                  {patient.date_of_birth ? (
                    formatDate(patient.date_of_birth, locale)
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.common.createdAt}>
                  {formatDate(patient.created_at.toISOString().slice(0, 10), locale)}
                </FieldValue>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.patients.addTreatment} />
            <CardBody>
              {/* A plain form rather than a modal: it is four fields, and the
                  page it posts back to is the one showing the result. */}
              <form action={addPatientTreatmentAction} className="space-y-4">
                <input type="hidden" name="csrf" value={csrf} />
                <input type="hidden" name="patientId" value={patient.id} />

                <TextField
                  name="label"
                  label={dict.patients.treatmentLabel}
                  required
                  maxLength={200}
                />

                <SelectField
                  name="treatmentId"
                  label={`${dict.treatments.title} (${dict.common.optional})`}
                  placeholder={dict.common.none}
                  options={treatments.map((treatment) => ({
                    value: treatment.id,
                    label: text(treatment.title, locale),
                  }))}
                />

                <TextField
                  name="performedOn"
                  label={dict.patients.performedOn}
                  type="date"
                  required
                  defaultValue={todayIso()}
                />

                <TextField name="costText" label={dict.patients.cost} maxLength={60} />

                <TextareaField
                  name="treatmentNotes"
                  label={dict.common.notes}
                  rows={2}
                />

                <SubmitButton
                  pendingLabel={dict.common.saving}
                  tone="secondary"
                  className="w-full"
                >
                  <IconPlus className="h-4 w-4" />
                  {dict.patients.addTreatment}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
