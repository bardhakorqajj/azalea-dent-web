"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FallbackChannels } from "@/components/layout/ContactChannels";
import { Check } from "@/components/ui/Icons";
import { services } from "@/content/services";
import {
  TIME_SLOTS,
  emptyAppointment,
  formatRequest,
  hasErrors,
  validateAppointment,
  type AppointmentRequest,
  type FieldName,
} from "@/lib/appointment";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type Status =
  | "idle"
  | "submitting"
  | "success"
  | "unconfigured"
  | "failed"
  | "error";

const fieldClasses =
  "min-h-12 w-full rounded-sm border border-ink-900/20 bg-bone-50 px-4 py-3 text-[0.95rem] text-ink-900 transition-colors placeholder:text-ink-500 hover:border-ink-900/35 focus:border-ink-900 focus:outline-none dark:border-bone-100/20 dark:bg-ink-900 dark:text-bone-50 dark:placeholder:text-bone-400 dark:hover:border-bone-100/35 dark:focus:border-bone-100";

export function AppointmentForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const uid = useId();
  const [values, setValues] = useState<AppointmentRequest>(emptyAppointment);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const today = new Date().toISOString().slice(0, 10);
  const labels = dict.appointment.form;

  const fieldId = (name: string) => `${uid}-${name}`;
  const errorId = (name: string) => `${uid}-${name}-error`;

  const update = <K extends keyof AppointmentRequest>(
    key: K,
    value: AppointmentRequest[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key in errors) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key as FieldName];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validateAppointment(values);
    if (hasErrors(found)) {
      const translated: Partial<Record<FieldName, string>> = {};
      for (const [field, key] of Object.entries(found)) {
        translated[field as FieldName] = dict.appointment.errors[key];
      }
      setErrors(translated);
      setStatus("idle");
      document
        .getElementById(fieldId(Object.keys(found)[0] ?? "name"))
        ?.focus();
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });

      if (response.ok) {
        setStatus("success");
        setValues(emptyAppointment);
        return;
      }

      /* 501: nothing is configured to receive the request.
         502: every configured channel failed to deliver.
         Both must offer a way through rather than claiming success, and
         neither is the patient's fault. */
      if (response.status === 501) setStatus("unconfigured");
      else if (response.status === 502) setStatus("failed");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="border border-ink-900/15 bg-bone-50 p-8 sm:p-10 dark:border-bone-100/15 dark:bg-ink-900">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-bone-50 dark:bg-gold-400 dark:text-ink-950">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-6 text-[1.5rem] text-ink-900 dark:text-bone-50">
          {dict.appointment.success.title}
        </h3>
        <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink-600 dark:text-bone-300">
          {dict.appointment.success.body}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 text-[0.85rem] text-ink-900 underline underline-offset-4 hover:text-gold-500 dark:text-bone-50 dark:hover:text-gold-400"
        >
          {dict.appointment.success.again}
        </button>
      </div>
    );
  }

  const summary = formatRequest(values, {
    name: labels.name,
    phone: labels.phone,
    email: labels.email,
    service: labels.service,
    date: labels.date,
    time: labels.time,
    message: labels.message,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={fieldId("name")}
          label={labels.name}
          error={errors.name}
          errorId={errorId("name")}
          required
          requiredLabel={labels.required}
        >
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            placeholder={labels.namePlaceholder}
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className={cn(
              fieldClasses,
              errors.name && "border-red-700 dark:border-red-500",
            )}
          />
        </Field>

        <Field
          id={fieldId("phone")}
          label={labels.phone}
          error={errors.phone}
          errorId={errorId("phone")}
          required
          requiredLabel={labels.required}
        >
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={labels.phonePlaceholder}
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? errorId("phone") : undefined}
            className={cn(
              fieldClasses,
              errors.phone && "border-red-700 dark:border-red-500",
            )}
          />
        </Field>

        <Field
          id={fieldId("email")}
          label={labels.email}
          error={errors.email}
          errorId={errorId("email")}
        >
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={labels.emailPlaceholder}
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className={cn(
              fieldClasses,
              errors.email && "border-red-700 dark:border-red-500",
            )}
          />
        </Field>

        <Field
          id={fieldId("service")}
          label={labels.service}
          error={errors.service}
          errorId={errorId("service")}
          required
          requiredLabel={labels.required}
        >
          <select
            id={fieldId("service")}
            name="service"
            value={values.service}
            onChange={(event) => update("service", event.target.value)}
            aria-invalid={Boolean(errors.service)}
            aria-describedby={errors.service ? errorId("service") : undefined}
            className={cn(
              fieldClasses,
              "appearance-none pr-10",
              errors.service && "border-red-700 dark:border-red-500",
            )}
          >
            <option value="">{labels.servicePlaceholder}</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title[locale]}
              </option>
            ))}
            <option value="other">{labels.serviceOther}</option>
          </select>
        </Field>

        <Field
          id={fieldId("date")}
          label={labels.date}
          error={errors.date}
          errorId={errorId("date")}
          required
          requiredLabel={labels.required}
        >
          <input
            id={fieldId("date")}
            name="date"
            type="date"
            min={today}
            value={values.date}
            onChange={(event) => update("date", event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? errorId("date") : undefined}
            className={cn(
              fieldClasses,
              errors.date && "border-red-700 dark:border-red-500",
            )}
          />
        </Field>

        <fieldset className="sm:col-span-1">
          <legend className="eyebrow text-ink-500 dark:text-bone-300">
            {labels.time}
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => {
              const slotLabel =
                slot === "morning"
                  ? labels.timeMorning
                  : slot === "afternoon"
                    ? labels.timeAfternoon
                    : labels.timeEvening;
              const checked = values.time === slot;
              return (
                <label
                  key={slot}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-center rounded-sm border px-2 text-center text-[0.8rem] transition-colors",
                    checked
                      ? "border-ink-900 bg-ink-900 text-bone-50 dark:border-gold-400 dark:bg-gold-400 dark:text-ink-950"
                      : "border-ink-900/20 bg-bone-50 text-ink-600 hover:border-ink-900/40 dark:border-bone-100/20 dark:bg-ink-900 dark:text-bone-300 dark:hover:border-bone-100/40",
                  )}
                >
                  <input
                    type="radio"
                    name="time"
                    value={slot}
                    checked={checked}
                    onChange={() => update("time", slot)}
                    className="sr-only"
                  />
                  {slotLabel}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="sm:col-span-2">
          <label
            htmlFor={fieldId("message")}
            className="eyebrow block text-ink-500 dark:text-bone-300"
          >
            {labels.message}
          </label>
          <textarea
            id={fieldId("message")}
            name="message"
            rows={4}
            placeholder={labels.messagePlaceholder}
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            className={cn(fieldClasses, "mt-3 resize-y")}
          />
        </div>
      </div>

      <div className="mt-7">
        <label className="flex cursor-pointer items-start gap-3 text-[0.9rem] leading-relaxed text-ink-600 dark:text-bone-300">
          <input
            id={fieldId("consent")}
            type="checkbox"
            checked={values.consent}
            onChange={(event) => update("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? errorId("consent") : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-xs border-ink-900/30 accent-ink-900 dark:border-bone-100/30 dark:accent-gold-400"
          />
          <span>{labels.consent}</span>
        </label>
        {errors.consent && (
          <p
            id={errorId("consent")}
            className="mt-2 text-[0.85rem] text-red-700 dark:text-red-400"
          >
            {errors.consent}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="mt-8 w-full sm:w-auto"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? labels.submitting : labels.submit}
      </Button>

      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-6 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-[0.9rem] text-red-900 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200">
            {dict.appointment.errors.generic}
          </p>
        )}

        {(status === "unconfigured" || status === "failed") && (
          <div className="mt-6 border border-gold-500/50 bg-gold-300/10 p-6 dark:border-gold-400/40 dark:bg-gold-400/10">
            <h3 className="text-[1.15rem] text-ink-900 dark:text-bone-50">
              {dict.appointment[status].title}
            </h3>
            <p className="mt-2.5 text-[0.93rem] leading-relaxed text-ink-600 dark:text-bone-300">
              {dict.appointment[status].body}
            </p>

            {/* Every channel, not a chosen few: the request has just failed,
                so the patient should not have to go looking for another way
                to reach the clinic. */}
            <p className="mt-6 text-[0.7rem] font-medium tracking-[0.14em] text-ink-500 uppercase dark:text-bone-300">
              {dict.appointment.fallback.heading}
            </p>
            <FallbackChannels dict={dict} summary={summary} className="mt-3" />
            <p className="mt-4 text-[0.85rem] leading-relaxed text-ink-600 dark:text-bone-300">
              {dict.appointment.fallback.note}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  errorId,
  required,
  requiredLabel,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  errorId: string;
  required?: boolean;
  requiredLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="eyebrow block text-ink-500 dark:text-bone-300"
      >
        {label}
        {required && (
          <span
            className="ml-1.5 text-gold-700 dark:text-gold-400"
            title={requiredLabel}
          >
            *
          </span>
        )}
      </label>
      <div className="mt-3">{children}</div>
      {error && (
        <p
          id={errorId}
          className="mt-2 text-[0.85rem] text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
