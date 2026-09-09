"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import {
  setPassword,
  updateAccountDetails,
  verifyCurrentPassword,
} from "@/lib/admin/account";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  errorState,
  isValidEmail,
  isValidHref,
  lines,
  str,
  successState,
  timeStr,
  type ActionState,
} from "@/lib/admin/forms";
import { passwordProblems, PASSWORD_MIN_LENGTH } from "@/lib/admin/password.mjs";
import {
  createSession,
  destroyAllSessions,
  revokeSession,
} from "@/lib/admin/session";
import { clientIp, clientUserAgent } from "@/lib/admin/auth";
import { writeSettings } from "@/lib/db/repos/settings";
import { asUuid } from "@/lib/db/sql";
import {
  hoursFromDays,
  WEEKDAYS,
  type WeekdayKey,
} from "@/lib/settings/registry";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";
import { interpolate } from "@/lib/utils";

/**
 * Clinic settings, and the admin account.
 *
 * The settings half writes the values the public website states about the
 * clinic, so it invalidates the public cache. The account half never touches
 * it — a password has nothing to do with what the site says.
 */

export async function saveClinicSettingsAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const email = str(formData, "email", 160);
  if (email !== "" && !isValidEmail(email)) {
    redirect("/settings?notice=error");
  }

  /* Social links become hrefs on the public site, so anything that is not
     plainly http(s) or a site-relative path is dropped rather than stored. */
  const links = (["instagram", "facebook", "tiktok", "mapsUrl"] as const).map((field) => {
    const value = str(formData, field, 400);
    return [field, value !== "" && isValidHref(value) ? value : ""] as const;
  });

  await writeSettings({
    clinicName: str(formData, "clinicName", 120),
    descriptor: str(formData, "descriptor", 120),
    email,
    phones: lines(formData, "phones", 6),
    whatsapp: str(formData, "whatsapp", 40),
    viber: str(formData, "viber", 40),
    addressStreet: str(formData, "addressStreet", 200),
    addressLocality: str(formData, "addressLocality", 120),
    addressPostalCode: str(formData, "addressPostalCode", 20),
    ...Object.fromEntries(links),
  });

  refreshPublic(PUBLIC_TAGS.settings);
  redirect("/settings?notice=saved");
}

export async function saveHoursAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const byDay = Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      {
        opens: timeStr(formData, `hours.${day}.opens`) ?? "",
        closes: timeStr(formData, `hours.${day}.closes`) ?? "",
      },
    ]),
  ) as Record<WeekdayKey, { opens: string; closes: string }>;

  await writeSettings({ hours: hoursFromDays(byDay) });

  refreshPublic(PUBLIC_TAGS.settings);
  redirect("/settings?tab=hours&notice=saved");
}

export async function saveNotificationsAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const notifyEmail = str(formData, "notifyEmail", 160);
  if (notifyEmail !== "" && !isValidEmail(notifyEmail)) {
    redirect("/settings?tab=notifications&notice=error");
  }

  await writeSettings({
    notifyOnAppointment: formData.get("notifyOnAppointment") === "on",
    notifyOnMessage: formData.get("notifyOnMessage") === "on",
    notifyEmail,
  });

  redirect("/settings?tab=notifications&notice=saved");
}

/**
 * Changes the admin password.
 *
 * The current password has to be re-entered, so a session left open on an
 * unlocked machine cannot be used to lock the owner out. Every other session
 * is ended, and a fresh one is issued for this browser — so the person who
 * made the change stays signed in and nobody else does.
 */
export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const dict = getAdminDictionary(await getAdminLocale());

  const current = str(formData, "currentPassword", 200);
  const next = str(formData, "newPassword", 200);
  const confirm = str(formData, "confirmPassword", 200);

  if (!(await verifyCurrentPassword(current))) {
    return errorState(dict.settings.passwordWrong, {
      currentPassword: dict.settings.passwordWrong,
    });
  }

  if (next !== confirm) {
    return errorState(dict.settings.passwordMismatch, {
      confirmPassword: dict.settings.passwordMismatch,
    });
  }

  const problems = passwordProblems(next);
  if (problems.length > 0) {
    const messages: Record<string, string> = {
      tooShort: interpolate(dict.settings.passwordTooShort, {
        min: PASSWORD_MIN_LENGTH,
      }),
      tooLong: dict.settings.passwordTooLong,
      tooCommon: dict.settings.passwordTooCommon,
      noWhitespaceOnly: dict.errors.required,
    };
    const first = problems[0] as string;
    return errorState(messages[first] ?? dict.errors.body, {
      newPassword: messages[first] ?? dict.errors.body,
    });
  }

  await setPassword(next);

  /* Everything opened with the old password is now untrustworthy. */
  await destroyAllSessions();
  await createSession({ ip: await clientIp(), userAgent: await clientUserAgent() });

  return successState(dict.settings.passwordChanged);
}

export async function saveAccountAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const email = str(formData, "accountEmail", 160);
  if (!isValidEmail(email)) redirect("/settings?tab=account&notice=error");

  await updateAccountDetails({ email, name: str(formData, "accountName", 120) || null });
  redirect("/settings?tab=account&notice=saved");
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) await revokeSession(id);

  redirect("/settings?tab=account&notice=saved");
}
