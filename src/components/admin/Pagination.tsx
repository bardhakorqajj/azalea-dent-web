import Link from "next/link";

import type { Page } from "@/lib/db/types";
import { cn } from "@/lib/utils";

import { IconChevronLeft, IconChevronRight } from "./Icons";
import { buttonClass } from "./Ui";

/**
 * The pager under a list.
 *
 * Links rather than buttons, so a page of results has its own address that can
 * be bookmarked, reloaded and opened in a new tab — and so paging works with
 * no JavaScript at all.
 *
 * `params` carries the current filters through, so paging never silently drops
 * the search term someone typed.
 */
export function Pagination({
  page,
  basePath,
  params,
  labels,
}: {
  page: Pick<Page<unknown>, "page" | "pageCount" | "total" | "perPage">;
  basePath: string;
  /** The current query string, minus `page`. */
  params?: Record<string, string | undefined>;
  labels: {
    previous: string;
    next: string;
    page: string;
    of: string;
    results: string;
  };
}) {
  if (page.pageCount <= 1) {
    return (
      <p className="px-5 py-3.5 text-[0.8125rem] text-ink-500 dark:text-bone-300">
        {page.total} {labels.results}
      </p>
    );
  }

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "") query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const search = query.toString();
    return search === "" ? basePath : `${basePath}?${search}`;
  };

  const hasPrevious = page.page > 1;
  const hasNext = page.page < page.pageCount;

  return (
    <div className="admin-divide flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <p className="tnum text-[0.8125rem] text-ink-500 dark:text-bone-300">
        {labels.page} {page.page} {labels.of} {page.pageCount}
        <span className="mx-2 text-ink-300 dark:text-ink-500">·</span>
        {page.total} {labels.results}
      </p>

      <div className="flex gap-2">
        {hasPrevious ? (
          <Link href={href(page.page - 1)} className={buttonClass("secondary", "sm")}>
            <IconChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.previous}</span>
          </Link>
        ) : (
          <span className={cn(buttonClass("secondary", "sm"), "pointer-events-none opacity-45")}>
            <IconChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.previous}</span>
          </span>
        )}

        {hasNext ? (
          <Link href={href(page.page + 1)} className={buttonClass("secondary", "sm")}>
            <span className="hidden sm:inline">{labels.next}</span>
            <IconChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn(buttonClass("secondary", "sm"), "pointer-events-none opacity-45")}>
            <span className="hidden sm:inline">{labels.next}</span>
            <IconChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
