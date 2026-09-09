"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { IconCheck, IconClose, IconWarning } from "./Icons";

/**
 * The banner shown after a save, a delete or a failure.
 *
 * The notice travels in the query string rather than in client state, because
 * most actions here end in a `redirect()` — the page that renders next is a
 * fresh server render, and anything held in a React state would be gone. This
 * also means a save is still reported when the form was submitted before
 * hydration.
 *
 * The parameter is cleaned out of the URL once shown, so reloading the page
 * does not repeat a stale "saved" message. Only a fixed set of keys is
 * accepted, so nothing arbitrary from a URL is ever rendered.
 */

export type NoticeKind = "saved" | "deleted" | "error" | "signed_out" | "imported";

export function Toast({
  messages,
  closeLabel,
}: {
  /** Translated text per notice key; unknown keys are ignored. */
  messages: Partial<Record<NoticeKind, string>>;
  closeLabel: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const notice = searchParams.get("notice");
  const count = searchParams.get("count");
  const [dismissed, setDismissed] = useState(false);

  /* A new notice re-opens the banner after a previous one was dismissed. */
  useEffect(() => {
    setDismissed(false);
  }, [notice]);

  /* Drops `notice` from the address so a refresh does not show it again.
     `replace` rather than `push`, so Back does not walk through toasts. */
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("notice");
      params.delete("count");
      const query = params.toString();
      router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
    }, 60);

    return () => clearTimeout(timer);
  }, [notice, pathname, router, searchParams]);

  if (!notice || dismissed) return null;

  const key = notice as NoticeKind;
  const template = messages[key];
  if (!template) return null;

  const message = count ? template.replace("{count}", count) : template;
  const isError = key === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "mb-5 flex items-start gap-3 rounded-sm border px-4 py-3 text-[0.9375rem] " +
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
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={closeLabel}
        className="-mr-1 -mt-0.5 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}
