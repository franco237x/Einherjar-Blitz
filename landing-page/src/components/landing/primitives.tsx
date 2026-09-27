'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Single, quiet entrance: short rise + fade, once. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-primary', className)}>
      <span className="h-px w-6 bg-primary/60" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn('max-w-2xl', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-5 font-title text-3xl leading-[1.15] text-white/95 md:text-[2.75rem]">{title}</h2>
      {subtitle ? <p className="mt-5 text-base leading-relaxed text-white/55 md:text-[17px]">{subtitle}</p> : null}
    </Reveal>
  );
}

/** Hairline divider. */
export function Rule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('h-px w-full bg-white/[0.08]', className)} />;
}
