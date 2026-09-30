'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AnimatedNumber } from '@/components/juego/motion';

interface CountUpProps {
  value: number;
  /** Number shown until the count starts. */
  from?: number;
  /** Seconds to wait before the first count, so numbers can count in stagger. */
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedNumber that holds its starting value for `delay` seconds on mount.
 * Later changes roll right away. Reduced motion shows the value directly.
 */
export function CountUp({ value, from = 0, delay = 0, duration = 1.2, prefix, suffix, className }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const [armed, setArmed] = useState(delay <= 0);

  useEffect(() => {
    if (armed) return;
    const timer = setTimeout(() => setArmed(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [armed, delay]);

  const live = armed || Boolean(reduceMotion);
  return (
    <AnimatedNumber
      value={live ? value : from}
      from={reduceMotion ? value : from}
      duration={duration}
      prefix={prefix}
      suffix={suffix}
      className={className}
    />
  );
}
