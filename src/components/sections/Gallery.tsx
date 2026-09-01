"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Close } from "@/components/ui/Icons";
import { galleryOrder, photos, type PhotoKey } from "@/content/images";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn, interpolate } from "@/lib/utils";

/**
 * Editorial layout for the clinic photographs — arrival, waiting area,
 * corridor, then the treatment room — each at the aspect ratio that suits
 * the frame rather than a uniform grid. Every figure opens in a lightbox.
 */
export function Gallery({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const total = galleryOrder.length;
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

  /** Frame shape per position, tuned to each photograph. */
  const frames: Record<PhotoKey, string> = {
    facadeNight: "lg:col-span-12 aspect-[4/3] sm:aspect-[16/8]",
    reception: "lg:col-span-7 aspect-[4/3]",
    glassDetail: "lg:col-span-5 aspect-[4/3]",
    operatoryOak: "lg:col-span-5 lg:col-start-2 aspect-[3/4]",
    operatoryDaylight: "lg:col-span-5 lg:col-start-8 aspect-[3/4] lg:mt-20",
  };

  const active = openIndex === null ? null : galleryOrder[openIndex];
  const activePhoto = active ? photos[active] : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
        {galleryOrder.map((key, index) => {
          const photo = photos[key];
          return (
            <figure key={key} className={cn("group min-w-0", frames[key])}>
              <button
                type="button"
                ref={(node) => {
                  triggerRefs.current[index] = node;
                }}
                onClick={() => setOpenIndex(index)}
                className="relative block h-full w-full cursor-zoom-in overflow-hidden bg-bone-200"
              >
                <span className="sr-only">{dict.gallery.open}</span>
                <Image
                  src={photo.src}
                  alt={photo.alt[locale]}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 55vw, 100vw"
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
          );
        })}
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
