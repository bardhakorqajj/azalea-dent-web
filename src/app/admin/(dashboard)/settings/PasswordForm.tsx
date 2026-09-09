"use client";

import { useActionState } from "react";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { TextField } from "@/components/admin/Fields";
import { FormErrorBanner } from "@/components/admin/FormChrome";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Callout } from "@/components/admin/Ui";
import { idleState, type ActionState } from "@/lib/admin/forms";

/**
 * The password change form.
 *
 * It reports success in place rather than redirecting, because the action
 * re-issues this browser's session as part of the change — a redirect at that
 * moment is the one case where the owner could plausibly be bounced to the
 * login page by their own successful password change.
 */
export function PasswordForm({
  action,
  labels,
  csrfToken,
  minLength,
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  labels: {
    settings: AdminDictionary["settings"];
    common: AdminDictionary["common"];
  };
  csrfToken: string;
  minLength: number;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const errors = state.fieldErrors ?? {};
  const { settings: t, common } = labels;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="csrf" value={csrfToken} />

      <FormErrorBanner message={state.status === "error" ? state.message : undefined} />

      {state.status === "success" && state.message && (
        <Callout tone="success">{state.message}</Callout>
      )}

      <TextField
        name="currentPassword"
        label={t.currentPassword}
        type="password"
        required
        autoComplete="current-password"
        error={errors.currentPassword}
      />

      <TextField
        name="newPassword"
        label={t.newPassword}
        type="password"
        required
        autoComplete="new-password"
        error={errors.newPassword}
        hint={t.passwordTooShort.replace("{min}", String(minLength))}
      />

      <TextField
        name="confirmPassword"
        label={t.confirmPassword}
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <SubmitButton pendingLabel={common.saving}>{t.changePassword}</SubmitButton>
    </form>
  );
}
