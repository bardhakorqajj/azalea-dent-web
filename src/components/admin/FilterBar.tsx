import Link from "next/link";

import { cn } from "@/lib/utils";

import { IconSearch } from "./Icons";
import { buttonClass } from "./Ui";

/**
 * Search and filters over a list.
 *
 * A plain GET form: the filters end up in the address, so a filtered view can
 * be bookmarked or shared, the Back button behaves, and none of it needs
 * JavaScript. Submitting resets to page 1 simply by not carrying `page`.
 */

export type FilterSelect = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export function FilterBar({
  action,
  search,
  searchPlaceholder,
  searchLabel,
  selects = [],
  dateFrom,
  dateTo,
  dateLabels,
  submitLabel,
  clearHref,
  clearLabel,
  hasFilters,
  children,
}: {
  action: string;
  search?: string;
  searchPlaceholder: string;
  searchLabel: string;
  selects?: FilterSelect[];
  dateFrom?: string;
  dateTo?: string;
  dateLabels?: { from: string; to: string };
  submitLabel: string;
  clearHref: string;
  clearLabel: string;
  hasFilters: boolean;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} method="get" className="admin-divide border-b px-5 py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="filter-q" className="admin-label mb-1.5">
            {searchLabel}
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-[1.0625rem] w-[1.0625rem] -translate-y-1/2 text-ink-400 dark:text-ink-300" />
            <input
              id="filter-q"
              name="q"
              type="search"
              defaultValue={search ?? ""}
              placeholder={searchPlaceholder}
              className="admin-control pl-10"
            />
          </div>
        </div>

        {selects.map((select) => (
          <div key={select.name} className="min-w-0 basis-40">
            <label htmlFor={`filter-${select.name}`} className="admin-label mb-1.5">
              {select.label}
            </label>
            <select
              id={`filter-${select.name}`}
              name={select.name}
              defaultValue={select.value}
              className="admin-control admin-select"
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {dateLabels && (
          <>
            <div className="min-w-0 basis-40">
              <label htmlFor="filter-from" className="admin-label mb-1.5">
                {dateLabels.from}
              </label>
              <input
                id="filter-from"
                name="from"
                type="date"
                defaultValue={dateFrom ?? ""}
                className="admin-control"
              />
            </div>
            <div className="min-w-0 basis-40">
              <label htmlFor="filter-to" className="admin-label mb-1.5">
                {dateLabels.to}
              </label>
              <input
                id="filter-to"
                name="to"
                type="date"
                defaultValue={dateTo ?? ""}
                className="admin-control"
              />
            </div>
          </>
        )}

        {children}

        <div className="flex gap-2">
          <button type="submit" className={buttonClass("secondary", "md")}>
            {submitLabel}
          </button>
          {hasFilters && (
            <Link href={clearHref} className={cn(buttonClass("quiet", "md"))}>
              {clearLabel}
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
