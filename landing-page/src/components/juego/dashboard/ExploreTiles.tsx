'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { Sheen, TiltCard } from '@/components/juego/motion';
import { cn } from '@/lib/utils';
import { enterInView } from './reveal';

export interface ExploreTileData {
  key: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  image: string;
  focus: string;
}

const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0a09]';

/** Slow art zoom on hover; skipped for reduced motion. */
const artZoom =
  'motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-110';
const nudge = 'motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1';

/** Portal tile: leans toward the pointer, zooms its art on hover and catches a passing sheen. */
export function ExploreTile({ tile, index, delay }: { tile: ExploreTileData; index: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // The sheen loop only runs while the tile is on screen.
  const inView = useInView(ref);

  return (
    <motion.div ref={ref} {...enterInView(delay + index * 0.08, 0.2)}>
      {/* tabIndex -1: whileTap would otherwise make the wrapper an empty tab stop before the link. */}
      <TiltCard max={9} press={0.96} className="rounded-3xl" tabIndex={-1}>
        <Link
          href={tile.href}
          className={cn(
            'group relative flex aspect-[4/5] flex-col overflow-hidden rounded-3xl border border-white/[0.08] p-3.5',
            focusRing
          )}
        >
          <img
            src={tile.image}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover', artZoom)}
            style={{ objectPosition: tile.focus }}
          />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.05)_0%,rgba(11,10,9,0.6)_50%,rgba(11,10,9,0.97)_100%)]" />
          {inView ? <Sheen every={7} delay={2.2 + index * 1.6} duration={1.4} color="rgba(255,236,200,0.16)" /> : null}
          <span className="relative mt-auto block">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 bg-black/50 backdrop-blur-md motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:-rotate-6">
              <Icon name={tile.icon} size={17} color="#c9aa71" />
            </span>
            <span className="mt-2 flex items-center justify-between gap-1">
              <span className="font-title text-[17px] leading-tight text-white">{tile.title}</span>
              <Icon name="arrow-forward" size={16} color="#c9aa71" className={cn('shrink-0', nudge)} />
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-white/60">{tile.description}</span>
          </span>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

const shell = 'relative flex min-h-[88px] items-center gap-3.5 overflow-hidden rounded-3xl border border-white/[0.08] p-4';

/** Arena strip. Locked (coming soon) it stays grey, its badge glints now and then and shakes when tapped. */
export function ArenaStrip({ delay, comingSoon }: { delay: number; comingSoon?: boolean }) {
  if (!comingSoon) {
    return (
      <motion.div className="mt-3" {...enterInView(delay)}>
        <TiltCard max={5} press={0.985} className="rounded-3xl" tabIndex={-1}>
          <Link href="/juego/jugar" aria-label="Abrir arena de combate" className={cn('group', shell, focusRing)}>
            <ArenaContent />
          </Link>
        </TiltCard>
      </motion.div>
    );
  }
  return (
    <motion.div className="mt-3" {...enterInView(delay)}>
      <LockedArena />
    </motion.div>
  );
}

const lockBadge: Variants = {
  idle: { x: 0 },
  tap: { x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.42 } },
};

function LockedArena() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    // Not interactive: tabIndex -1 keeps whileTap from turning the strip into a focusable stop.
    <motion.div
      ref={ref}
      className={shell}
      initial="idle"
      animate="idle"
      whileTap={reduceMotion ? undefined : 'tap'}
      tabIndex={-1}
    >
      <ArenaContent locked />
      <motion.span
        variants={lockBadge}
        className="relative flex shrink-0 items-center gap-1 overflow-hidden rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-white/75"
      >
        <Lock size={10} strokeWidth={2.5} aria-hidden="true" />
        PRONTO
        {inView ? <Sheen every={8.5} delay={2.4} duration={1} color="rgba(255,255,255,0.3)" /> : null}
      </motion.span>
    </motion.div>
  );
}

function ArenaContent({ locked }: { locked?: boolean }) {
  return (
    <>
      <img
        src="/juego/game/arena-nordica.webp"
        alt=""
        className={cn('absolute inset-0 h-full w-full object-cover', locked ? 'grayscale-[60%]' : artZoom)}
      />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,10,9,0.95)_0%,rgba(11,10,9,0.7)_60%,rgba(11,10,9,0.4)_100%)]" />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-black/50">
        <Icon name="game-controller" size={21} color={locked ? 'rgba(201,170,113,0.7)' : '#c9aa71'} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-title text-[17px] text-white">Arena de combate</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-white/60">Prueba a tus personajes en el modo RPG.</span>
      </span>
      {!locked ? (
        <Icon name="chevron-forward" size={20} color="#c9aa71" className={cn('relative shrink-0', nudge)} />
      ) : null}
    </>
  );
}
