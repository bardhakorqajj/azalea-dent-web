"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ADMIN_LOCALE_COOKIE } from "@/admin/locale";
import { isLocale } from "@/i18n/config";
import { requireAdminForAction, requireAdminMutation } from "@/lib/admin/auth";
import { destroyAllSessions, destroySession } from "@/lib/admin/session";
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
  if (typeof requested === "string" && isLocale(requested)) {
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

/** Used by the notifications panel to open one item and mark it seen. */
export async function markActivityReadAction(id: string): Promise<void> {
  await requireAdminForAction();
  await execute("update activity set read_at = now() where id = $1 and read_at is null", [
    id,
  ]);
}
