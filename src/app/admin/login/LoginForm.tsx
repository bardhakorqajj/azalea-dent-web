"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { IconWarning } from "@/components/admin/Icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField } from "@/components/admin/Fields";
import { idleState } from "@/lib/admin/forms";

import { signInAction } from "./actions";

/**
 * The sign-in form.
 *
 * `useActionState` keeps the failure message next to the fields without a page
 * reload, and the form still submits and reports errors correctly before
 * hydration — the action is a POST either way.
 */
export function LoginForm({
  labels,
  next,
}: {
  /* Just this form's strings. Handing over the whole dictionary would put
     every label in the dashboard into the login page's payload. */
  labels: AdminDictionary["auth"];
  /** Where the visitor was headed before being sent here. */
  next?: string;
}) {
  const [state, action] = useActionState(signInAction, idleState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-sm border border-[#b4442f]/30 bg-[#b4442f]/[0.07] px-4 py-3 text-[0.875rem] leading-relaxed text-[#8a3219] dark:border-[#e0806b]/30 dark:bg-[#e0806b]/[0.09] dark:text-[#eaab99]"
        >
          <IconWarning className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      <TextField
        name="email"
        label={labels.emailLabel}
        type="email"
        required
        autoComplete="username"
        autoFocus
      />

      <TextField
        name="password"
        label={labels.passwordLabel}
        type="password"
        required
        autoComplete="current-password"
      />

      <SubmitButton
        pendingLabel={labels.signingIn}
        className="w-full"
      >
        {labels.signIn}
      </SubmitButton>
    </form>
  );
}
