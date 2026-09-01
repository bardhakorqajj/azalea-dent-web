"use client";

import { useEffect, useRef } from "react";

import { observeReveal } from "@/lib/reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
};

/**
 * Fades content in as it scrolls into view.
 *
 * The element is server-rendered in the `pending` state and revealed by the
 * shared scheduler in `lib/reveal`. A `<noscript>` rule in the layout and the
 * reduced-motion query in globals.css both force it visible, so content is
 * never hidden from a reader who cannot run the animation.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return observeReveal(element);
  }, []);

  return (
    <div
      ref={ref}
      data-reveal="pending"
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
