'use client';

import { motion } from 'framer-motion';
import { Award, Crown, Medal, Shield, Star, Swords, Trophy } from 'lucide-react';
import { EASE_OUT, Reveal, SectionHeading } from './primitives';

// Thresholds mirror calculateRank() in src/services/battleService.ts.
const RANKS = [
  { name: 'Iniciado', copas: 0, icon: Shield },
  { name: 'Recluta', copas: 50, icon: Swords },
  { name: 'Guerrero', copas: 150, icon: Medal },
  { name: 'Veterano', copas: 300, icon: Award },
  { name: 'Elite', copas: 500, icon: Star },
  { name: 'Einherjar', copas: 800, icon: Crown },
];

const VICTORY_REWARDS = [
  { label: 'Copas', value: '+10' },
  { label: 'Esferas', value: '+5' },
  { label: 'Experiencia', value: '+15' },
];

export function RankLadder() {
  return (
    <section id="rangos" className="relative mx-auto max-w-7xl px-5 py-28 md:py-36">
      <SectionHeading
        eyebrow="Gloria y rango"
        title="Del Iniciado al"
        highlight="Einherjar"
        subtitle="Cada victoria suma copas y cada umbral te acerca al salón de los elegidos. Tu rango se calcula en el servidor, sin atajos."
      />

      <div className="relative">
        {/* Track */}
        <div className="absolute left-[27px] top-0 h-full w-px bg-white/10 md:left-0 md:top-[27px] md:h-px md:w-full" aria-hidden="true" />
        <motion.div
          className="absolute left-[27px] top-0 w-px origin-top bg-gradient-to-b from-primary/20 via-primary to-[#f3dca6] shadow-[0_0_12px_#c9aa71] md:hidden"
          initial={{ height: 0 }}
          whileInView={{ height: '100%' }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 2.2, ease: EASE_OUT }}
          aria-hidden="true"
        />
        <motion.div
          className="absolute left-0 top-[27px] hidden h-px bg-gradient-to-r from-primary/20 via-primary to-[#f3dca6] shadow-[0_0_12px_#c9aa71] md:block"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 2.2, ease: EASE_OUT }}
          aria-hidden="true"
        />

        <ol className="relative flex flex-col gap-8 md:flex-row md:justify-between md:gap-2">
          {RANKS.map((rank, i) => {
            const Icon = rank.icon;
            const top = i === RANKS.length - 1;
            return (
              <motion.li
                key={rank.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.3, ease: EASE_OUT }}
                className="flex items-center gap-5 md:flex-1 md:flex-col md:gap-4 md:text-center"
              >
                <motion.span
                  initial={{ scale: 0.5, backgroundColor: 'rgba(0,0,0,1)' }}
                  whileInView={{ scale: 1, backgroundColor: top ? 'rgba(201,170,113,1)' : 'rgba(20,18,15,1)' }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.3, type: 'spring', stiffness: 220, damping: 14 }}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/50"
                  style={{ boxShadow: top ? '0 0 40px rgba(201,170,113,0.6)' : undefined }}
                >
                  {top && <span className="landing-pulse-ring absolute inset-0 rounded-2xl border border-primary" />}
                  <Icon className={top ? 'h-7 w-7 text-black' : 'h-6 w-6 text-primary'} />
                </motion.span>
                <div>
                  <p className={top ? 'landing-shimmer-text font-title text-xl' : 'font-title text-lg text-white/90'}>{rank.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45 md:justify-center">
                    <Trophy className="h-3 w-3 text-primary/70" />
                    {rank.copas === 0 ? 'Inicio' : `${rank.copas} copas`}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <Reveal delay={0.2} className="mx-auto mt-20 max-w-2xl">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent p-7 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
            <Trophy className="h-7 w-7 text-primary" />
          </span>
          <div className="flex-1">
            <p className="font-title text-lg text-white/95">Cada victoria en la arena</p>
            <p className="text-sm text-white/55">Recompensas fijas, validadas por las reglas del servidor.</p>
          </div>
          <div className="flex gap-3">
            {VICTORY_REWARDS.map((reward) => (
              <div key={reward.label} className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-center">
                <p className="font-title text-lg text-primary">{reward.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">{reward.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
