"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import {
  SelectField,
  TextField,
  TextareaField,
} from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Callout, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import { idleState, type ActionState } from "@/lib/admin/forms";
import type { SocialPostRow } from "@/lib/db/types";

/**
 * The create/edit form for one social post.
 *
 * The notice about publishing not being connected is part of the form rather
 * than a footnote: someone filling this in should know before they set a
 * status that "Scheduled" is a reminder and not an instruction to a machine.
 */
export function SocialPostForm({
  action,
  labels,
  csrfToken,
  post,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    social: AdminDictionary["social"];
    common: AdminDictionary["common"];
    gallery: AdminDictionary["gallery"];
  };
  csrfToken: string;
  post?: SocialPostRow;
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { social: t, common, gallery } = labels;

  /* A `datetime-local` input wants `YYYY-MM-DDTHH:MM` in local time. */
  const scheduledValue = post?.scheduled_for
    ? new Date(
        post.scheduled_for.getTime() -
          post.scheduled_for.getTimezoneOffset() * 60_000,
      )
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {post && <input type="hidden" name="id" value={post.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Callout tone="warning" title={t.publishingNotice}>
        {t.publishingNoticeBody}
      </Callout>

      <Card>
        <CardHeader title={t.caption} hint={t.twoPerWeekHint} />
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="platform"
              label={t.platform}
              defaultValue={post?.platform ?? "instagram"}
              options={[
                { value: "instagram", label: "Instagram" },
                { value: "facebook", label: "Facebook" },
                { value: "tiktok", label: "TikTok" },
                { value: "other", label: common.none },
              ]}
            />
            <SelectField
              name="language"
              label={common.language}
              defaultValue={post?.language ?? "sq"}
              options={[
                { value: "sq", label: common.albanian },
                { value: "en", label: common.english },
              ]}
            />
          </div>

          <TextField
            name="headline"
            label={`${t.headline} (${common.optional})`}
            defaultValue={post?.headline}
            maxLength={200}
          />

          <TextareaField
            name="caption"
            label={t.caption}
            required
            rows={7}
            defaultValue={post?.caption}
            error={errors.caption}
            maxLength={4000}
          />

          <TextField
            name="hashtags"
            label={t.hashtags}
            hint={t.hashtagsHint}
            defaultValue={(post?.hashtags ?? []).join(" ")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.image} />
        <CardBody className="space-y-5">
          <ImagePicker
            name="mediaId"
            label={common.image}
            csrfToken={csrfToken}
            currentId={post?.media_id}
            labels={{
              upload: gallery.upload,
              uploading: gallery.uploading,
              remove: common.delete,
              tooLarge: gallery.tooLarge,
              wrongType: gallery.wrongType,
              failed: gallery.uploadFailed,
            }}
          />

          <TextareaField
            name="mediaSuggestion"
            label={t.mediaSuggestion}
            hint={t.mediaSuggestionHint}
            rows={2}
            defaultValue={post?.media_suggestion}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="status"
              label={common.status}
              defaultValue={post?.status ?? "draft"}
              options={[
                { value: "draft", label: t.statusDraft },
                { value: "ready_for_approval", label: t.statusReady },
                { value: "approved", label: t.statusApproved },
                { value: "scheduled", label: t.statusScheduled },
                { value: "published", label: t.statusPublished },
                { value: "failed", label: t.statusFailed },
              ]}
            />
            <TextField
              name="scheduledFor"
              label={t.scheduledFor}
              type="datetime-local"
              defaultValue={scheduledValue}
              error={errors.scheduledFor}
            />
          </div>

          <TextField
            name="externalUrl"
            label={t.externalUrl}
            hint={t.externalUrlHint}
            type="url"
            defaultValue={post?.external_url}
            error={errors.externalUrl}
          />

          <TextareaField
            name="notes"
            label={common.notes}
            rows={2}
            defaultValue={post?.notes}
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
