"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { IconCheck, IconClose, IconWarning } from "./Icons";

/**
 * The banner shown after a save, a delete or a failure.
 *
 * The notice travels in the query string, not in client state, because most
 * actions here end in a `redirect()` — the page that renders next is a fresh
 * server render, and anything held in React state would be gone by then. It
 * also means a save is still reported when the form was submitted before the
 * page hydrated.
 *
 * There is deliberately no state and no effect here. An earlier version
 * stripped the parameter from the URL in a `useEffect` so a refresh would not
 * repeat the message; that also made `notice` disappear from `searchParams`,
 * which is where the banner reads it from — so the message erased itself a
 * moment after appearing. Dismissing is a link to the same page without the
 * parameter, which is a navigation the reader asked for rather than something
 * happening to them.
 *
 * Only a fixed set of keys is rendered, so nothing arbitrary from a URL ever
 * reaches the page.
 */

export type NoticeKind = "saved" | "deleted" | "error" | "signed_out" | "imported";

export function Toast({
  messages,
  closeLabel,
}: {
  /** Translated text per notice key; an unknown key renders nothing. */
  messages: Partial<Record<NoticeKind, string>>;
  closeLabel: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const notice = searchParams.get("notice");
  if (!notice) return null;

  const template = messages[notice as NoticeKind];
  if (!template) return null;

  const count = searchParams.get("count");
  const message = count ? template.replace("{count}", count) : template;
  const isError = notice === "error";

  /* The same page, minus the notice. */
  const params = new URLSearchParams(searchParams.toString());
  params.delete("notice");
  params.delete("count");
  const query = params.toString();
  const dismissHref = query === "" ? pathname : `${pathname}?${query}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "mt-5 flex items-start gap-3 rounded-sm border px-4 py-3 text-[0.9375rem] " +
        (isError
          ? "border-[#b4442f]/30 bg-[#b4442f]/[0.07] text-[#8a3219] dark:border-[#e0806b]/30 dark:bg-[#e0806b]/[0.09] dark:text-[#eaab99]"
          : "border-[#1f7a4d]/25 bg-[#1f7a4d]/[0.07] text-[#175637] dark:border-[#4cb383]/25 dark:bg-[#4cb383]/[0.09] dark:text-[#9fdcbe]")
      }
    >
      {isError ? (
        <IconWarning className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
      ) : (
        <IconCheck className="mt-0.5 h-[1.0625rem] w-[1.0625rem] shrink-0" />
      )}

      <p className="min-w-0 flex-1">{message}</p>

      <Link
        href={dismissHref}
        replace
        scroll={false}
        aria-label={closeLabel}
        className="-mt-0.5 -mr-1 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <IconClose className="h-4 w-4" />
      </Link>
    </div>
  );
}
