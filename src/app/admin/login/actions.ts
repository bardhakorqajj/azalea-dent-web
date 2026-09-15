"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { checkCredentials } from "@/lib/admin/account";
import { clientIp, clientUserAgent, verifySameOrigin } from "@/lib/admin/auth";
import { errorState, str, type ActionState } from "@/lib/admin/forms";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/admin/rate-limit";
import { createSession } from "@/lib/admin/session";
import { interpolate } from "@/lib/utils";
import { databaseStatus } from "@/lib/db/status";

/**
 * Signing in.
 *
 * The order matters and is deliberate:
 *
 *   1. the request has to be same-origin;
 *   2. the rate limit is checked *before* a password is ever compared, so a
 *      flood costs an attacker nothing of ours;
 *   3. the credentials are checked in constant time whether or not an account
 *      exists, so the response cannot be used to discover the admin's address;
 *   4. only then is a session created.
 *
 * Every failure returns the same message. "No such account", "wrong password"
 * and "not set up yet" are indistinguishable from outside — the one exception
 * is a missing database, which is an operator's problem rather than a login
 * attempt and is worth saying plainly.
 */

/** Where to go after signing in. */
function safeRedirect(target: string): string {
  /* Only a path on this host: an open redirect here would let a phishing link
     bounce someone through the clinic's own login page. */
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

export async function signInAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);

  if (!(await verifySameOrigin())) {
    return errorState(dict.auth.csrfFailed);
  }

  const status = await databaseStatus();
  if (status.state === "missing" || status.state === "unreachable") {
    return errorState(dict.auth.noDatabase);
  }
  if (status.state === "unmigrated") {
    return errorState(dict.errors.migrationsMissingBody);
  }

  const ip = await clientIp();

  const limit = await checkLoginRateLimit(ip);
  if (limit.limited) {
    return errorState(
      interpolate(dict.auth.rateLimited, {
        minutes: Math.max(1, Math.ceil(limit.retryAfterSeconds / 60)),
      }),
    );
  }

  const email = str(formData, "email", 160);
  const password = str(formData, "password", 200);

  const result = await checkCredentials(email, password);

  if (!result.ok) {
    await recordLoginAttempt(ip, false);
    /* Deliberately the same message for a wrong password, an unknown email and
       an account that does not exist yet. */
    return errorState(dict.auth.invalidCredentials);
  }

  await recordLoginAttempt(ip, true);
  await createSession({ ip, userAgent: await clientUserAgent() });

  redirect(safeRedirect(str(formData, "next", 300) || "/"));
}
