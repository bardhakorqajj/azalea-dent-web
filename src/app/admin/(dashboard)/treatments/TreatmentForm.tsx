"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  CheckboxField,
  LocalisedField,
  SelectField,
  TextField,
  type SelectOption,
} from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Card, CardBody, CardHeader } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { TreatmentRow } from "@/lib/db/types";

export function TreatmentForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  treatment,
  serviceOptions,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    treatments: AdminDictionary["treatments"];
    common: AdminDictionary["common"];
    gallery: AdminDictionary["gallery"];
    services: AdminDictionary["services"];
  };
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  treatment?: TreatmentRow;
  serviceOptions: SelectOption[];
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { treatments: t, common, gallery, services } = labels;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {treatment && <input type="hidden" name="id" value={treatment.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Card>
        <CardHeader title={common.title} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="title"
            label={common.title}
            required
            errors={errors}
            value={treatment?.title}
            localeLabels={localeLabels}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="slug"
              label={common.slug}
              hint={services.slugHint}
              defaultValue={treatment?.slug}
              error={errors.slug}
            />
            <SelectField
              name="serviceId"
              label={t.parentService}
              options={serviceOptions}
              placeholder={t.noParentService}
              defaultValue={treatment?.service_id}
            />
          </div>

          <LocalisedField
            name="summary"
            label={common.summary}
            errors={errors}
            value={treatment?.summary}
            localeLabels={localeLabels}
            multiline
            rows={2}
          />

          <LocalisedField
            name="body"
            label={common.body}
            errors={errors}
            value={treatment?.body}
            localeLabels={localeLabels}
            multiline
            rows={7}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.price} />
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <LocalisedField
              name="priceText"
              label={common.price}
              hint={services.priceHint}
              errors={errors}
              value={treatment?.price_text}
              localeLabels={localeLabels}
            />
            <TextField
              name="durationMinutes"
              label={`${common.duration} (${common.minutes})`}
              type="number"
              min={5}
              step={5}
              defaultValue={treatment?.duration_minutes}
            />
          </div>

          <ImagePicker
            name="imageId"
            label={common.image}
            csrfToken={csrfToken}
            currentId={treatment?.image_id}
            labels={{
              upload: gallery.upload,
              uploading: gallery.uploading,
              remove: common.delete,
              tooLarge: gallery.tooLarge,
              wrongType: gallery.wrongType,
              failed: gallery.uploadFailed,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody className="space-y-4">
          <CheckboxField
            name="isActive"
            label={common.active}
            defaultChecked={treatment?.is_active ?? true}
          />
          <CheckboxField
            name="isFeatured"
            label={common.featured}
            defaultChecked={treatment?.is_featured ?? false}
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
