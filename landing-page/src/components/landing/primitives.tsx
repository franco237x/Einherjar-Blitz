'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Deterministic pseudo-random in [0, 1) — safe for server-rendered markup. */
export function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal className={cn('mb-12 md:mb-16', align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl')}>
      <p
        className={cn(
          'mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.35em] text-primary',
          align === 'center' && 'justify-center'
        )}
      >
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
        {eyebrow}
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
      </p>
      <h2 className="font-title text-3xl leading-tight text-white/95 min-[400px]:text-4xl md:text-5xl">
        {title} {highlight ? <span className="landing-shimmer-text">{highlight}</span> : null}
      </h2>
      {subtitle ? <p className="mt-5 text-base leading-relaxed text-white/60 md:text-lg">{subtitle}</p> : null}
    </Reveal>
  );
}

/** Rising golden embers. Positions are deterministic so SSR and client match. */
export function Embers({ count = 36, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const size = 2 + seeded(i + 1) * 4;
        return (
          <span
            key={i}
            className="landing-ember"
            style={
              {
                left: `${seeded(i + 11) * 100}%`,
                width: size,
                height: size,
                animationDuration: `${7 + seeded(i + 21) * 9}s`,
                animationDelay: `${-seeded(i + 31) * 14}s`,
                '--ember-sway': `${(seeded(i + 41) - 0.5) * 160}px`,
                '--ember-peak': 0.35 + seeded(i + 51) * 0.55,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Thin gold divider line with a glowing center. */
export function GoldRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent', className)}
    />
  );
}
