'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Crosshair, Heart, Lock, Shield, Swords } from 'lucide-react';
import { GAME_CHARACTERS, REY_ESCARLATA_BOSS } from '@/constants/battleData';
import { getCharacterAnimation } from '@/constants/characterAssets';
import { SpriteActor } from '@/components/juego/game/SpriteActor';
import { EASE_OUT, Embers, Reveal } from './primitives';

const argos = GAME_CHARACTERS.argos;
const argosIdle = getCharacterAnimation('argos', 'idle');
const bossIdle = getCharacterAnimation('rey_escarlata', 'idle');

function Fighter({
  side,
  name,
  title,
  hp,
  attack,
  children,
}: {
  side: 'left' | 'right';
  name: string;
  title: string;
  hp: number;
  attack: string;
  children: React.ReactNode;
}) {
  const danger = side === 'right';
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -80 : 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1.1, ease: EASE_OUT }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <span className={`absolute bottom-6 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl ${danger ? 'bg-red-600/35' : 'bg-cyan-400/25'}`} />
        <div className="relative">{children}</div>
        <span className={`mx-auto -mt-3 block h-3 w-36 rounded-[50%] blur-sm ${danger ? 'bg-red-950/80' : 'bg-black/70'}`} />
      </div>
      <div className={`mt-4 w-52 border px-4 py-3 text-center backdrop-blur-md ${danger ? 'border-red-500/40 bg-red-950/40' : 'border-cyan-300/30 bg-cyan-950/30'}`}>
        <p className={`text-[9px] font-bold uppercase tracking-[0.3em] ${danger ? 'text-red-400' : 'text-cyan-300'}`}>{title}</p>
        <p className="font-title text-lg text-white/95">{name}</p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {hp}
          </span>
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" /> {attack}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ArenaTeaser() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);

  return (
    <section id="arena" ref={ref} className="relative overflow-hidden py-28 md:py-36">
      <motion.div className="absolute inset-[-12%_0]" style={{ y: bgY }} aria-hidden="true">
        <Image src="/juego/game/arena-scarlet-forge.webp" alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/55 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      <Embers count={24} />

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-red-400">
            <Lock className="h-3.5 w-3.5" /> Próximamente
          </span>
          <h2 className="mt-6 font-title text-4xl leading-tight text-white/95 md:text-6xl">
            La arena <span className="text-red-500">escarlata</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60 md:text-lg">
            Combates por turnos contra el Rey Escarlata. Ataca, defiéndete, regenera y desata la habilidad especial de tu
            campeón cuando más lo necesites.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col items-center justify-center gap-10 md:flex-row md:gap-6">
          <Fighter side="left" name={argos.name} title="Einherjar" hp={argos.maxHealth} attack={`${argos.attack.minDamage}–${argos.attack.maxDamage}`}>
            {argosIdle ? <SpriteActor animation="idle" clip={argosIdle} compact /> : null}
          </Fighter>

          <motion.div
            initial={{ opacity: 0, scale: 2.5, rotate: -20 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.6, type: 'spring', stiffness: 160, damping: 12 }}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center"
          >
            <span className="landing-spin-slow absolute inset-0 rounded-full border border-dashed border-primary/50" />
            <span className="font-title text-4xl text-primary drop-shadow-[0_0_16px_rgba(201,170,113,0.8)]">VS</span>
          </motion.div>

          <Fighter
            side="right"
            name={REY_ESCARLATA_BOSS.name}
            title="Jefe de misión"
            hp={REY_ESCARLATA_BOSS.maxHealth}
            attack={`${REY_ESCARLATA_BOSS.attack.minDamage}–${REY_ESCARLATA_BOSS.attack.maxDamage}`}
          >
            {bossIdle ? <SpriteActor animation="idle" clip={bossIdle} compact /> : null}
          </Fighter>
        </div>

        <Reveal delay={0.2} className="mx-auto mt-16 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: Swords, title: 'Turnos tácticos', text: 'Ataque, defensa, regeneración y especial.' },
            { icon: Shield, title: 'Fase II', text: 'Al 50% de vida el Trono Escarlata se eleva.' },
            { icon: Crosshair, title: 'Transformaciones', text: 'Argos invoca al Androide Galileo.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-red-400" />
              <p className="mt-2 font-title text-sm text-white/90">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
