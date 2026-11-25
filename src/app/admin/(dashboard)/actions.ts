"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminLocale } from "@/admin/get-dictionary";
import { ADMIN_LOCALE_COOKIE } from "@/admin/locale";
import {
  requireAdminForAction,
  requireAdminMutation,
  UnauthorizedError,
  verifySameOrigin,
} from "@/lib/admin/auth";
import { destroyAllSessions, destroySession, verifyCsrfToken } from "@/lib/admin/session";
import { execute } from "@/lib/db/client";

/**
 * The actions the dashboard chrome itself needs — signing out, switching
 * language, clearing notifications. Section-specific actions live next to
 * their own pages.
 *
 * Every one of them re-checks the session: a server action is reachable by a
 * direct POST, not only by clicking the button that renders it.
 */

export async function signOutAction(formData: FormData): Promise<void> {
  /* CSRF is checked before anything is destroyed, so a cross-site page cannot
     sign the owner out. */
  await requireAdminMutation(formData);
  await destroySession();
  redirect("/admin/login?notice=signed_out");
}

export async function signOutEverywhereAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);
  await destroyAllSessions();
  redirect("/admin/login?notice=signed_out");
}

export async function setAdminLocaleAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const requested = formData.get("locale");
  if (typeof requested === "string" && isAdminLocale(requested)) {
    const store = await cookies();
    store.set(ADMIN_LOCALE_COOKIE, requested, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      /* A year: it is a preference, not a credential. */
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  /* The whole dashboard is re-rendered in the new language. */
  revalidatePath("/admin", "layout");
}

export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);
  await execute("update activity set read_at = now() where read_at is null");
  revalidatePath("/admin", "layout");
}

/**
 * Marks one notification read, when it is clicked in the panel.
 *
 * Called directly from the panel rather than through a form, so the click can
 * go on to open the appointment or message without waiting for it. That is why
 * it takes the CSRF token as an argument and checks it by hand: it gets the
 * same three checks as every form-posted action.
 *
 * Nothing is revalidated: the panel has already shown the item as read, and
 * re-rendering the layout under a navigation that is under way would only
 * slow it down. The next page load reads the badge from the database.
 */
export async function markActivityReadAction(id: string, csrf: string): Promise<void> {
  await requireAdminForAction();
  if (!(await verifySameOrigin())) throw new UnauthorizedError();
  if (!(await verifyCsrfToken(csrf))) throw new UnauthorizedError();

  /* Activity ids are a bigserial, not uuids like the other tables. */
  if (!/^\d{1,18}$/.test(id)) return;
  const activityId = id;

  await execute("update activity set read_at = now() where id = $1 and read_at is null", [
    activityId,
  ]);
}
