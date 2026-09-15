import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  appointmentSourceLabel,
  appointmentStatusLabel,
  appointmentStatusTone,
  formatDate,
  formatDateTime,
  formatTime,
  timeSlotLabel,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconCheck, IconClose, IconExternal, IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  Dash,
  FieldValue,
  PageHeader,
  buttonClass,
} from "@/components/admin/Ui";
import { telHref } from "@/content/clinic";
import { readCsrfToken } from "@/lib/admin/session";
import { getAppointment } from "@/lib/db/repos/appointments";
import { serviceOptions } from "@/lib/db/repos/services";
import { teamOptions } from "@/lib/db/repos/team";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";

import {
  createPatientFromAppointmentAction,
  deleteAppointmentAction,
  setAppointmentStatusAction,
  updateAppointmentAction,
} from "../actions";
import { AppointmentForm } from "../AppointmentForm";

export const metadata: Metadata = { title: "Takimi" };

/**
 * One appointment: what it is, the one-click status changes, and the full
 * edit form below.
 *
 * Everything on this page is one row, so the summary and the form are shown
 * together rather than behind a tab — confirming a request is the commonest
 * action, and it should not need a form submit.
 */
export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();

  const [appointment, services, team, csrfToken] = await Promise.all([
    getAppointment(id),
    serviceOptions(),
    teamOptions(),
    readCsrfToken(),
  ]);

  if (!appointment) notFound();

  const csrf = csrfToken ?? "";
  const serviceName = appointment.service_title
    ? text(appointment.service_title, locale)
    : appointment.service_label;

  const phoneLink = appointment.phone ? telHref(appointment.phone) : null;
  const emailLink = appointment.email
    ? `mailto:${appointment.email}?subject=${encodeURIComponent(
        `Azalea Dent — ${dict.appointments.title}`,
      )}`
    : null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.appointments.title, href: "/appointments" },
          { label: appointment.patient_name },
        ]}
      />

      <PageHeader
        title={appointment.patient_name}
        description={`${formatDate(appointment.scheduled_date, locale)}${
          appointment.scheduled_time ? ` · ${formatTime(appointment.scheduled_time)}` : ""
        }`}
        actions={
          <Badge tone={appointmentStatusTone(appointment.status)}>
            {appointmentStatusLabel(appointment.status, dict)}
          </Badge>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.appointments.savedNotice,
          error: dict.errors.body,
        }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={dict.appointments.detailsTitle} />
            <CardBody>
              <dl className="grid gap-5 sm:grid-cols-2">
                <FieldValue label={dict.appointments.scheduledDate}>
                  {formatDate(appointment.scheduled_date, locale)}
                </FieldValue>
                <FieldValue label={dict.appointments.scheduledTime}>
                  {appointment.scheduled_time ? (
                    formatTime(appointment.scheduled_time)
                  ) : timeSlotLabel(appointment.time_slot, dict) ? (
                    timeSlotLabel(appointment.time_slot, dict)
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.appointments.service}>
                  {serviceName ?? <Dash />}
                </FieldValue>
                <FieldValue label={dict.appointments.teamMember}>
                  {appointment.team_member_name ?? dict.appointments.anyTeamMember}
                </FieldValue>
                <FieldValue label={dict.common.phone}>
                  {phoneLink ? (
                    <a href={phoneLink} className="hover:underline">
                      {appointment.phone}
                    </a>
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.common.email}>
                  {emailLink ? (
                    <a href={emailLink} className="break-all hover:underline">
                      {appointment.email}
                    </a>
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.appointments.source}>
                  {appointmentSourceLabel(appointment.source, dict)}
                </FieldValue>
                <FieldValue label={dict.appointments.created}>
                  {formatDateTime(appointment.created_at, locale)}
                </FieldValue>
              </dl>

              {appointment.notes && (
                <div className="admin-divide mt-6 border-t pt-5">
                  <FieldValue label={dict.appointments.patientNotes}>
                    <p className="whitespace-pre-line leading-relaxed">
                      {appointment.notes}
                    </p>
                  </FieldValue>
                </div>
              )}

              {appointment.internal_notes && (
                <div className="admin-divide mt-5 border-t pt-5">
                  <FieldValue label={dict.appointments.internalNotes}>
                    <p className="whitespace-pre-line leading-relaxed">
                      {appointment.internal_notes}
                    </p>
                  </FieldValue>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.appointments.editTitle} />
            <CardBody>
              <AppointmentForm
                action={updateAppointmentAction}
                csrfToken={csrf}
                appointment={appointment}
                cancelHref="/appointments"
                labels={{ appointments: dict.appointments, common: dict.common }}
                serviceOptions={services.map((service) => ({
                  value: service.id,
                  label: text(service.title, locale),
                }))}
                teamOptions={team.map((member) => ({
                  value: member.id,
                  label: member.name,
                }))}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={dict.common.status} />
            <CardBody className="space-y-2.5">
              {/* One form per button so each posts only its own status. */}
              {appointment.status !== "confirmed" && (
                <StatusButton
                  id={appointment.id}
                  csrf={csrf}
                  status="confirmed"
                  label={dict.appointments.confirm}
                  tone="primary"
                  icon={<IconCheck className="h-4 w-4" />}
                />
              )}
              {appointment.status !== "completed" && (
                <StatusButton
                  id={appointment.id}
                  csrf={csrf}
                  status="completed"
                  label={dict.appointments.markCompleted}
                  tone="secondary"
                />
              )}
              {appointment.status !== "no_show" && (
                <StatusButton
                  id={appointment.id}
                  csrf={csrf}
                  status="no_show"
                  label={dict.appointments.markNoShow}
                  tone="secondary"
                />
              )}
              {appointment.status !== "cancelled" && (
                <StatusButton
                  id={appointment.id}
                  csrf={csrf}
                  status="cancelled"
                  label={dict.appointments.cancelAppointment}
                  tone="quiet"
                  icon={<IconClose className="h-4 w-4" />}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.appointments.linkedPatient} />
            <CardBody>
              {appointment.patient_id ? (
                <Link
                  href={`/patients/${appointment.patient_id}`}
                  className={buttonClass("secondary", "sm", "w-full")}
                >
                  <IconExternal className="h-4 w-4" />
                  {dict.patients.title}
                </Link>
              ) : (
                <>
                  <p className="mb-3 text-[0.875rem] text-ink-500 dark:text-bone-300">
                    {dict.appointments.noLinkedPatient}
                  </p>
                  <form action={createPatientFromAppointmentAction}>
                    <input type="hidden" name="csrf" value={csrf} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <button type="submit" className={buttonClass("secondary", "sm", "w-full")}>
                      {dict.appointments.createPatientFromRequest}
                    </button>
                  </form>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <form action={deleteAppointmentAction}>
                <input type="hidden" name="csrf" value={csrf} />
                <input type="hidden" name="id" value={appointment.id} />
                <ConfirmSubmit
                  label={dict.common.delete}
                  title={dict.appointments.deleteConfirm}
                  body={dict.appointments.deleteConfirmBody}
                  confirmLabel={dict.common.delete}
                  cancelLabel={dict.common.cancel}
                  icon={<IconTrash className="h-4 w-4" />}
                  className="w-full"
                />
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function StatusButton({
  id,
  csrf,
  status,
  label,
  tone,
  icon,
}: {
  id: string;
  csrf: string;
  status: string;
  label: string;
  tone: "primary" | "secondary" | "quiet";
  icon?: React.ReactNode;
}) {
  return (
    <form action={setAppointmentStatusAction}>
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={buttonClass(tone, "sm", "w-full")}>
        {icon}
        {label}
      </button>
    </form>
  );
}
