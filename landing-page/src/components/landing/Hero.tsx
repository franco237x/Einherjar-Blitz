'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GAME_CHARACTERS } from '@/constants/battleData';
import { ALL_REWARDS } from '@/constants/gachaData';
import { ChampionDeck } from './ChampionDeck';
import { EASE_OUT, Eyebrow } from './primitives';

const FACTS = [
  { value: String(Object.values(GAME_CHARACTERS).filter((c) => c.isPlayableBase).length), label: 'Campeones' },
  { value: String(ALL_REWARDS.length), label: 'Recompensas' },
  { value: '6', label: 'Rangos' },
];

function enter(delay: number) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: EASE_OUT },
  } as const;
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section id="inicio" ref={ref} className="relative overflow-hidden pt-[72px]">
      <div
        className="pointer-events-none absolute right-[-10%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-primary/[0.07] blur-[140px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-6xl items-center gap-16 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <motion.div {...enter(0.1)}>
            <Eyebrow>RPG de colección · En desarrollo</Eyebrow>
          </motion.div>

          <motion.h1
            {...enter(0.2)}
            className="mt-7 font-title text-[3.1rem] leading-[1.02] tracking-[0.02em] text-white min-[400px]:text-6xl lg:text-[5.25rem]"
          >
            Einherjar
            <br />
            <span className="text-primary">Blitz</span>
          </motion.h1>

          <motion.p {...enter(0.35)} className="mt-8 max-w-md text-[17px] leading-relaxed text-white/60">
            Colecciona guerreros, fusiona sus linajes y lidera un equipo de tres en la arena del Valhalla. El portal ya
            está abierto: invoca, administra tus llaves y esferas, y prepárate para el primer combate.
          </motion.p>

          <motion.div {...enter(0.5)} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/juego/registro"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#d8bd88]"
            >
              Crear una cuenta
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/juego"
              className="group inline-flex items-center gap-2 text-[15px] text-white/75 transition-colors hover:text-white"
            >
              Entrar al portal
              <span className="h-px w-6 bg-white/40 transition-all duration-300 group-hover:w-9 group-hover:bg-primary" />
            </Link>
          </motion.div>

          <motion.dl {...enter(0.65)} className="mt-16 flex max-w-md divide-x divide-white/[0.08] border-t border-white/[0.08] pt-6">
            {FACTS.map((fact) => (
              <div key={fact.label} className="flex flex-1 flex-col px-5 first:pl-0">
                <dt className="order-2 mt-1 text-[11px] uppercase tracking-[0.2em] text-white/40">{fact.label}</dt>
                <dd className="font-title text-2xl text-white/90">{fact.value}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.figure
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE_OUT }}
          className="relative mx-auto w-full max-w-[440px]"
        >
          <ChampionDeck parallaxY={artY} />
        </motion.figure>
      </div>
    </section>
  );
}
