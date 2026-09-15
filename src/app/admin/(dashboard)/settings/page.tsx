import type { Metadata } from "next";
import Link from "next/link";

import { formatDateTime } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { CheckboxField, TextField, TextareaField } from "@/components/admin/Fields";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  FieldValue,
  PageHeader,
  EmptyState,
} from "@/components/admin/Ui";
import { getAdminAccount } from "@/lib/admin/account";
import { requireAdmin } from "@/lib/admin/auth";
import { adminUrl, adminHostConfigured } from "@/lib/admin/host";
import { formatBytes } from "@/lib/admin/image";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin/password.mjs";
import { listSessions } from "@/lib/admin/session";
import { readCsrfToken } from "@/lib/admin/session";
import { mediaCount, mediaTotalBytes } from "@/lib/db/repos/media";
import { readSettings } from "@/lib/db/repos/settings";
import { databaseStatus } from "@/lib/db/status";
import { hoursByDay, WEEKDAYS, type WeekdayKey } from "@/lib/settings/registry";
import { siteUrl } from "@/lib/site";
import { interpolate } from "@/lib/utils";

import {
  changePasswordAction,
  revokeSessionAction,
  saveAccountAction,
  saveClinicSettingsAction,
  saveHoursAction,
  saveNotificationsAction,
} from "./actions";
import { PasswordForm } from "./PasswordForm";
import { signOutEverywhereAction } from "../actions";

export const metadata: Metadata = { title: "Cilësimet" };

const TABS = ["clinic", "hours", "social", "website", "notifications", "account"] as const;
type Tab = (typeof TABS)[number];

/**
 * Settings.
 *
 * Every field here is an override on the values in `src/content/clinic.ts`:
 * clearing one restores what the website already publishes, which is why none
 * of them is required.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdmin();
  const { dict, locale } = await getAdminContext();

  const status = await databaseStatus();
  if (status.state !== "ready") {
    return (
      <>
        <PageHeader title={dict.settings.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "clinic";

  const [settings, account, sessions, csrfToken, uploads, uploadBytes] =
    await Promise.all([
      readSettings(),
      getAdminAccount(),
      listSessions(),
      readCsrfToken(),
      mediaCount(),
      mediaTotalBytes(),
    ]);

  const csrf = csrfToken ?? "";
  const hours = hoursByDay(settings.hours);

  const dayLabels: Record<WeekdayKey, string> = {
    mon: dict.settings.monday,
    tue: dict.settings.tuesday,
    wed: dict.settings.wednesday,
    thu: dict.settings.thursday,
    fri: dict.settings.friday,
    sat: dict.settings.saturday,
    sun: dict.settings.sunday,
  };

  const tabLabels: Record<Tab, string> = {
    clinic: dict.settings.tabClinic,
    hours: dict.settings.tabHours,
    social: dict.settings.tabSocial,
    website: dict.settings.tabWebsite,
    notifications: dict.settings.tabNotifications,
    account: dict.settings.tabAccount,
  };

  return (
    <>
      <PageHeader title={dict.settings.title} description={dict.settings.subtitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.settings.savedNotice, error: dict.errors.body }}
      />

      <nav className="admin-divide mt-6 flex flex-wrap gap-1 border-b pb-px">
        {TABS.map((candidate) => (
          <Link
            key={candidate}
            href={`/settings?tab=${candidate}`}
            aria-current={tab === candidate ? "page" : undefined}
            className={
              "rounded-t-sm px-4 py-2 text-[0.875rem] font-medium transition-colors " +
              (tab === candidate
                ? "border-b-2 border-ink-900 text-ink-900 dark:border-gold-400 dark:text-bone-50"
                : "text-ink-500 hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50")
            }
          >
            {tabLabels[candidate]}
          </Link>
        ))}
      </nav>

      <div className="mt-6 max-w-3xl">
        {tab === "clinic" && (
          <Card>
            <CardHeader title={dict.settings.tabClinic} />
            <CardBody>
              <form action={saveClinicSettingsAction} className="space-y-5">
                <input type="hidden" name="csrf" value={csrf} />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="clinicName"
                    label={dict.settings.clinicName}
                    defaultValue={settings.clinicName}
                  />
                  <TextField
                    name="descriptor"
                    label={dict.common.description}
                    defaultValue={settings.descriptor}
                  />
                </div>

                <TextField
                  name="email"
                  label={dict.common.email}
                  type="email"
                  defaultValue={settings.email}
                />

                <TextareaField
                  name="phones"
                  label={dict.settings.phones}
                  hint={dict.settings.phonesHint}
                  rows={3}
                  defaultValue={settings.phones.join("\n")}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="whatsapp"
                    label={dict.settings.whatsapp}
                    defaultValue={settings.whatsapp}
                  />
                  <TextField
                    name="viber"
                    label={dict.settings.viber}
                    defaultValue={settings.viber}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <TextField
                    name="addressStreet"
                    label={dict.settings.addressStreet}
                    defaultValue={settings.addressStreet}
                  />
                  <TextField
                    name="addressLocality"
                    label={dict.settings.addressLocality}
                    defaultValue={settings.addressLocality}
                  />
                  <TextField
                    name="addressPostalCode"
                    label={dict.settings.addressPostalCode}
                    defaultValue={settings.addressPostalCode}
                  />
                </div>

                {/* Kept on this form so the social and maps links save with
                    the rest of the clinic's details rather than separately. */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    name="instagram"
                    label="Instagram"
                    type="url"
                    defaultValue={settings.instagram}
                  />
                  <TextField
                    name="facebook"
                    label="Facebook"
                    type="url"
                    defaultValue={settings.facebook}
                  />
                  <TextField
                    name="tiktok"
                    label="TikTok"
                    type="url"
                    defaultValue={settings.tiktok}
                  />
                  <TextField
                    name="mapsUrl"
                    label={dict.settings.mapsUrl}
                    type="url"
                    defaultValue={settings.mapsUrl}
                  />
                </div>

                <SubmitButton pendingLabel={dict.common.saving}>
                  {dict.common.saveChanges}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        )}

        {tab === "hours" && (
          <Card>
            <CardHeader title={dict.settings.hoursTitle} hint={dict.settings.hoursHint} />
            <CardBody>
              <form action={saveHoursAction} className="space-y-4">
                <input type="hidden" name="csrf" value={csrf} />

                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="grid items-end gap-3 sm:grid-cols-[10rem_1fr_1fr]"
                  >
                    <span className="text-[0.9375rem] text-ink-800 dark:text-bone-100">
                      {dayLabels[day]}
                    </span>
                    <TextField
                      name={`hours.${day}.opens`}
                      label={dict.settings.opens}
                      type="time"
                      defaultValue={hours[day].opens}
                    />
                    <TextField
                      name={`hours.${day}.closes`}
                      label={dict.settings.closes}
                      type="time"
                      defaultValue={hours[day].closes}
                    />
                  </div>
                ))}

                <SubmitButton pendingLabel={dict.common.saving}>
                  {dict.common.saveChanges}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        )}

        {tab === "social" && (
          <Card>
            <CardHeader title={dict.settings.tabSocial} />
            <CardBody>
              <dl className="space-y-4">
                <FieldValue label="Instagram">
                  {settings.instagram || dict.common.none}
                </FieldValue>
                <FieldValue label="Facebook">
                  {settings.facebook || dict.common.none}
                </FieldValue>
                <FieldValue label="TikTok">
                  {settings.tiktok || dict.common.none}
                </FieldValue>
              </dl>
              <p className="mt-5 text-[0.875rem] text-ink-500 dark:text-bone-300">
                <Link href="/settings?tab=clinic" className="underline">
                  {dict.settings.tabClinic}
                </Link>
              </p>
            </CardBody>
          </Card>
        )}

        {tab === "website" && (
          <div className="space-y-6">
            <Card>
              <CardHeader title={dict.settings.websiteTitle} />
              <CardBody>
                <dl className="space-y-4">
                  <FieldValue label={dict.settings.siteUrl}>
                    <a
                      href={siteUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline"
                    >
                      {siteUrl()}
                    </a>
                  </FieldValue>
                  <FieldValue label={dict.settings.adminUrl}>
                    <span className="break-all">{adminUrl()}</span>
                  </FieldValue>
                  <FieldValue label={dict.settings.databaseStatus}>
                    <Badge tone="positive">{dict.settings.databaseConnected}</Badge>
                    <span className="ml-2 text-[0.8125rem] text-ink-500 dark:text-bone-300">
                      {interpolate(dict.settings.migrationsApplied, {
                        count: status.migrations,
                      })}
                    </span>
                  </FieldValue>
                  <FieldValue label={dict.gallery.title}>
                    <span className="tnum">
                      {uploads} · {formatBytes(uploadBytes)}
                    </span>
                  </FieldValue>
                </dl>

                {!adminHostConfigured() && (
                  <Callout tone="warning" className="mt-5">
                    ADMIN_HOST is not set, so the dashboard is being served from
                    the same hostname as the website. See DEPLOYMENT.md.
                  </Callout>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {tab === "notifications" && (
          <Card>
            <CardHeader
              title={dict.settings.notificationsTitle}
              hint={dict.settings.notificationsHint}
            />
            <CardBody>
              <form action={saveNotificationsAction} className="space-y-5">
                <input type="hidden" name="csrf" value={csrf} />

                <CheckboxField
                  name="notifyOnAppointment"
                  label={dict.settings.notifyOnAppointment}
                  defaultChecked={settings.notifyOnAppointment}
                />
                <CheckboxField
                  name="notifyOnMessage"
                  label={dict.settings.notifyOnMessage}
                  defaultChecked={settings.notifyOnMessage}
                />

                <TextField
                  name="notifyEmail"
                  label={dict.settings.notifyEmail}
                  type="email"
                  defaultValue={settings.notifyEmail}
                />

                <SubmitButton pendingLabel={dict.common.saving}>
                  {dict.common.saveChanges}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        )}

        {tab === "account" && (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title={dict.settings.accountTitle}
                hint={dict.settings.accountHint}
              />
              <CardBody>
                <form action={saveAccountAction} className="space-y-5">
                  <input type="hidden" name="csrf" value={csrf} />
                  <TextField
                    name="accountEmail"
                    label={dict.common.email}
                    type="email"
                    required
                    defaultValue={account?.email ?? ""}
                  />
                  <TextField
                    name="accountName"
                    label={dict.common.name}
                    defaultValue={account?.name ?? ""}
                  />
                  <SubmitButton pendingLabel={dict.common.saving}>
                    {dict.common.saveChanges}
                  </SubmitButton>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={dict.settings.changePassword} />
              <CardBody>
                <PasswordForm
                  action={changePasswordAction}
                  csrfToken={csrf}
                  minLength={PASSWORD_MIN_LENGTH}
                  labels={{ settings: dict.settings, common: dict.common }}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={dict.settings.sessionsTitle}
                hint={dict.settings.sessionsHint}
              />
              <ul className="admin-divide divide-y">
                {sessions.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.875rem] text-ink-800 dark:text-bone-100">
                        {entry.id === session.id ? (
                          <Badge tone="info">{dict.settings.thisSession}</Badge>
                        ) : (
                          <span className="truncate">{entry.ip ?? "—"}</span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[0.75rem] text-ink-400 dark:text-ink-300">
                        {dict.settings.lastSeen}: {formatDateTime(entry.lastSeenAt, locale)}
                        {entry.userAgent && ` · ${entry.userAgent.slice(0, 60)}`}
                      </p>
                    </div>

                    {entry.id !== session.id && (
                      <form action={revokeSessionAction}>
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="id" value={entry.id} />
                        <ConfirmSubmit
                          label={dict.settings.revokeSession}
                          title={dict.settings.revokeSession}
                          confirmLabel={dict.settings.revokeSession}
                          cancelLabel={dict.common.cancel}
                          tone="quiet"
                        />
                      </form>
                    )}
                  </li>
                ))}
              </ul>
              <CardBody>
                <form action={signOutEverywhereAction}>
                  <input type="hidden" name="csrf" value={csrf} />
                  <ConfirmSubmit
                    label={dict.settings.signOutEverywhere}
                    title={dict.settings.signOutEverywhere}
                    confirmLabel={dict.nav.signOut}
                    cancelLabel={dict.common.cancel}
                  />
                </form>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
