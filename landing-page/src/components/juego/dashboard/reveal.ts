import type { MotionProps, Transition } from 'framer-motion';
import { SPRINGS } from '@/components/juego/motion';

/**
 * Entrance choreography of the lobby home. Delays are seconds from the page
 * mount; the transition lives inside the target so gestures on the same
 * element (hover, tap) never inherit the delay.
 */
const HIDDEN = { opacity: 0, y: 26, scale: 0.97 };

function shownAt(delay: number) {
  const transition: Transition = {
    default: { ...SPRINGS.soft, delay },
    opacity: { duration: 0.45, delay, ease: 'easeOut' },
  };
  return { opacity: 1, y: 0, scale: 1, transition };
}

/** Enters right after mount, `delay` seconds into the choreography. */
export function enterAt(delay: number): MotionProps {
  return { initial: HIDDEN, animate: shownAt(delay) };
}

/** Enters the first time it scrolls into view (or on mount if it is already visible). */
export function enterInView(delay: number, amount = 0.25): MotionProps {
  return { initial: HIDDEN, whileInView: shownAt(delay), viewport: { once: true, amount } };
}
