'use client';

import Lenis from 'lenis';

let lenis: Lenis | null = null;

/** Starts Lenis smooth scrolling (skipped when the user prefers reduced motion). */
export function startSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  let frame = requestAnimationFrame(function raf(time) {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  });

  return () => {
    cancelAnimationFrame(frame);
    lenis?.destroy();
    lenis = null;
  };
}

const HEADER_OFFSET = 72;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -HEADER_OFFSET });
    return;
  }
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: y, behavior: 'smooth' });
}
