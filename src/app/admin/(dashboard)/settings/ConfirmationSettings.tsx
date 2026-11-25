import type { AdminDictionary } from "@/admin/get-dictionary";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { LocalisedField } from "@/components/admin/Fields";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Card, CardBody, CardHeader } from "@/components/admin/Ui";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { exampleConfirmation } from "@/lib/appointment-confirmation";
import { DEFAULT_TEMPLATES, PLACEHOLDERS, type Placeholder } from "@/lib/confirmation";
import type { SettingsShape } from "@/lib/settings/registry";

import { resetConfirmationTemplateAction, saveConfirmationTemplateAction } from "./actions";

/**
 * Settings → Confirmation: the wording of the message patients receive when
 * their appointment is confirmed.
 *
 * The fields open on the text in use, the default where the clinic has not
 * changed it, so editing starts from a working message rather than a blank
 * box. The example underneath is rendered by the same code that sends the real
 * thing, with a made-up appointment, so it cannot disagree with what a patient
 * receives.
 */
export function ConfirmationSettings({
  settings,
  csrf,
  dict,
}: {
  settings: SettingsShape;
  csrf: string;
  dict: AdminDictionary;
}) {
  const t = dict.settings;

  const current = (field: "subject" | "body") =>
    Object.fromEntries(
      locales.map((locale) => [
        locale,
        (field === "subject" ? settings.confirmationSubject : settings.confirmationBody)[locale] ??
          DEFAULT_TEMPLATES[locale][field],
      ]),
    ) as Record<Locale, string>;

  const customised = (locale: Locale) =>
    Boolean(settings.confirmationSubject[locale] || settings.confirmationBody[locale]);

  const placeholderHelp: Record<Placeholder, string> = {
    patient: t.placeholderPatient,
    when: t.placeholderWhen,
    date: t.placeholderDate,
    time: t.placeholderTime,
    service: t.placeholderService,
    clinic: t.placeholderClinic,
    address: t.placeholderAddress,
    phone: t.placeholderPhone,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t.confirmationTitle} hint={t.confirmationHint} />
        <CardBody className="space-y-6">
          <div className="rounded-sm border border-ink-900/10 bg-bone-100/60 px-4 py-3 text-[0.875rem] leading-relaxed dark:border-bone-50/10 dark:bg-ink-900/40">
            <p className="font-medium text-ink-800 dark:text-bone-100">{t.placeholdersTitle}</p>
            <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
              {PLACEHOLDERS.map((name) => (
                <div key={name} className="contents">
                  <dt>
                    <code className="font-mono text-[0.8125rem] text-ink-900 dark:text-bone-50">{`{${name}}`}</code>
                  </dt>
                  <dd className="text-ink-600 dark:text-bone-300">{placeholderHelp[name]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-ink-600 dark:text-bone-300">{t.placeholdersLineHint}</p>
          </div>

          <form action={saveConfirmationTemplateAction} className="space-y-6">
            <input type="hidden" name="csrf" value={csrf} />

            <LocalisedField
              name="confirmationSubject"
              label={t.confirmationSubject}
              value={current("subject")}
              localeLabels={localeNames}
              maxLength={200}
            />

            <LocalisedField
              name="confirmationBody"
              label={t.confirmationBody}
              hint={t.confirmationEmptyHint}
              value={current("body")}
              localeLabels={localeNames}
              multiline
              rows={12}
              maxLength={2000}
            />

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel={dict.common.saving}>{dict.common.saveChanges}</SubmitButton>
            </div>
          </form>

          <form action={resetConfirmationTemplateAction}>
            <input type="hidden" name="csrf" value={csrf} />
            <ConfirmSubmit
              label={t.confirmationReset}
              title={t.confirmationResetConfirm}
              body={t.confirmationResetBody}
              confirmLabel={t.confirmationReset}
              cancelLabel={dict.common.cancel}
              tone="quiet"
            />
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.confirmationPreview} hint={t.confirmationPreviewHint} />
        <CardBody className="grid gap-4 xl:grid-cols-3">
          {locales.map((locale) => {
            const example = exampleConfirmation(settings, locale);
            return (
              <div key={locale} className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="admin-label">{localeNames[locale]}</span>
                  <Badge tone={customised(locale) ? "gold" : "neutral"}>
                    {customised(locale) ? t.customisedBadge : t.defaultBadge}
                  </Badge>
                </div>
                <div
                  lang={locale}
                  className="rounded-sm border border-ink-900/10 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-800 dark:border-bone-50/10 dark:text-bone-100"
                >
                  <p className="font-medium">{example.subject}</p>
                  <p className="mt-2 whitespace-pre-line">{example.body}</p>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
