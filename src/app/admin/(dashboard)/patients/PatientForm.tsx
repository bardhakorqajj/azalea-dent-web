"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { TextField, TextareaField } from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { Callout, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { PatientRow } from "@/lib/db/types";

export function PatientForm({
  action,
  labels,
  csrfToken,
  patient,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    patients: AdminDictionary["patients"];
    common: AdminDictionary["common"];
  };
  csrfToken: string;
  patient?: PatientRow;
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { patients: t, common } = labels;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {patient && <input type="hidden" name="id" value={patient.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      {/* Stated on the form itself, not only in a policy document: the person
          typing here is the one deciding what gets stored. */}
      <Callout tone="info">{t.privacyNotice}</Callout>

      <Card>
        <CardHeader title={t.title} />
        <CardBody className="space-y-5">
          <TextField
            name="fullName"
            label={t.fullName}
            required
            defaultValue={patient?.full_name}
            error={errors.fullName}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="phone"
              label={common.phone}
              type="tel"
              defaultValue={patient?.phone}
              error={errors.phone}
            />
            <TextField
              name="email"
              label={common.email}
              type="email"
              defaultValue={patient?.email}
              error={errors.email}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="dateOfBirth"
              label={`${t.dateOfBirth} (${common.optional})`}
              type="date"
              defaultValue={patient?.date_of_birth}
              error={errors.dateOfBirth}
            />
            <TextField
              name="address"
              label={`${t.address} (${common.optional})`}
              defaultValue={patient?.address}
            />
          </div>

          <TextareaField
            name="notes"
            label={t.internalNotes}
            rows={4}
            defaultValue={patient?.notes}
          />
        </CardBody>
      </Card>

      <FormFooter
        saveLabel={common.save}
        savingLabel={common.saving}
        cancelHref={cancelHref}
        cancelLabel={common.cancel}
        extra={deleteSlot}
      />
    </form>
  );
}
