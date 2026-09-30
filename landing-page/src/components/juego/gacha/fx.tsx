'use client';

/**
 * Small decorative pieces shared by the gacha screens. Everything here is
 * aria-hidden and renders nothing (or a static frame) for reduced motion.
 */

import { useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { seeded } from '../motion';
import styles from './gacha.module.css';

/** Glowing motes rising through their (relative, overflow-hidden) parent. */
export function Motes({
  color,
  count = 8,
  seed = 1,
  rise = 320,
  className,
}: {
  color: string;
  count?: number;
  seed?: number;
  /** Travel in px before fading out. */
  rise?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      {Array.from({ length: count }, (_, i) => {
        const s = seed * 97 + i * 13;
        const size = 2 + seeded(s) * 3;
        const duration = 5.5 + seeded(s + 1) * 4.5;
        return (
          <span
            key={i}
            className={styles.mote}
            style={
              {
                left: `${6 + seeded(s + 2) * 88}%`,
                width: size,
                height: size,
                backgroundColor: color,
                boxShadow: `0 0 ${size * 3}px ${color}`,
                '--mote-dur': `${duration}s`,
                '--mote-delay': `${-seeded(s + 3) * duration}s`,
                '--mote-rise': `${rise * (0.6 + seeded(s + 4) * 0.5)}px`,
                '--mote-sway': `${(seeded(s + 5) - 0.5) * 40}px`,
                '--mote-peak': 0.45 + seeded(s + 6) * 0.5,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

/** Rainbow foil band sweeping over a card; the parent needs `relative overflow-hidden`. */
export function HoloFoil({ delay = 0.8, every = 5.5, className }: { delay?: number; every?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.holo, 'z-[6]', className)}
      style={{ '--holo-delay': `${delay}s`, '--holo-every': `${every}s` } as CSSProperties}
    />
  );
}

/** Light running across a button while it waits on the server. */
export function ProcessingShimmer() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute inset-0 bg-black/25" />
      <span
        className={cn(styles.shimmer, 'absolute inset-y-0 left-0 w-1/2')}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)' }}
      />
    </span>
  );
}

/** "Procesando" followed by three blinking dots. */
export function ProcessingLabel({ text = 'Procesando' }: { text?: string }) {
  return (
    <span className="inline-flex items-baseline">
      {text}
      <span aria-hidden="true" className="ml-0.5 inline-flex">
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.dot} style={{ animationDelay: `${i * 0.18}s` }}>
            .
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Ring that spreads from the point where a button was pressed. Call `trigger`
 * from the (relative, overflow-hidden) button's click handler and render
 * `ripple` inside it. Clicks only: a swipe that starts on the button never
 * plays it, and keyboard presses ripple from the center.
 */
export function useTapRipple(color = 'rgba(255,255,255,0.45)') {
  const reduceMotion = useReducedMotion();
  const [tap, setTap] = useState<{ id: number; x: number; y: number } | null>(null);

  const trigger = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fromPointer = event.detail > 0;
    setTap({
      id: (tap?.id ?? 0) + 1,
      x: fromPointer ? event.clientX - rect.left : rect.width / 2,
      y: fromPointer ? event.clientY - rect.top : rect.height / 2,
    });
  };

  const ripple = (
    <AnimatePresence>
      {tap ? (
        <motion.span
          key={tap.id}
          aria-hidden="true"
          className="pointer-events-none absolute z-[4] h-16 w-16 rounded-full"
          style={{ left: tap.x - 32, top: tap.y - 32, background: `radial-gradient(circle, ${color}, transparent 70%)` }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );

  return { ripple, trigger };
}

/** Freezes every CSS loop (motes, drift, glows, foils, auras) inside it while it is covered. */
export const PAUSE_LOOPS = styles.paused;

const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** True with a mouse or trackpad; false on touch screens (and on the server). */
export function useFinePointer() {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );
}

/** Keyboard focus ring shared by the gacha controls. */
export const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';
