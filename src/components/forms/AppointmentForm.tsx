"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Check, Instagram, WhatsApp } from "@/components/ui/Icons";
import { clinic, whatsappHref } from "@/content/clinic";
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

type Status = "idle" | "submitting" | "success" | "unconfigured" | "error";

const fieldClasses =
  "min-h-12 w-full rounded-sm border border-ink-900/20 bg-bone-50 px-4 py-3 text-[0.95rem] text-ink-900 transition-colors placeholder:text-ink-500 hover:border-ink-900/35 focus:border-ink-900 focus:outline-none";

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
      document.getElementById(fieldId(Object.keys(found)[0] ?? "name"))?.focus();
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

      /* 501 means no email or webhook destination is configured yet. The form
         must not claim the request was received when nothing received it. */
      setStatus(response.status === 501 ? "unconfigured" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="border border-ink-900/15 bg-bone-50 p-8 sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-bone-50">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-6 text-[1.5rem] text-ink-900">
          {dict.appointment.success.title}
        </h3>
        <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink-600">
          {dict.appointment.success.body}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 text-[0.85rem] text-ink-900 underline underline-offset-4 hover:text-gold-500"
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
  const waLink = whatsappHref(summary);

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
            className={cn(fieldClasses, errors.name && "border-red-700")}
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
            className={cn(fieldClasses, errors.phone && "border-red-700")}
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
            className={cn(fieldClasses, errors.email && "border-red-700")}
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
            className={cn(fieldClasses, "appearance-none pr-10", errors.service && "border-red-700")}
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
            className={cn(fieldClasses, errors.date && "border-red-700")}
          />
        </Field>

        <fieldset className="sm:col-span-1">
          <legend className="eyebrow text-ink-500">{labels.time}</legend>
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
                      ? "border-ink-900 bg-ink-900 text-bone-50"
                      : "border-ink-900/20 bg-bone-50 text-ink-600 hover:border-ink-900/40",
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
            className="eyebrow block text-ink-500"
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
        <label className="flex cursor-pointer items-start gap-3 text-[0.9rem] leading-relaxed text-ink-600">
          <input
            id={fieldId("consent")}
            type="checkbox"
            checked={values.consent}
            onChange={(event) => update("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? errorId("consent") : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-xs border-ink-900/30 accent-ink-900"
          />
          <span>{labels.consent}</span>
        </label>
        {errors.consent && (
          <p id={errorId("consent")} className="mt-2 text-[0.85rem] text-red-700">
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
          <p className="mt-6 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-[0.9rem] text-red-900">
            {dict.appointment.errors.generic}
          </p>
        )}

        {status === "unconfigured" && (
          <div className="mt-6 border border-gold-500/50 bg-gold-300/10 p-6">
            <h3 className="text-[1.15rem] text-ink-900">
              {dict.appointment.unconfigured.title}
            </h3>
            <p className="mt-2.5 text-[0.93rem] leading-relaxed text-ink-600">
              {dict.appointment.unconfigured.body}
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-sm bg-ink-900 px-6 text-[0.72rem] font-medium tracking-[0.14em] text-bone-50 uppercase transition-colors hover:bg-ink-700"
                >
                  <WhatsApp className="h-4 w-4" />
                  {dict.appointment.unconfigured.viaWhatsapp}
                </a>
              )}
              <a
                href={clinic.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-sm border border-ink-900/25 px-6 text-[0.72rem] font-medium tracking-[0.14em] text-ink-900 uppercase transition-colors hover:border-ink-900"
              >
                <Instagram className="h-4 w-4" />
                {dict.appointment.unconfigured.viaInstagram}
              </a>
            </div>
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
      <label htmlFor={id} className="eyebrow block text-ink-500">
        {label}
        {required && (
          <span className="ml-1.5 text-gold-700" title={requiredLabel}>
            *
          </span>
        )}
      </label>
      <div className="mt-3">{children}</div>
      {error && (
        <p id={errorId} className="mt-2 text-[0.85rem] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
