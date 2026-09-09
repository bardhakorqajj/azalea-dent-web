"use client";

import { useRef } from "react";

import { buttonClass } from "./Ui";

/**
 * A submit button that asks first, using a native `<dialog>`.
 *
 * Destructive actions in this dashboard delete real clinic records, so none of
 * them fire on a single click. A native dialog is used rather than a
 * hand-rolled modal because focus trapping, Escape and the top layer are then
 * the browser's job.
 *
 * It degrades honestly: with JavaScript off the dialog cannot open, so the
 * button submits directly rather than doing nothing at all — the server action
 * is still the thing that validates and authorises.
 */
export function ConfirmSubmit({
  label,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  size = "sm",
  className,
  icon,
  name,
  value,
}: {
  label: string;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "primary" | "secondary" | "quiet" | "danger";
  size?: "md" | "sm";
  className?: string;
  icon?: React.ReactNode;
  name?: string;
  value?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="submit"
        name={name}
        value={value}
        className={buttonClass(tone, size, className)}
        onClick={(event) => {
          const element = dialog.current;
          /* No dialog support, or no ref yet: let the submit through rather
             than swallowing the click. */
          if (!element || typeof element.showModal !== "function") return;
          event.preventDefault();
          element.showModal();
        }}
      >
        {icon}
        {label}
      </button>

      <dialog ref={dialog} className="admin-dialog">
        <div className="px-6 py-5">
          <h2 className="font-display text-[1.25rem] text-ink-900 dark:text-bone-50">
            {title}
          </h2>
          {body && (
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-600 dark:text-bone-300">
              {body}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              className={buttonClass("secondary", "md")}
              onClick={() => dialog.current?.close()}
            >
              {cancelLabel}
            </button>
            {/* Submits the form this component sits inside. */}
            <button
              type="submit"
              name={name}
              value={value}
              className={buttonClass("danger", "md")}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
