"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { IconClose, IconMenu } from "./Icons";
import { buttonClass } from "./Ui";

/**
 * The sidebar on a phone.
 *
 * The navigation itself is rendered on the server and passed in as children,
 * so the only thing that needs JavaScript is opening and closing the panel.
 * With JavaScript off the desktop sidebar is still there — this button is
 * simply hidden at that width.
 */
export function SidebarToggle({
  children,
  openLabel,
  closeLabel,
}: {
  children: React.ReactNode;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);

  /* Following a link should close the panel it was tapped in. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    /* Stops the page behind scrolling while the panel is over it. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* Move focus into the panel, so a keyboard user is not left behind it. */
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        className={buttonClass("quiet", "sm", "lg:hidden")}
      >
        <IconMenu />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
          />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={openLabel}
            className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col overflow-y-auto border-r border-ink-900/10 bg-bone-50 dark:border-bone-100/10 dark:bg-ink-900"
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className={buttonClass("quiet", "sm")}
              >
                <IconClose />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
