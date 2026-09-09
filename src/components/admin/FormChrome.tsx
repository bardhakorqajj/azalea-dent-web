"use client";

import { IconWarning } from "./Icons";
import { SubmitButton } from "./SubmitButton";
import { ActionLink } from "./Ui";

/**
 * The two pieces every edit form in the dashboard repeats: the banner that
 * reports a failed submit, and the row of buttons at the bottom.
 *
 * Marked `"use client"` because they are only ever used inside the resource
 * forms, which are client components so that `useActionState` can put each
 * error next to its field.
 */

export function FormErrorBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex gap-2.5 rounded-sm border border-[#b4442f]/30 bg-[#b4442f]/[0.07] px-4 py-3 text-[0.875rem] leading-relaxed text-[#8a3219] dark:border-[#e0806b]/30 dark:bg-[#e0806b]/[0.09] dark:text-[#eaab99]"
    >
      <IconWarning className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function FormFooter({
  saveLabel,
  savingLabel,
  cancelHref,
  cancelLabel,
  /** A delete button, or anything else that belongs beside the save. */
  extra,
}: {
  saveLabel: string;
  savingLabel: string;
  cancelHref: string;
  cancelLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SubmitButton pendingLabel={savingLabel}>{saveLabel}</SubmitButton>
      <ActionLink href={cancelHref} tone="quiet">
        {cancelLabel}
      </ActionLink>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  );
}
