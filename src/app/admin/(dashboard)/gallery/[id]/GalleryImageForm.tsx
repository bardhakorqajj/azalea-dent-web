"use client";

import { useActionState, useState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  CheckboxField,
  LocalisedField,
  SelectField,
  type SelectOption,
} from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { Callout, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { GalleryImageRow, GalleryKind } from "@/lib/db/types";

/**
 * The edit form for one gallery image.
 *
 * The consent rule is visible here rather than only enforced: choosing
 * "treatment photo" and ticking publish without consent recorded shows the
 * warning immediately and marks the checkbox, instead of letting the save
 * fail. The server refuses it too, and so does the database — this layer is
 * for the person, not for correctness.
 */
export function GalleryImageForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  image,
  categoryOptions,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    gallery: AdminDictionary["gallery"];
    common: AdminDictionary["common"];
  };
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  image: GalleryImageRow;
  categoryOptions: SelectOption[];
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { gallery: t, common } = labels;

  /* Tracked so the warning appears as the boxes are ticked rather than only
     after a failed save. */
  const [kind, setKind] = useState<GalleryKind>(image.kind);
  const [published, setPublished] = useState(image.is_published);
  const [consent, setConsent] = useState(image.consent_on_file);

  const blockedByConsent = kind === "work" && published && !consent;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      <input type="hidden" name="id" value={image.id} />

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Card>
        <CardHeader title={t.altText} />
        <CardBody className="space-y-5">
          <LocalisedField
            name="alt"
            label={t.altText}
            hint={t.altTextHint}
            errors={errors}
            value={image.alt}
            localeLabels={localeLabels}
            multiline
            rows={2}
          />

          <LocalisedField
            name="caption"
            label={t.caption}
            errors={errors}
            value={image.caption}
            localeLabels={localeLabels}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Controlled, so the consent warning below reacts as the kind is
                changed. React renders the selected option on the server too,
                so this still submits the right value before hydration. */}
            <div>
              <label htmlFor="kind" className="admin-label mb-1.5">
                {t.kind}
              </label>
              <select
                id="kind"
                name="kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as GalleryKind)}
                className="admin-control admin-select"
              >
                <option value="clinic">{t.kindClinic}</option>
                <option value="work">{t.kindWork}</option>
                <option value="team">{t.kindTeam}</option>
                <option value="other">{t.kindOther}</option>
              </select>
            </div>

            <SelectField
              name="categoryId"
              label={t.category}
              defaultValue={image.category_id}
              options={categoryOptions}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.consentOnFile} hint={t.consentHint} />
        <CardBody className="space-y-4">
          <label className="flex gap-3">
            <input
              name="consentOnFile"
              type="checkbox"
              defaultChecked={image.consent_on_file}
              onChange={(event) => setConsent(event.target.checked)}
              aria-invalid={errors.consentOnFile ? "true" : undefined}
              className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0 accent-ink-900 dark:accent-gold-400"
            />
            <span className="text-[0.9375rem] leading-snug text-ink-800 dark:text-bone-100">
              {t.consentOnFile}
            </span>
          </label>

          {(blockedByConsent || errors.consentOnFile) && (
            <Callout tone="danger">{t.consentRequired}</Callout>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody className="space-y-4">
          <label className="flex gap-3">
            <input
              name="isPublished"
              type="checkbox"
              defaultChecked={image.is_published}
              onChange={(event) => setPublished(event.target.checked)}
              className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0 accent-ink-900 dark:accent-gold-400"
            />
            <span className="text-[0.9375rem] leading-snug text-ink-800 dark:text-bone-100">
              {common.published}
            </span>
          </label>

          <CheckboxField
            name="isFeatured"
            label={common.featured}
            defaultChecked={image.is_featured}
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
