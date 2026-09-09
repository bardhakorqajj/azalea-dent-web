"use client";

import { useFormStatus } from "react-dom";

import { buttonClass } from "./Ui";

/**
 * A submit button that knows its own form is in flight.
 *
 * `useFormStatus` reads that from the enclosing `<form>`, so this stays a leaf
 * component and the form itself does not have to become a client component to
 * pass a `pending` flag down.
 */
export function SubmitButton({
  children,
  pendingLabel,
  tone = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  tone?: "primary" | "secondary" | "quiet" | "danger";
  size?: "md" | "sm";
  className?: string;
  /** Set both to tell the action which button was used. */
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonClass(tone, size, className)}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
