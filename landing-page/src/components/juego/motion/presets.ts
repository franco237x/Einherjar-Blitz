import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion vocabulary for the game lobby, so every screen moves the
 * same way: springs for anything the player touches, expo ease for reveals.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const SPRINGS = {
  /** Buttons, toggles, indicators: fast and firm. */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  /** Cards and panels settling into place. */
  soft: { type: 'spring', stiffness: 170, damping: 22 },
  /** Rewards and celebrations: a visible overshoot. */
  bouncy: { type: 'spring', stiffness: 360, damping: 15, mass: 0.8 },
} satisfies Record<string, Transition>;

/** Parent variants: children using `rise` enter one after another. */
export function stagger(step = 0.06, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren: delay } },
  };
}

/** Child variants for `stagger`: short lift with a spring settle. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.soft },
};

/** Deterministic pseudo-random in [0, 1), stable across renders. */
export function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
