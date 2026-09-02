"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowLeft, ArrowRight, Close } from "@/components/ui/Icons";
import { galleryOrder, photos } from "@/content/images";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { interpolate } from "@/lib/utils";

/**
 * The clinic photographs as a horizontal strip: every tile the same size, in
 * the order a patient meets the space, scrolled sideways with the scrollbar
 * hidden. Arrow buttons and the native keyboard scroll both work, so the strip
 * is reachable without a trackpad gesture. Each tile opens in a lightbox.
 */
export function Gallery({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const total = galleryOrder.length;

  /** Scrolls the strip by roughly one tile. */
  const nudge = (direction: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const step = strip.querySelector("li")?.clientWidth ?? strip.clientWidth * 0.8;
    strip.scrollBy({ left: direction * (step + 24), behavior: "smooth" });
  };
  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? current : (current + delta + total) % total,
      );
    },
    [total],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowRight") {
        step(1);
      } else if (event.key === "ArrowLeft") {
        step(-1);
      } else if (event.key === "Tab") {
        // Keep focus inside the dialog.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = bodyOverflow;
      previouslyFocused?.focus?.();
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : galleryOrder[openIndex];
  const activePhoto = active ? photos[active] : null;

  return (
    <>
      <div className="relative">
        <div className="flex items-center justify-end gap-2 pb-5">
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-ink-900/20 text-ink-800 transition-colors hover:border-ink-900 hover:text-ink-900"
          >
            <span className="sr-only">{dict.gallery.previous}</span>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-ink-900/20 text-ink-800 transition-colors hover:border-ink-900 hover:text-ink-900"
          >
            <span className="sr-only">{dict.gallery.next}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* The scroll container carries the region role; the list inside keeps
            its own list semantics. */}
        <div
          ref={stripRef}
          tabIndex={0}
          role="region"
          aria-label={dict.gallery.title}
          className="scrollbar-none overflow-x-auto overscroll-x-contain scroll-smooth pb-2"
        >
          <ul className="flex snap-x snap-mandatory gap-5 sm:gap-6">
          {galleryOrder.map((key, index) => {
            const photo = photos[key];
            return (
              <li
                key={key}
                className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
              >
                <figure className="group">
                  <button
                    type="button"
                    ref={(node) => {
                      triggerRefs.current[index] = node;
                    }}
                    onClick={() => setOpenIndex(index)}
                    className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-bone-200"
                  >
                    <span className="sr-only">{dict.gallery.open}</span>
                    <Image
                      src={photo.src}
                      alt={photo.alt[locale]}
                      placeholder="blur"
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 80vw"
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      style={{ objectPosition: photo.focus }}
                    />
                  </button>
                  <figcaption className="eyebrow mt-3 flex items-center gap-2.5 text-ink-500">
                    <span className="text-gold-700 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {photo.caption[locale]}
                  </figcaption>
                </figure>
              </li>
            );
          })}
          </ul>
        </div>
      </div>

      {activePhoto && openIndex !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.caption[locale]}
          className="fixed inset-0 z-[70] flex flex-col bg-ink-950/96 backdrop-blur-sm"
          data-surface="dark"
        >
          <button
            type="button"
            aria-label={dict.gallery.close}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-zoom-out"
            tabIndex={-1}
          />

          <div className="relative flex items-center justify-between px-5 py-4 sm:px-8">
            <p className="text-[0.75rem] tracking-[0.16em] text-bone-300/70 uppercase tabular-nums">
              {interpolate(dict.gallery.counter, {
                current: openIndex + 1,
                total,
              })}
            </p>
            <button
              type="button"
              ref={closeRef}
              onClick={close}
              className="inline-flex h-12 w-12 items-center justify-center text-bone-100 transition-colors hover:text-gold-300"
            >
              <span className="sr-only">{dict.gallery.close}</span>
              <Close className="h-6 w-6" />
            </button>
          </div>

          <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-10">
            <Image
              src={activePhoto.src}
              alt={activePhoto.alt[locale]}
              placeholder="blur"
              sizes="100vw"
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>

          <div className="relative flex items-center justify-between gap-4 px-5 pb-6 sm:px-8">
            <button
              type="button"
              onClick={() => step(-1)}
              className="min-h-12 rounded-sm border border-bone-100/25 px-5 text-[0.7rem] tracking-[0.14em] text-bone-100 uppercase transition-colors hover:border-gold-400 hover:text-gold-300"
            >
              {dict.gallery.previous}
            </button>
            <p className="hidden text-center text-[0.85rem] text-bone-200/70 sm:block">
              {activePhoto.caption[locale]}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              className="min-h-12 rounded-sm border border-bone-100/25 px-5 text-[0.7rem] tracking-[0.14em] text-bone-100 uppercase transition-colors hover:border-gold-400 hover:text-gold-300"
            >
              {dict.gallery.next}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
