"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "@/components/ui/Icons";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

/**
 * The booking form's date and time fields.
 *
 * These are built rather than left to `<input type="date">` and
 * `<input type="time">` for one reason: a browser's own picker panel cannot be
 * styled. `color-scheme` makes it light or dark, but it stays the browser's
 * grey with the browser's blue highlight, which is not this site in either
 * theme. The panels below use the site's own tokens, so the calendar and the
 * list of times look like the rest of the page in light and in dark.
 *
 * What the native controls gave us is kept: the value is still an ISO
 * `YYYY-MM-DD` and a 24h `HH:MM`, the clinic's opening hours still bound the
 * times offered, past days are still unselectable, and both panels are
 * operable from the keyboard alone.
 */

export type CalendarLabels = Dictionary["calendar"];

/** `YYYY-MM-DD` for a local date. Going through `toISOString` would shift it. */
function toIso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const triggerClasses =
  "flex w-full items-center justify-between gap-3 text-left cursor-pointer";

/* Above the phone action bar (z-40), below the header (z-50). */
const panelClasses =
  "absolute top-full left-0 z-[45] mt-2 w-full min-w-[17.5rem] border border-ink-900/15 bg-bone-50 shadow-[0_20px_45px_-28px_rgba(12,14,15,0.6)] dark:border-bone-100/20 dark:bg-ink-900 dark:shadow-[0_20px_45px_-24px_rgba(0,0,0,0.85)]";

/** The filled state both panels use for the chosen day or time. */
const selectedClasses =
  "bg-ink-900 text-bone-50 dark:bg-gold-400 dark:text-ink-950";

function useDismiss(
  open: boolean,
  container: React.RefObject<HTMLDivElement | null>,
  onOutside: () => void,
  onEscape: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!container.current?.contains(event.target as Node)) onOutside();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, container, onOutside, onEscape]);
}

type SharedProps = {
  id: string;
  /** The `<label>` that names the field, so the trigger reads as that label. */
  labelId: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  labels: CalendarLabels;
  invalid?: boolean;
  describedBy?: string;
  /** The shared input styling, so the trigger matches every other field. */
  className: string;
};

export function DateField({
  id,
  labelId,
  name,
  value,
  onChange,
  min,
  labels,
  invalid,
  describedBy,
  className,
}: SharedProps & {
  /** Earliest selectable day, `YYYY-MM-DD`. */
  min: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => setOpen(false), []);
  const escape = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  useDismiss(open, container, dismiss, escape);

  const selected = fromIso(value);
  const display = selected
    ? `${selected.getDate()} ${labels.months[selected.getMonth()]} ${selected.getFullYear()}`
    : labels.datePlaceholder;

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        id={id}
        onClick={() => setOpen((current) => !current)}
        /* A combobox rather than a plain button: it is the role that owns a
           popup, and the only one that can report itself invalid. */
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        /* Its own id last, so the name is the field's label followed by the
           day currently chosen rather than the label alone. */
        aria-labelledby={`${labelId} ${id}`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          className,
          triggerClasses,
          invalid && "border-red-700 dark:border-red-500",
        )}
      >
        <span className={cn(!selected && "text-ink-500 dark:text-bone-400")}>
          {display}
        </span>
        <Calendar className="h-[1.1rem] w-[1.1rem] shrink-0 text-ink-500 dark:text-bone-300" />
      </button>

      <input type="hidden" name={name} value={value} />

      {open && (
        <CalendarPanel
          id={panelId}
          value={value}
          min={min}
          labels={labels}
          onPick={(picked) => {
            onChange(picked);
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function CalendarPanel({
  id,
  value,
  min,
  labels,
  onPick,
}: {
  id: string;
  value: string;
  min: string;
  labels: CalendarLabels;
  onPick: (value: string) => void;
}) {
  const floor = fromIso(min);
  const start = fromIso(value) ?? floor ?? new Date();

  const [view, setView] = useState({
    year: start.getFullYear(),
    month: start.getMonth(),
  });
  const [active, setActive] = useState(toIso(start));
  const grid = useRef<HTMLTableElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /* True on mount, which is how the panel takes focus when it opens. Paging by
     month also moves the active day, to keep one in the grid reachable by Tab,
     but focus stays on the month arrow the way it does in every other
     calendar. */
  const takeFocus = useRef(true);

  /* Opened near the foot of a phone screen the panel would hang below the
     fold, so it is scrolled into view with room left for the action bar. */
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "nearest" });
  }, []);

  useEffect(() => {
    if (!takeFocus.current) return;
    grid.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)
      ?.focus();
  }, [active]);

  const weeks = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    /* The week is read Monday-first here; `getDay()` counts from Sunday. */
    const offset = (first.getDay() + 6) % 7;
    const all = Array.from({ length: 6 }, (_, week) =>
      Array.from(
        { length: 7 },
        (_, day) =>
          new Date(view.year, view.month, 1 - offset + week * 7 + day),
      ),
    );
    /* A month that fits in five rows should not leave a sixth one empty. */
    return all.filter((week) =>
      week.some((date) => date.getMonth() === view.month),
    );
  }, [view]);

  const beforeFloor = (date: Date) =>
    floor !== null && date.getTime() < floor.getTime();

  const show = (date: Date) =>
    setView({ year: date.getFullYear(), month: date.getMonth() });

  const moveBy = (days: number) => {
    const from = fromIso(active);
    if (!from) return;
    const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
    /* Stops at the first selectable day rather than walking into the past. */
    if (beforeFloor(next)) return;
    takeFocus.current = true;
    setActive(toIso(next));
    show(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      moveBy(step);
      return;
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const from = fromIso(active);
      if (!from) return;
      const next = new Date(
        from.getFullYear(),
        from.getMonth() + (event.key === "PageUp" ? -1 : 1),
        from.getDate(),
      );
      if (beforeFloor(next)) return;
      takeFocus.current = true;
      setActive(toIso(next));
      show(next);
    }
  };

  const step = (months: number) => {
    const first = new Date(view.year, view.month + months, 1);
    setView({ year: first.getFullYear(), month: first.getMonth() });

    /* The same day of the month where it exists, so paging forward and back
       lands where it started, clamped to the first selectable day. */
    const from = fromIso(active);
    const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const landed = new Date(
      first.getFullYear(),
      first.getMonth(),
      Math.min(from ? from.getDate() : 1, lastDay),
    );
    takeFocus.current = false;
    setActive(toIso(beforeFloor(landed) && floor ? floor : landed));
  };

  /* The month before the earliest selectable day holds nothing to pick. */
  const canStepBack =
    floor === null ||
    new Date(view.year, view.month, 0).getTime() >= floor.getTime();

  const today = toIso(new Date());

  return (
    <div
      ref={panel}
      id={id}
      role="dialog"
      aria-label={labels.openDate}
      style={{ scrollMarginBottom: "calc(var(--mobile-bar) + 1rem)" }}
      className={cn(panelClasses, "p-3")}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <PanelStepper
          label={labels.previousMonth}
          disabled={!canStepBack}
          onClick={() => step(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PanelStepper>
        <p
          aria-live="polite"
          className="text-[0.9rem] text-ink-900 dark:text-bone-50"
        >
          {labels.months[view.month]} {view.year}
        </p>
        <PanelStepper label={labels.nextMonth} onClick={() => step(1)}>
          <ChevronRight className="h-4 w-4" />
        </PanelStepper>
      </div>

      <table
        ref={grid}
        onKeyDown={onKeyDown}
        className="w-full border-collapse"
      >
        <thead>
          <tr>
            {labels.weekdaysShort.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-[0.68rem] font-medium tracking-[0.08em] text-ink-500 uppercase dark:text-bone-300"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={toIso(week[0] as Date)}>
              {week.map((date) => {
                const iso = toIso(date);
                /* Days spilling in from the neighbouring months are left
                   blank: this panel is for picking a day in the month on
                   screen, and a half-row of another month only invites
                   mis-clicks. */
                if (date.getMonth() !== view.month) {
                  return <td key={iso} className="p-0.5" />;
                }
                const past = beforeFloor(date);
                return (
                  <td key={iso} className="p-0.5 text-center">
                    <button
                      type="button"
                      data-date={iso}
                      disabled={past}
                      tabIndex={iso === active && !past ? 0 : -1}
                      aria-pressed={iso === value}
                      onClick={() => onPick(iso)}
                      className={cn(
                        "flex h-9 w-full items-center justify-center rounded-sm text-[0.85rem] transition-colors",
                        past
                          ? "cursor-default text-ink-400/70 dark:text-ink-400/60"
                          : "cursor-pointer",
                        !past &&
                          (iso === value
                            ? selectedClasses
                            : "text-ink-700 hover:bg-ink-900/8 dark:text-bone-100 dark:hover:bg-bone-100/12"),
                        !past &&
                          iso === today &&
                          iso !== value &&
                          "ring-1 ring-gold-500 dark:ring-gold-400",
                      )}
                    >
                      {date.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelStepper({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-ink-600 transition-colors hover:bg-ink-900/8 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent dark:text-bone-200 dark:hover:bg-bone-100/12"
    >
      {children}
    </button>
  );
}

export function TimeField({
  id,
  labelId,
  name,
  value,
  onChange,
  window,
  stepMinutes = 15,
  labels,
  invalid,
  describedBy,
  className,
}: SharedProps & {
  /** The hours to offer, or null to offer the whole day. */
  window: { opens: string; closes: string } | null;
  stepMinutes?: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => setOpen(false), []);
  const escape = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  useDismiss(open, container, dismiss, escape);

  const options = useMemo(
    () => timeOptions(window, stepMinutes),
    [window, stepMinutes],
  );

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        id={id}
        onClick={() => setOpen((current) => !current)}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={`${labelId} ${id}`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(
          className,
          triggerClasses,
          invalid && "border-red-700 dark:border-red-500",
        )}
      >
        <span className={cn(!value && "text-ink-500 dark:text-bone-400")}>
          {value || labels.timePlaceholder}
        </span>
        <Clock className="h-[1.1rem] w-[1.1rem] shrink-0 text-ink-500 dark:text-bone-300" />
      </button>

      <input type="hidden" name={name} value={value} />

      {open && (
        <TimePanel
          id={panelId}
          value={value}
          options={options}
          label={labels.openTime}
          onPick={(picked) => {
            onChange(picked);
            setOpen(false);
            trigger.current?.focus();
          }}
        />
      )}
    </div>
  );
}

/** Every `HH:MM` from `opens` to `closes` inclusive, `stepMinutes` apart. */
function timeOptions(
  window: { opens: string; closes: string } | null,
  stepMinutes: number,
): string[] {
  const minutesOf = (time: string) => {
    const [hours, minutes] = time.split(":");
    return Number(hours) * 60 + Number(minutes);
  };

  const from = window ? minutesOf(window.opens) : 0;
  const to = window ? minutesOf(window.closes) : 24 * 60 - stepMinutes;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];

  const out: string[] = [];
  for (let minute = from; minute <= to; minute += stepMinutes) {
    const hours = `${Math.floor(minute / 60)}`.padStart(2, "0");
    const minutes = `${minute % 60}`.padStart(2, "0");
    out.push(`${hours}:${minutes}`);
  }
  return out;
}

function TimePanel({
  id,
  value,
  options,
  label,
  onPick,
}: {
  id: string;
  value: string;
  options: string[];
  label: string;
  onPick: (value: string) => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(
    options.includes(value) ? value : (options[0] ?? ""),
  );

  useEffect(() => {
    list.current?.scrollIntoView({ block: "nearest" });
  }, []);

  useEffect(() => {
    const option = list.current?.querySelector<HTMLLIElement>(
      `[data-time="${active}"]`,
    );
    option?.focus();
    option?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const moveBy = (step: number) => {
    const index = options.indexOf(active);
    const next = options[Math.min(options.length - 1, Math.max(0, index + step))];
    if (next) setActive(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      PageUp: -4,
      PageDown: 4,
    };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      moveBy(step);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const edge = event.key === "Home" ? options[0] : options[options.length - 1];
      if (edge) setActive(edge);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (active) onPick(active);
    }
  };

  return (
    <ul
      id={id}
      ref={list}
      role="listbox"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ scrollMarginBottom: "calc(var(--mobile-bar) + 1rem)" }}
      className={cn(panelClasses, "max-h-60 overflow-y-auto p-1.5")}
    >
      {options.map((option) => (
        <li
          key={option}
          role="option"
          data-time={option}
          tabIndex={option === active ? 0 : -1}
          aria-selected={option === value}
          onClick={() => onPick(option)}
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-[0.9rem] transition-colors",
            option === value
              ? selectedClasses
              : "text-ink-700 hover:bg-ink-900/8 dark:text-bone-100 dark:hover:bg-bone-100/12",
          )}
        >
          {option}
          {option === value && <Check className="h-3.5 w-3.5" />}
        </li>
      ))}
    </ul>
  );
}
