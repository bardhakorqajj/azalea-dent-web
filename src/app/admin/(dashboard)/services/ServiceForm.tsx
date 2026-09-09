"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  CheckboxField,
  LocalisedField,
  TextField,
} from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Card, CardBody, CardHeader } from "@/components/admin/Ui";
import { idleState, listToLines, type ActionState } from "@/lib/admin/forms";
import type { Locale } from "@/i18n/config";
import type { ServiceRow } from "@/lib/db/types";

/**
 * The create/edit form for one service.
 *
 * Both languages are shown side by side rather than behind a tab: keeping the
 * Albanian and the English copy in step is the point of this screen, and a tab
 * hides the fact that one of them is empty.
 */

export type ServiceFormLabels = {
  services: AdminDictionary["services"];
  common: AdminDictionary["common"];
  gallery: AdminDictionary["gallery"];
};

export function ServiceForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  service,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: ServiceFormLabels;
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  service?: ServiceRow;
  cancelHref: string;
  /** The delete button, rendered by the page that knows the id. */
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { services: t, common, gallery } = labels;

  /* The highlights list is edited as one line per point in each language, so
     the two columns line up by position. */
  const highlightLines: Record<Locale, string> = {
    sq: listToLines(service?.highlights ?? [], "sq"),
    en: listToLines(service?.highlights ?? [], "en"),
  };

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {service && <input type="hidden" name="id" value={service.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Card>
        <CardHeader title={common.title} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="title"
            label={common.title}
            required
            errors={errors}
            value={service?.title}
            localeLabels={localeLabels}
          />

          <TextField
            name="slug"
            label={common.slug}
            hint={t.slugHint}
            defaultValue={service?.slug}
            error={errors.slug}
            placeholder="implante-dentare"
          />

          <LocalisedField
            name="summary"
            label={common.summary}
            errors={errors}
            value={service?.summary}
            localeLabels={localeLabels}
            multiline
            rows={2}
          />

          <LocalisedField
            name="body"
            label={common.body}
            errors={errors}
            value={service?.body}
            localeLabels={localeLabels}
            multiline
            rows={8}
          />

          {/* Not a LocalisedField: the value is a list, edited as lines. */}
          <fieldset>
            <legend className="admin-label mb-1.5">{t.highlights}</legend>
            <p className="mb-2.5 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
              {t.highlightsHint}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {(["sq", "en"] as const).map((locale) => (
                <div key={locale}>
                  <label
                    htmlFor={`highlights.${locale}`}
                    className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.09em] text-ink-500 uppercase dark:text-ink-300"
                  >
                    {localeLabels[locale]}
                  </label>
                  <textarea
                    id={`highlights.${locale}`}
                    name={`highlights.${locale}`}
                    rows={4}
                    defaultValue={highlightLines[locale]}
                    className="admin-control resize-y leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.image} />
        <CardBody className="space-y-5">
          <ImagePicker
            name="imageId"
            label={common.image}
            csrfToken={csrfToken}
            currentId={service?.image_id}
            hint={gallery.emptyHint}
            labels={{
              upload: gallery.upload,
              uploading: gallery.uploading,
              remove: common.delete,
              tooLarge: gallery.tooLarge,
              wrongType: gallery.wrongType,
              failed: gallery.uploadFailed,
            }}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <LocalisedField
              name="priceText"
              label={common.price}
              hint={t.priceHint}
              errors={errors}
              value={service?.price_text}
              localeLabels={localeLabels}
            />
            <TextField
              name="durationMinutes"
              label={`${common.duration} (${common.minutes})`}
              type="number"
              min={5}
              step={5}
              defaultValue={service?.duration_minutes}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.seo} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="seoTitle"
            label={common.seoTitle}
            errors={errors}
            value={service?.seo_title}
            localeLabels={localeLabels}
          />
          <LocalisedField
            name="seoDescription"
            label={common.seoDescription}
            errors={errors}
            value={service?.seo_description}
            localeLabels={localeLabels}
            multiline
            rows={2}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody className="space-y-4">
          <CheckboxField
            name="isActive"
            label={common.active}
            hint={t.inactiveHint}
            defaultChecked={service?.is_active ?? true}
          />
          <CheckboxField
            name="isFeatured"
            label={common.featured}
            defaultChecked={service?.is_featured ?? false}
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
