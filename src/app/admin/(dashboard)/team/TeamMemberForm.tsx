"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { CheckboxField, LocalisedField, TextField } from "@/components/admin/Fields";
import { FormErrorBanner, FormFooter } from "@/components/admin/FormChrome";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Card, CardBody, CardHeader } from "@/components/admin/Ui";
import type { Locale } from "@/i18n/config";
import { idleState, listToLines, type ActionState } from "@/lib/admin/forms";
import type { TeamMemberRow } from "@/lib/db/types";

export function TeamMemberForm({
  action,
  labels,
  localeLabels,
  csrfToken,
  member,
  cancelHref,
  deleteSlot,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    team: AdminDictionary["team"];
    common: AdminDictionary["common"];
    gallery: AdminDictionary["gallery"];
  };
  localeLabels: Record<Locale, string>;
  csrfToken: string;
  member?: TeamMemberRow;
  cancelHref: string;
  deleteSlot?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { team: t, common, gallery } = labels;

  const lines = (field: "qualifications" | "specialties", locale: Locale) =>
    listToLines(member?.[field] ?? [], locale);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />
      {member && <input type="hidden" name="id" value={member.id} />}

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      <Card>
        <CardHeader title={common.name} />
        <CardBody className="space-y-5">
          <TextField
            name="name"
            label={common.name}
            required
            defaultValue={member?.name}
            error={errors.name}
            hint="Dr. Spec. Arbëreshë Korçaj"
          />

          <TextField
            name="slug"
            label={common.slug}
            defaultValue={member?.slug}
            error={errors.slug}
          />

          <LocalisedField
            name="role"
            label={t.role}
            errors={errors}
            value={member?.role}
            localeLabels={localeLabels}
          />

          <LocalisedField
            name="bio"
            label={t.bio}
            errors={errors}
            value={member?.bio}
            localeLabels={localeLabels}
            multiline
            rows={5}
          />

          <ImagePicker
            name="photoId"
            label={t.photo}
            csrfToken={csrfToken}
            currentId={member?.photo_id}
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
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.qualifications} />
        <CardBody className="space-y-5">
          {(
            [
              ["qualifications", t.qualifications, t.qualificationsHint],
              ["specialties", t.specialties, t.specialtiesHint],
            ] as const
          ).map(([field, label, hint]) => (
            <fieldset key={field}>
              <legend className="admin-label mb-1.5">{label}</legend>
              <p className="mb-2.5 text-[0.8125rem] text-ink-500 dark:text-bone-300">
                {hint}
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {(["sq", "en"] as const).map((locale) => (
                  <div key={locale}>
                    <label
                      htmlFor={`${field}.${locale}`}
                      className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.09em] text-ink-500 uppercase dark:text-ink-300"
                    >
                      {localeLabels[locale]}
                    </label>
                    <textarea
                      id={`${field}.${locale}`}
                      name={`${field}.${locale}`}
                      rows={3}
                      defaultValue={lines(field, locale)}
                      className="admin-control resize-y leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.socials} />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["instagram", t.instagram],
              ["facebook", t.facebook],
              ["linkedin", t.linkedin],
              ["tiktok", t.tiktok],
            ] as const
          ).map(([field, label]) => (
            <TextField
              key={field}
              name={`socials.${field}`}
              label={label}
              type="url"
              defaultValue={member?.socials?.[field] ?? ""}
              error={errors[`socials.${field}`]}
              placeholder="https://…"
            />
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={common.status} />
        <CardBody>
          <CheckboxField
            name="isActive"
            label={common.active}
            defaultChecked={member?.is_active ?? true}
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
