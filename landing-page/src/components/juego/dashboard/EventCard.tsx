'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { SPRINGS } from '@/components/juego/motion';
import { cn } from '@/lib/utils';
import { MotionLink } from './MotionLink';
import { enterInView } from './reveal';
import styles from './dashboard.module.css';

/** Fireflies around the tree: horizontal spot, sway, duration and delay. */
const FIREFLIES = [
  { left: '18%', top: '62%', fx: '-6px', fd: '4.2s', delay: '0s' },
  { left: '72%', top: '56%', fx: '8px', fd: '5s', delay: '1.4s' },
  { left: '44%', top: '70%', fx: '4px', fd: '4.6s', delay: '2.6s' },
  { left: '86%', top: '34%', fx: '-5px', fd: '3.8s', delay: '3.3s' },
];

/** Finished Agro event: the tree floats in its own light while fireflies rise. */
export function EventCard({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div className="mt-3" {...enterInView(delay)}>
      <MotionLink
        href="/evento/agro"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={SPRINGS.snappy}
        className="group relative flex items-center gap-3 overflow-hidden rounded-3xl border border-[#a7bb76]/30 bg-[linear-gradient(110deg,#17261c_0%,#131f18_55%,#0f1712_100%)] p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <span className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-[#a7bb76]/15 blur-3xl" aria-hidden="true" />
        <span className="relative z-10 min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#cfdb9c]/30 bg-[#cfdb9c]/10 px-2.5 py-0.5 text-[9px] font-bold tracking-[0.18em] text-[#d1dda3]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cfdb9c]/60" />
            EVENTO FINALIZADO
          </span>
          <span className="mt-2 block font-title text-[20px] leading-tight text-white/95">El Huerto de Yggdrasil</span>
          <span className="mt-1 block text-[12px] leading-[18px] text-white/60">
            Gracias por participar. Mira los logros de tu huerto y tus vales.
          </span>
          <span className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e5ce96]">
            Ver mis logros
            <Icon
              name="arrow-forward"
              size={15}
              className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1"
            />
          </span>
        </span>
        <span className="relative z-10 h-24 w-24 shrink-0">
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(214,226,160,0.32),transparent)]',
              styles.glow
            )}
          />
          <motion.span
            className="block"
            initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
            whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ ...SPRINGS.bouncy, delay: delay + 0.15, opacity: { duration: 0.3, delay: delay + 0.15 } }}
          >
            <span className={cn('block', styles.float)}>
              <Image
                src="/evento-agro/arbol-alba.png"
                alt=""
                width={112}
                height={112}
                sizes="96px"
                className="h-24 w-24 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
              />
            </span>
          </motion.span>
          {!reduceMotion
            ? FIREFLIES.map((fly) => (
                <span
                  key={fly.left}
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute h-1 w-1 rounded-full bg-[#eaf5b8] shadow-[0_0_6px_2px_rgba(226,240,160,0.6)]',
                    styles.firefly
                  )}
                  style={
                    { left: fly.left, top: fly.top, '--fx': fly.fx, '--fd': fly.fd, '--fdelay': fly.delay } as CSSProperties
                  }
                />
              ))
            : null}
        </span>
      </MotionLink>
    </motion.div>
  );
}
