'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SheenProps {
  /** Seconds between sweeps. */
  every?: number;
  duration?: number;
  delay?: number;
  color?: string;
  className?: string;
}

/** Light that sweeps across its parent (which needs `relative overflow-hidden`) on a loop. */
export function Sheen({ every = 4.5, duration = 1.3, delay = 0.6, color = 'rgba(255,255,255,0.3)', className }: SheenProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <motion.span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-y-0 left-0 z-[5] w-[45%]', className)}
      // Skew through motion: a Tailwind skew class would be overwritten by the animated transform.
      style={{ skewX: -18, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      initial={{ x: '-160%' }}
      animate={{ x: '360%' }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: every, ease: [0.65, 0, 0.35, 1] }}
    />
  );
}
