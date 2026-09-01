/**
 * Scroll-reveal scheduler.
 *
 * A single shared, rAF-throttled sweep serves every <Reveal> on the page.
 *
 * An IntersectionObserver alone is not safe here: when a page is scrolled in
 * large jumps (a fast flick, End, or an in-page anchor) an element can move
 * from below the viewport to above it between two observation frames without
 * ever crossing a threshold, so its callback never fires and the content stays
 * invisible for good. Measuring rectangles instead catches both cases —
 * "in view" and "already scrolled past" — and the listeners remove themselves
 * as soon as nothing is left pending.
 */

const pending = new Set<HTMLElement>();
let listening = false;
let frame = 0;

function reveal(element: HTMLElement) {
  element.dataset.reveal = "shown";
  pending.delete(element);
}

function sweep() {
  frame = 0;
  const trigger = window.innerHeight * 0.92;

  for (const element of [...pending]) {
    if (!element.isConnected) {
      pending.delete(element);
      continue;
    }
    // `top` is negative once an element has scrolled above the viewport, so a
    // single comparison covers both "now visible" and "already passed".
    if (element.getBoundingClientRect().top < trigger) reveal(element);
  }

  if (pending.size === 0) stopListening();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(sweep);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/** Registers an element and returns an unsubscribe function. */
export function observeReveal(element: HTMLElement): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveal(element);
    return () => {};
  }

  pending.add(element);
  startListening();
  schedule();

  return () => {
    pending.delete(element);
    if (pending.size === 0) stopListening();
  };
}
