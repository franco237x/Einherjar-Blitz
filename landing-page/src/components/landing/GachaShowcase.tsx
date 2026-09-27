'use client';

import { useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { BANNERS, RARITIES, getRarityOdds, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { EASE_OUT, Reveal, SectionHeading } from './primitives';

const SHOWCASE_NAMES = ['Jack Frost', 'Orpheus Telos', 'Wild Card', 'Satanael', 'Izanagi-no-Okami'];
const banner = BANNERS[0];
const SHOWCASE = SHOWCASE_NAMES.map((name) => banner.rewards.find((r) => r.name === name)).filter(
  (r): r is RewardItem => Boolean(r)
);
const ODDS = getRarityOdds(banner.rewards);

const TYPE_LABEL: Record<RewardItem['type'], string> = {
  persona: 'Persona',
  invocacion: 'Invocación',
  otros: 'Recurso',
};

function formatPercent(p: number) {
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

function RewardCard({ item, index, active, onHover }: { item: RewardItem; index: number; active: boolean; onHover: () => void }) {
  const rarity = RARITIES[item.rarity];
  const offset = index - (SHOWCASE.length - 1) / 2;
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const glareX = useTransform(sry, [-15, 15], ['0%', '100%']);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    ry.set(((event.clientX - rect.left) / rect.width - 0.5) * 30);
    rx.set(-((event.clientY - rect.top) / rect.height - 0.5) * 30);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotate: 0 }}
      whileInView={{ opacity: 1, y: Math.abs(offset) * 18, rotate: offset * 7 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: EASE_OUT }}
      className="relative"
      style={{ zIndex: active ? 20 : 10 - Math.abs(offset) }}
      onPointerEnter={onHover}
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        animate={{ scale: active ? 1.12 : 1, y: active ? -24 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
        className="relative h-[210px] w-[140px] cursor-pointer overflow-hidden rounded-2xl bg-black sm:h-[270px] sm:w-[180px]"
      >
        <img src={item.image ?? ''} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 transition-shadow duration-500"
          style={{ borderColor: rarity.color, boxShadow: `inset 0 0 24px ${rarity.glowColor}, 0 0 ${active ? 50 : 22}px ${rarity.glowColor}` }}
        />
        <motion.span
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: active ? 0.35 : 0,
            background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.7) 45%, transparent 60%)',
            backgroundSize: '250% 100%',
            backgroundPositionX: glareX,
          }}
        />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-3 pt-10 text-center">
          <span className="flex justify-center gap-0.5">
            {Array.from({ length: rarity.stars }).map((_, s) => (
              <Star key={s} className="h-3 w-3" fill={rarity.color} color={rarity.color} />
            ))}
          </span>
          <span className="mt-1 block truncate text-sm font-bold" style={{ color: rarity.color }}>
            {item.name}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{TYPE_LABEL[item.type]}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

export function GachaShowcase() {
  const [active, setActive] = useState(2);
  const activeRarity: RarityKey = SHOWCASE[active]?.rarity ?? 'mythic';

  return (
    <section id="invocaciones" className="relative overflow-hidden py-28 md:py-36">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
        animate={{ backgroundColor: RARITIES[activeRarity].glowColor }}
        transition={{ duration: 0.8 }}
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow={banner.title}
          title="Invoca a las"
          highlight="leyendas"
          subtitle={`Personas, invocaciones y artefactos del banner ${banner.title}. Cada tirada cuesta ${banner.costAmount} llave y las probabilidades son públicas.`}
        />

        <div className="flex justify-center pb-16 pt-6" role="list" aria-label="Recompensas destacadas">
          {SHOWCASE.map((item, i) => (
            <div key={item.name} role="listitem" className={i === 0 || i === SHOWCASE.length - 1 ? 'hidden -mx-4 sm:block' : '-mx-6 sm:-mx-4'}>
              <RewardCard item={item} index={i} active={active === i} onHover={() => setActive(i)} />
            </div>
          ))}
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <h3 className="font-title text-2xl text-white/95">Probabilidades transparentes</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Las tasas salen directo de la tabla de recompensas del juego. Lo que ves aquí es exactamente lo que
              usa cada invocación.
            </p>
            <Link
              href="/juego/gacha"
              className="group mt-7 inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Ir al altar de invocación
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={0.15}>
            <ul className="space-y-4 rounded-3xl border border-white/[0.07] bg-black/40 p-6 backdrop-blur-sm">
              {ODDS.map(({ rarity, percent }, i) => {
                const cfg = RARITIES[rarity];
                return (
                  <li key={rarity} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <span className="flex gap-0.5">
                        {Array.from({ length: cfg.stars }).map((_, s) => (
                          <Star key={s} className="h-2.5 w-2.5" fill={cfg.color} color={cfg.color} />
                        ))}
                      </span>
                      <span className="text-xs font-bold tracking-wider" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg.color, boxShadow: `0 0 12px ${cfg.glowColor}` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(percent, 1.5)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.3 + i * 0.12, ease: EASE_OUT }}
                      />
                    </div>
                    <span className="w-14 text-right text-sm font-bold text-white/90">{formatPercent(percent)}</span>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
