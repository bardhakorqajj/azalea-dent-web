import { redirect } from "next/navigation";

import { requireAdminForAction, verifySameOrigin } from "@/lib/admin/auth";
import { verifyCsrfToken } from "@/lib/admin/session";
import { execute } from "@/lib/db/client";

/**
 * Clears the notification badge.
 *
 * A plain form POST rather than a server action, so the notifications panel
 * works before the page has hydrated — the panel is one of the first things
 * the owner reaches for on a slow connection.
 *
 * Both checks a server action would get through `requireAdminMutation` are
 * done by hand here, because a route handler gets none of them for free.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdminForAction();

  if (!(await verifySameOrigin())) {
    return new Response(null, { status: 403 });
  }

  const form = await request.formData();
  if (!(await verifyCsrfToken(form.get("csrf")))) {
    return new Response(null, { status: 403 });
  }

  await execute("update activity set read_at = now() where read_at is null");

  /* Back to wherever the panel was opened from. The Referer is honoured only
     when it is on this same origin, so it cannot become an open redirect. */
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const host = request.headers.get("host");
      if (host && url.host === host) redirect(url.pathname + url.search);
    } catch {
      /* An unparseable Referer falls through to the dashboard. */
    }
  }

  redirect("/admin");
}
