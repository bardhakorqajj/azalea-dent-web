"use client";

import { useState } from "react";

import { IconExternal } from "@/components/admin/Icons";
import { buttonClass } from "@/components/admin/Ui";

/**
 * The confirmation text for one appointment, editable before it is sent.
 *
 * It opens on the message the template produces for this patient, and what is
 * in the box when a button is pressed is what goes out: the textarea belongs,
 * through its `form` attribute, to whichever form sends — "Confirm" in the
 * status card while the appointment is pending, "Send again" once it is
 * confirmed — and the WhatsApp link is rebuilt from it on every keystroke.
 *
 * The edit is for this send only. The wording for every patient lives in
 * Settings → Confirmation.
 */
export function ConfirmationMessageEditor({
  initialText,
  locale,
  formId,
  whatsappBase,
  labels,
}: {
  initialText: string;
  locale: string;
  /** The form that sends the message, or undefined when nothing can send it. */
  formId?: string;
  /** `https://wa.me/<number>`, or null when the patient has no usable number. */
  whatsappBase: string | null;
  labels: { title: string; hint: string; reset: string; openWhatsapp: string };
}) {
  const [text, setText] = useState(initialText);
  const changed = text !== initialText;

  const whatsappHref =
    whatsappBase && text.trim() !== ""
      ? `${whatsappBase}?text=${encodeURIComponent(text.trim())}`
      : null;

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="confirmation-message" className="admin-label">
          {labels.title}
        </label>
        {changed && (
          <button
            type="button"
            onClick={() => setText(initialText)}
            className="text-[0.8125rem] text-ink-500 underline hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50"
          >
            {labels.reset}
          </button>
        )}
      </div>

      <textarea
        id="confirmation-message"
        name="message"
        form={formId}
        lang={locale}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={Math.min(14, Math.max(6, initialText.split("\n").length + 1))}
        maxLength={2000}
        className="admin-control resize-y leading-relaxed"
      />
      <p className="mt-1.5 text-[0.8125rem] text-ink-500 dark:text-bone-300">{labels.hint}</p>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "sm", "mt-3")}
        >
          <IconExternal className="h-4 w-4" />
          {labels.openWhatsapp}
        </a>
      )}
    </div>
  );
}
