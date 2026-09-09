import { locales, type Locale } from "@/i18n/config";
import type { LocalisedValue } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/**
 * Form fields.
 *
 * Server components with no state of their own: the browser holds the value,
 * and the server action reads it back out of `FormData`. That keeps forms
 * working before hydration and after a failed submit without a controlled-input
 * dance, and it is why every field takes `defaultValue` rather than `value`.
 *
 * `error` is a message the action produced, keyed by field name, so an invalid
 * field is marked both visually and for a screen reader.
 */

type FieldShellProps = {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Suffix on the label, e.g. the language a localised input is for. */
  badge?: string;
};

export function Field({
  name,
  label,
  hint,
  error,
  required,
  children,
  className,
  badge,
}: FieldShellProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className="admin-label mb-1.5 flex items-center gap-2">
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-[#b4442f] dark:text-[#e0806b]">
              *
            </span>
          )}
        </span>
        {badge && (
          <span className="rounded-sm bg-ink-900/[0.07] px-1.5 py-0.5 text-[0.6875rem] font-medium tracking-wide text-ink-500 uppercase dark:bg-bone-100/[0.09] dark:text-ink-300">
            {badge}
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-[0.8125rem] font-medium text-[#96371f] dark:text-[#e8a08d]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** The aria wiring every control repeats. */
function describedBy(name: string, hint?: string, error?: string): string | undefined {
  const ids = [hint && !error ? `${name}-hint` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(" ");
  return ids === "" ? undefined : ids;
}

type InputProps = {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "date" | "time" | "password" | "number" | "datetime-local";
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
  className?: string;
  badge?: string;
  inputClassName?: string;
  maxLength?: number;
  autoFocus?: boolean;
  readOnly?: boolean;
};

export function TextField({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  placeholder,
  type = "text",
  min,
  max,
  step,
  autoComplete,
  className,
  badge,
  inputClassName,
  maxLength,
  autoFocus,
  readOnly,
}: InputProps) {
  return (
    <Field
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      badge={badge}
    >
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={cn("admin-control", inputClassName)}
      />
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  placeholder,
  rows = 4,
  className,
  badge,
  maxLength,
}: Omit<InputProps, "type" | "min" | "max" | "step"> & { rows?: number }) {
  return (
    <Field
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      badge={badge}
    >
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className="admin-control resize-y leading-relaxed"
      />
    </Field>
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function SelectField({
  name,
  label,
  hint,
  error,
  required,
  defaultValue,
  options,
  placeholder,
  className,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  defaultValue?: string | null;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className="admin-control admin-select"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  className,
  value = "on",
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  className?: string;
  value?: string;
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      <input
        id={name}
        name={name}
        type="checkbox"
        value={value}
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0 accent-ink-900 dark:accent-gold-400"
      />
      <div className="min-w-0">
        <label
          htmlFor={name}
          className="block text-[0.9375rem] leading-snug text-ink-800 dark:text-bone-100"
        >
          {label}
        </label>
        {hint && (
          <p
            id={`${name}-hint`}
            className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300"
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * One field per language, side by side.
 *
 * Both languages are visible at once rather than behind a tab: the point of
 * this dashboard is that the Albanian and the English copy stay in step, and
 * a tab hides the fact that one of them is empty.
 */
export function LocalisedField({
  name,
  label,
  hint,
  errors,
  value,
  required,
  multiline = false,
  rows = 4,
  localeLabels,
  className,
  maxLength,
}: {
  name: string;
  label: string;
  hint?: string;
  /** The action's field errors; this reads `name.sq` and `name.en` out of it. */
  errors?: Record<string, string>;
  value?: LocalisedValue;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  localeLabels: Record<Locale, string>;
  className?: string;
  maxLength?: number;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="admin-label mb-1.5">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[#b4442f] dark:text-[#e0806b]">
            *
          </span>
        )}
      </legend>

      {hint && (
        <p className="mb-2.5 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
          {hint}
        </p>
      )}

      <div className={cn("grid gap-3", multiline ? "lg:grid-cols-2" : "sm:grid-cols-2")}>
        {locales.map((locale) => {
          const fieldName = `${name}.${locale}`;
          const error = errors?.[fieldName];
          const common = {
            id: fieldName,
            name: fieldName,
            defaultValue: value?.[locale] ?? "",
            "aria-invalid": error ? ("true" as const) : undefined,
            "aria-describedby": error ? `${fieldName}-error` : undefined,
            maxLength,
          };

          return (
            <div key={locale} className="min-w-0">
              <label
                htmlFor={fieldName}
                className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.09em] text-ink-500 uppercase dark:text-ink-300"
              >
                {localeLabels[locale]}
              </label>

              {multiline ? (
                <textarea {...common} rows={rows} className="admin-control resize-y leading-relaxed" />
              ) : (
                <input {...common} type="text" className="admin-control" />
              )}

              {error && (
                <p
                  id={`${fieldName}-error`}
                  className="mt-1.5 text-[0.8125rem] font-medium text-[#96371f] dark:text-[#e8a08d]"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Groups related fields with a heading, so long forms stay readable. */
export function FormSection({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h2 className="font-display text-[1.125rem] text-ink-900 dark:text-bone-50">
            {title}
          </h2>
          {hint && (
            <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-500 dark:text-bone-300">
              {hint}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
