"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { contactChannels } from "@/components/layout/ContactChannels";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  emptyMessage,
  hasMessageErrors,
  validateMessage,
  type MessageField,
  type MessageRequest,
} from "@/lib/message";
import { cn } from "@/lib/utils";

/**
 * The short contact form, for a visitor with a question rather than a booking.
 *
 * It posts to `/api/contact`, which stores the message in the clinic's
 * dashboard inbox. When no database is configured the route answers 501 and
 * this says plainly that nothing was sent, offering the clinic's phone and
 * messaging channels instead — the same honesty the appointment form already
 * shows, and for the same reason: a form that swallows a message is worse than
 * one that admits it cannot send.
 */

type Status = "idle" | "submitting" | "success" | "error" | "unconfigured";

export function MessageForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const formId = useId();
  const [values, setValues] = useState<MessageRequest>(emptyMessage);
  const [errors, setErrors] = useState<Partial<Record<MessageField, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const labels = dict.message;

  const field = (name: keyof MessageRequest) => `${formId}-${name}`;

  function set<K extends keyof MessageRequest>(name: K, value: MessageRequest[K]) {
    setValues((current) => ({ ...current, [name]: value }));
    /* Clears the error as soon as the field is touched, rather than leaving it
       shouting until the next submit. */
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name as MessageField];
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateMessage(values);
    if (hasMessageErrors(found)) {
      setErrors(
        Object.fromEntries(
          Object.entries(found).map(([key, value]) => [
            key,
            labels.errors[value as keyof typeof labels.errors],
          ]),
        ),
      );
      setStatus("error");
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (response.ok) {
        setStatus("success");
        setValues(emptyMessage);
        return;
      }

      /* 501 means nothing is configured to keep the message; anything else is
         a failure worth the same honest wording. */
      setStatus(response.status === 501 ? "unconfigured" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border-t border-ink-900/15 pt-7 dark:border-bone-100/15"
      >
        <p className="font-display text-[1.3rem] text-ink-900 dark:text-bone-50">
          {labels.successTitle}
        </p>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-600 dark:text-bone-300">
          {labels.successBody}
        </p>
      </div>
    );
  }

  const inputClass =
    "min-h-12 w-full rounded-sm border bg-transparent px-4 py-3 text-[0.98rem] text-ink-900 transition-colors placeholder:text-ink-400 dark:text-bone-50 dark:placeholder:text-ink-400";

  const borderFor = (name: MessageField) =>
    errors[name]
      ? "border-[#b4442f] dark:border-[#e0806b]"
      : "border-ink-900/20 hover:border-ink-900/40 dark:border-bone-100/25 dark:hover:border-bone-100/45";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor={field("name")}
            className="eyebrow mb-2 block text-ink-500 dark:text-bone-300"
          >
            {labels.name}
          </label>
          <input
            id={field("name")}
            type="text"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? `${field("name")}-error` : undefined}
            className={cn(inputClass, borderFor("name"))}
          />
          {errors.name && (
            <p
              id={`${field("name")}-error`}
              className="mt-2 text-[0.85rem] text-[#96371f] dark:text-[#e8a08d]"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={field("subject")}
            className="eyebrow mb-2 block text-ink-500 dark:text-bone-300"
          >
            {labels.subject}{" "}
            <span className="normal-case opacity-70">({labels.optional})</span>
          </label>
          <input
            id={field("subject")}
            type="text"
            value={values.subject}
            onChange={(event) => set("subject", event.target.value)}
            className={cn(inputClass, borderFor("body"))}
          />
        </div>

        <div>
          <label
            htmlFor={field("email")}
            className="eyebrow mb-2 block text-ink-500 dark:text-bone-300"
          >
            {labels.email}
          </label>
          <input
            id={field("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? `${field("email")}-error` : undefined}
            className={cn(inputClass, borderFor("email"))}
          />
          {errors.email && (
            <p
              id={`${field("email")}-error`}
              className="mt-2 text-[0.85rem] text-[#96371f] dark:text-[#e8a08d]"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={field("phone")}
            className="eyebrow mb-2 block text-ink-500 dark:text-bone-300"
          >
            {labels.phone}
          </label>
          <input
            id={field("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? `${field("phone")}-error` : undefined}
            className={cn(inputClass, borderFor("phone"))}
          />
          {errors.phone && (
            <p
              id={`${field("phone")}-error`}
              className="mt-2 text-[0.85rem] text-[#96371f] dark:text-[#e8a08d]"
            >
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor={field("body")}
          className="eyebrow mb-2 block text-ink-500 dark:text-bone-300"
        >
          {labels.body}
        </label>
        <textarea
          id={field("body")}
          rows={4}
          value={values.body}
          onChange={(event) => set("body", event.target.value)}
          aria-invalid={errors.body ? "true" : undefined}
          aria-describedby={errors.body ? `${field("body")}-error` : undefined}
          className={cn(inputClass, borderFor("body"), "resize-y leading-relaxed")}
        />
        {errors.body && (
          <p
            id={`${field("body")}-error`}
            className="mt-2 text-[0.85rem] text-[#96371f] dark:text-[#e8a08d]"
          >
            {errors.body}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <input
          id={field("consent")}
          type="checkbox"
          checked={values.consent}
          onChange={(event) => set("consent", event.target.checked)}
          aria-invalid={errors.consent ? "true" : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-ink-900 dark:accent-gold-400"
        />
        <label
          htmlFor={field("consent")}
          className="text-[0.92rem] leading-relaxed text-ink-600 dark:text-bone-300"
        >
          {labels.consent}
        </label>
      </div>
      {errors.consent && (
        <p className="text-[0.85rem] text-[#96371f] dark:text-[#e8a08d]">
          {errors.consent}
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? labels.submitting : labels.submit}
      </Button>

      <div aria-live="polite">
        {status === "unconfigured" && (
          <div className="border-t border-ink-900/15 pt-6 dark:border-bone-100/15">
            <p className="font-display text-[1.1rem] text-ink-900 dark:text-bone-50">
              {labels.errorTitle}
            </p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-600 dark:text-bone-300">
              {labels.errorBody}
            </p>
            {/* Every published channel, because the message has just failed
                and the visitor should not have to go looking. */}
            <ul className="mt-5 space-y-2">
              {contactChannels(dict).map((group) => (
                <li key={group.key} className="text-[0.9rem]">
                  <span className="eyebrow text-ink-500 dark:text-bone-300">
                    {group.label}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-4">
                    {group.items.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="text-ink-800 underline dark:text-bone-100"
                      >
                        {item.value}
                      </a>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
