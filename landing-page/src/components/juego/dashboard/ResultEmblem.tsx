'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { EASE_OUT_EXPO, ParticleBurst, SPRINGS } from '@/components/juego/motion';

/** Check mark that pops and draws itself: ring first, then the tick. */
export function SuccessMark({ size = 56, delay = 0, color = '#22c55e' }: { size?: number; delay?: number; color?: string }) {
  const reduceMotion = useReducedMotion();
  const draw = (at: number, duration: number) =>
    reduceMotion
      ? {}
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { duration, delay: at, ease: EASE_OUT_EXPO },
        };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...SPRINGS.bouncy, delay, opacity: { duration: 0.2, delay } }}
    >
      <motion.circle cx="26" cy="26" r="23" fill={`${color}1f`} stroke={color} strokeWidth="2.5" {...draw(delay, 0.55)} />
      <motion.path
        d="M15.5 27.5l7 7 14-15"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw(delay + 0.28, 0.4)}
      />
    </motion.svg>
  );
}

/** Big result mark for a finished operation: celebratory burst on success, a shake on failure. */
export function ResultEmblem({ type }: { type: 'success' | 'error' }) {
  const reduceMotion = useReducedMotion();

  if (type === 'error') {
    return (
      <motion.span
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: reduceMotion ? 0 : [0, -9, 9, -6, 6, 0] }}
        transition={{ scale: SPRINGS.bouncy, opacity: { duration: 0.2 }, x: { duration: 0.45, delay: 0.18 } }}
      >
        <Icon name="close-circle" size={64} color="#ef4444" />
      </motion.span>
    );
  }

  return (
    <span aria-hidden="true" className="relative flex h-20 w-20 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,0.35),transparent)]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 1, 0.45] }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
      />
      <motion.span
        className="absolute inset-1 rounded-full border-2 border-[#22c55e]"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      />
      <ParticleBurst
        burstKey={1}
        colors={['#e2c68e', '#86efac', '#fff3d6']}
        count={18}
        distance={[42, 88]}
        size={[2.5, 5]}
        shape="spark"
        duration={1}
      />
      <SuccessMark size={68} delay={0.05} />
    </span>
  );
}
