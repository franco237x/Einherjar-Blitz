'use client';

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { EASE_OUT_EXPO } from './presets';

interface AnimatedNumberProps {
  value: number;
  /** Value shown on the first paint; counts up from it on mount. Defaults to `value`. */
  from?: number;
  /** Seconds the count takes. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Number that rolls to its new value instead of jumping. The text updates
 * outside React renders, so a count never re-renders the parent.
 */
export function AnimatedNumber({
  value,
  from,
  duration = 0.9,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(from ?? value);
  const text = useTransform(
    current,
    (latest) =>
      `${prefix}${latest.toLocaleString('es', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`
  );

  useEffect(() => {
    if (reduceMotion) {
      current.set(value);
      return;
    }
    const controls = animate(current, value, { duration, ease: EASE_OUT_EXPO });
    return () => controls.stop();
  }, [current, duration, reduceMotion, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
