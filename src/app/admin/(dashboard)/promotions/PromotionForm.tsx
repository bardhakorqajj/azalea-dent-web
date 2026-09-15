"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { CheckboxField, LocalisedField, TextField } from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Card, CardBody, CardHeader } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { PromotionRow } from "@/lib/db/types";

export function PromotionForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  promotion,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    promotions: AdminDictionary["promotions"];
    common: AdminDictionary["common"];
    gallery: AdminDictionary["gallery"];
  };
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  promotion?: PromotionRow;
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { promotions: t, common, gallery } = labels;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {promotion && <input type="hidden" name="id" value={promotion.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Card>
        <CardHeader title={common.title} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="title"
            label={common.title}
            required
            errors={errors}
            value={promotion?.title}
            localeLabels={localeLabels}
          />

          <TextField
            name="slug"
            label={common.slug}
            defaultValue={promotion?.slug}
            error={errors.slug}
          />

          <LocalisedField
            name="description"
            label={common.description}
            errors={errors}
            value={promotion?.description}
            localeLabels={localeLabels}
            multiline
            rows={4}
          />

          <LocalisedField
            name="discountText"
            label={t.discountText}
            hint={t.discountHint}
            errors={errors}
            value={promotion?.discount_text}
            localeLabels={localeLabels}
          />

          <ImagePicker
            name="imageId"
            label={common.image}
            csrfToken={csrfToken}
            currentId={promotion?.image_id}
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
        <CardHeader title={t.ctaLabel} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="ctaLabel"
            label={t.ctaLabel}
            errors={errors}
            value={promotion?.cta_label}
            localeLabels={localeLabels}
          />
          <TextField
            name="ctaHref"
            label={t.ctaHref}
            defaultValue={promotion?.cta_href}
            error={errors.ctaHref}
            placeholder="/takim"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.date} />
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="startsOn"
              label={t.startsOn}
              type="date"
              defaultValue={promotion?.starts_on}
              error={errors.startsOn}
            />
            <TextField
              name="endsOn"
              label={t.endsOn}
              type="date"
              defaultValue={promotion?.ends_on}
              error={errors.endsOn}
            />
          </div>

          <CheckboxField
            name="isActive"
            label={common.active}
            hint={t.emptyHint}
            defaultChecked={promotion?.is_active ?? false}
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
