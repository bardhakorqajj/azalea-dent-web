"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { AdminDictionary } from "@/admin/get-dictionary";
import { cn } from "@/lib/utils";

import { IconBell } from "./Icons";
import { buttonClass } from "./Ui";

/**
 * The notifications panel.
 *
 * Every item here is a real recorded event — an appointment request that
 * arrived, a message that came in — read from the `activity` table. Nothing is
 * generated to fill the panel out: with nothing recorded, it says so.
 */

export type NotificationItem = {
  id: string;
  summary: string;
  href: string | null;
  createdAt: string;
  unread: boolean;
};

export function NotificationsMenu({
  labels,
  items,
  unreadCount,
  csrfToken,
}: {
  /* Only this panel's own strings: a client component's props are serialised
     into the page, and the full dictionary would be 24 kB of labels it never
     renders. */
  labels: AdminDictionary["notifications"];
  items: NotificationItem[];
  unreadCount: number;
  csrfToken: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={labels.title}
        className={cn(buttonClass("quiet", "sm"), "relative")}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b4442f] px-1 text-[0.625rem] font-semibold text-bone-50"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={labels.title}
          className="admin-card absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden shadow-xl"
        >
          <div className="admin-divide flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <p className="text-[0.875rem] font-medium text-ink-900 dark:text-bone-50">
              {labels.title}
            </p>
            {unreadCount > 0 && (
              /* A plain form post, so clearing them survives a page that has
                 not hydrated yet. */
              <form action="/api/admin/notifications/read" method="post">
                <input type="hidden" name="csrf" value={csrfToken} />
                <button
                  type="submit"
                  className="text-[0.75rem] text-ink-500 underline hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50"
                >
                  {labels.markAllRead}
                </button>
              </form>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[0.875rem] text-ink-400 dark:text-ink-300">
              {labels.empty}
            </p>
          ) : (
            <ul className="admin-divide max-h-[22rem] divide-y overflow-y-auto">
              {items.map((item) => {
                const content = (
                  <>
                    <span className="flex items-start gap-2.5">
                      {item.unread && (
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500 dark:bg-gold-400"
                        />
                      )}
                      <span className={cn("min-w-0", !item.unread && "pl-4")}>
                        <span className="block text-[0.875rem] leading-snug text-ink-800 dark:text-bone-100">
                          {item.summary}
                        </span>
                        <span className="mt-0.5 block text-[0.75rem] text-ink-400 dark:text-ink-300">
                          {item.createdAt}
                        </span>
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 transition-colors hover:bg-ink-900/[0.04] dark:hover:bg-bone-100/[0.06]"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
