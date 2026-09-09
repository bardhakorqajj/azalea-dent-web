"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  CheckboxField,
  FormSection,
  SelectField,
  TextField,
  TextareaField,
  type SelectOption,
} from "@/components/admin/Fields";
import { IconWarning } from "@/components/admin/Icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { ActionLink, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { AppointmentRow } from "@/lib/db/types";

/**
 * The create/edit form for one appointment.
 *
 * A client component so `useActionState` can put each field's error next to
 * the field itself. The inputs are uncontrolled — `defaultValue` throughout —
 * so a failed submit keeps what was typed without a controlled-input dance,
 * and the form still posts before hydration.
 */

export type AppointmentFormLabels = {
  appointments: AdminDictionary["appointments"];
  common: AdminDictionary["common"];
};

export function AppointmentForm({
  action,
  labels,
  csrfToken,
  appointment,
  serviceOptions,
  teamOptions,
  cancelHref,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: AppointmentFormLabels;
  csrfToken: string;
  /** Absent when creating. */
  appointment?: AppointmentRow;
  serviceOptions: SelectOption[];
  teamOptions: SelectOption[];
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { appointments: t, common } = labels;

  const statusOptions: SelectOption[] = [
    { value: "pending", label: t.statusPending },
    { value: "confirmed", label: t.statusConfirmed },
    { value: "completed", label: t.statusCompleted },
    { value: "cancelled", label: t.statusCancelled },
    { value: "no_show", label: t.statusNoShow },
  ];

  const sourceOptions: SelectOption[] = [
    { value: "admin", label: t.sourceAdmin },
    { value: "website", label: t.sourceWebsite },
    { value: "phone", label: t.sourcePhone },
    { value: "walk_in", label: t.sourceWalkIn },
  ];

  const slotOptions: SelectOption[] = [
    { value: "morning", label: t.slotMorning },
    { value: "afternoon", label: t.slotAfternoon },
    { value: "evening", label: t.slotEvening },
  ];

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {appointment && <input type="hidden" name="id" value={appointment.id} />}
      {appointment?.patient_id && (
        <input type="hidden" name="patientId" value={appointment.patient_id} />
      )}

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-sm border border-[#b4442f]/30 bg-[#b4442f]/[0.07] px-4 py-3 text-[0.875rem] text-[#8a3219] dark:border-[#e0806b]/30 dark:bg-[#e0806b]/[0.09] dark:text-[#eaab99]"
        >
          <IconWarning className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      <Card>
        <CardHeader title={t.patient} />
        <CardBody className="space-y-5">
          <TextField
            name="patientName"
            label={t.patientName}
            required
            defaultValue={appointment?.patient_name}
            error={errors.patientName}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="phone"
              label={common.phone}
              type="tel"
              defaultValue={appointment?.phone}
              error={errors.phone}
            />
            <TextField
              name="email"
              label={common.email}
              type="email"
              defaultValue={appointment?.email}
              error={errors.email}
            />
          </div>

          {!appointment && (
            <CheckboxField
              name="createPatient"
              label={t.createPatientFromRequest}
              hint={t.linkedPatient}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.detailsTitle} />
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="scheduledDate"
              label={t.scheduledDate}
              type="date"
              required
              defaultValue={appointment?.scheduled_date}
              error={errors.scheduledDate}
            />
            <TextField
              name="scheduledTime"
              label={t.scheduledTime}
              type="time"
              defaultValue={appointment?.scheduled_time}
              hint={t.noTime}
              error={errors.scheduledTime}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="timeSlot"
              label={t.timeSlot}
              options={slotOptions}
              placeholder={common.none}
              defaultValue={appointment?.time_slot}
            />
            <TextField
              name="durationMinutes"
              label={t.durationLabel}
              type="number"
              min={5}
              step={5}
              defaultValue={appointment?.duration_minutes}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="serviceId"
              label={t.service}
              options={serviceOptions}
              placeholder={t.serviceOther}
              defaultValue={appointment?.service_id}
            />
            <SelectField
              name="teamMemberId"
              label={t.teamMember}
              options={teamOptions}
              placeholder={t.anyTeamMember}
              defaultValue={appointment?.team_member_id}
            />
          </div>

          {/* Kept so a website request that named no known service still says
              what the patient asked for. */}
          <TextField
            name="serviceLabel"
            label={`${t.service} (${common.optional})`}
            defaultValue={appointment?.service_label}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="status"
              label={common.status}
              options={statusOptions}
              defaultValue={appointment?.status ?? "pending"}
            />
            <SelectField
              name="source"
              label={t.source}
              options={sourceOptions}
              defaultValue={appointment?.source ?? "admin"}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.notes} />
        <CardBody className="space-y-5">
          <TextareaField
            name="notes"
            label={t.patientNotes}
            rows={3}
            defaultValue={appointment?.notes}
          />
          <TextareaField
            name="internalNotes"
            label={t.internalNotes}
            hint={t.internalNotesHint}
            rows={3}
            defaultValue={appointment?.internal_notes}
          />
        </CardBody>
      </Card>

      <FormSection>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel={common.saving}>{common.save}</SubmitButton>
          <ActionLink href={cancelHref} tone="quiet">
            {common.cancel}
          </ActionLink>
        </div>
      </FormSection>
    </form>
  );
}
