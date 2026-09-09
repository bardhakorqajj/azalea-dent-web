"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  CheckboxField,
  LocalisedField,
  SelectField,
  TextField,
} from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { Callout, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { ReviewRow } from "@/lib/db/types";

export function ReviewForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  review,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    reviews: AdminDictionary["reviews"];
    common: AdminDictionary["common"];
  };
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  review?: ReviewRow;
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { reviews: t, common } = labels;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {review && <input type="hidden" name="id" value={review.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      {/* Said on the form, where it matters. */}
      <Callout tone="warning">{t.honestyNotice}</Callout>

      <Card>
        <CardHeader title={t.title} />
        <CardBody className="space-y-5">
          <TextField
            name="authorName"
            label={t.authorName}
            required
            defaultValue={review?.author_name}
            error={errors.authorName}
          />

          <LocalisedField
            name="body"
            label={t.reviewBody}
            required
            errors={errors}
            value={review?.body}
            localeLabels={localeLabels}
            multiline
            rows={4}
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              name="rating"
              label={t.rating}
              placeholder={t.noRating}
              defaultValue={review?.rating ? String(review.rating) : ""}
              error={errors.rating}
              options={[5, 4, 3, 2, 1].map((stars) => ({
                value: String(stars),
                label: "★".repeat(stars) + "☆".repeat(5 - stars),
              }))}
            />
            <SelectField
              name="source"
              label={t.source}
              defaultValue={review?.source ?? "manual"}
              options={[
                { value: "manual", label: t.sourceManual },
                { value: "google", label: t.sourceGoogle },
                { value: "facebook", label: t.sourceFacebook },
                { value: "instagram", label: t.sourceInstagram },
                { value: "other", label: t.sourceOther },
              ]}
            />
            <TextField
              name="reviewedOn"
              label={t.reviewedOn}
              type="date"
              defaultValue={review?.reviewed_on}
            />
          </div>

          <TextField
            name="externalUrl"
            label={`${t.source} — ${common.slug}`}
            type="url"
            defaultValue={review?.external_url}
            error={errors.externalUrl}
            placeholder="https://…"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody className="space-y-4">
          <CheckboxField
            name="isPublished"
            label={common.published}
            defaultChecked={review?.is_published ?? false}
          />
          <CheckboxField
            name="isFeatured"
            label={common.featured}
            defaultChecked={review?.is_featured ?? false}
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
