'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { BANNERS, RARITIES, type RewardItem } from '@/constants/gachaData';
import { cn } from '@/lib/utils';
import { EASE_OUT, Reveal, SectionHeading } from './primitives';

const AUTOPLAY_SECONDS = 7;
const banner = BANNERS[0];
const TOTAL_WEIGHT = banner.rewards.reduce((sum, item) => sum + item.weight, 0);

// The rarest rewards with artwork large enough for a full-height frame.
const FEATURED_NAMES = ['Wild Card', 'Izanagi-no-Okami', 'Makoto Yuki', 'Ren Amamiya', 'Messiah'];
const FEATURED = FEATURED_NAMES.map((name) => banner.rewards.find((r) => r.name === name)).filter(
  (r): r is RewardItem => Boolean(r?.image)
);

const TYPE_LABELS: Record<RewardItem['type'], string> = {
  persona: 'Persona',
  invocacion: 'Invocación',
  otros: 'Carta especial',
};

function formatOdds(weight: number) {
  const p = (weight / TOTAL_WEIGHT) * 100;
  return p >= 1 ? `${p.toFixed(1)}%` : `${p.toFixed(2)}%`;
}

export function FeaturedCharacters() {
  const sectionRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const inView = useInView(sectionRef, { amount: 0.4 });
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [userPicked, setUserPicked] = useState(false);

  const autoplay = inView && !userPicked && !reducedMotion;
  const item = FEATURED[active];
  const rarity = RARITIES[item.rarity];

  const pick = (index: number) => {
    setUserPicked(true);
    setActive(index);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = (active + step + FEATURED.length) % FEATURED.length;
    pick(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <section id="personajes" ref={sectionRef} className="border-t border-white/[0.06] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Personajes"
          title="Las leyendas más buscadas del altar."
          subtitle="Personas e invocaciones que puedes conseguir en la Habitación Terciopelo. Cuanto más rara la carta, más solemne la ceremonia."
        />

        <div className="mt-16 grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16 lg:gap-24">
          <Reveal>
            <figure className="relative mx-auto w-full max-w-[420px]">
              <span className="absolute -inset-3 border border-primary/15" aria-hidden="true" />
              <div className="relative aspect-[3/4] overflow-hidden bg-[#121110]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={item.name}
                    className="absolute inset-0"
                    initial={{ clipPath: 'inset(100% 0 0 0)', scale: 1.06, zIndex: 2 }}
                    animate={{ clipPath: 'inset(0% 0 0 0)', scale: 1, zIndex: 2 }}
                    exit={{ zIndex: 1, transition: { duration: 0.9 } }}
                    transition={{ duration: 0.9, ease: EASE_OUT }}
                  >
                    <Image
                      src={item.image as string}
                      alt={item.name}
                      fill
                      sizes="(min-width: 768px) 420px, 90vw"
                      className="object-cover object-top"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 z-[3] bg-gradient-to-t from-[#0b0a09]/85 via-transparent to-transparent" />
                <motion.span
                  key={`line-${item.name}`}
                  className="absolute inset-x-0 top-0 z-[3] h-[2px] origin-left"
                  style={{ backgroundColor: rarity.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.figcaption
                    key={item.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT }}
                    className="absolute inset-x-6 bottom-6 z-[3]"
                  >
                    <span className="flex gap-1" aria-label={`${rarity.stars} estrellas`}>
                      {Array.from({ length: rarity.stars }, (_, i) => (
                        <Star key={i} className="h-3 w-3" style={{ color: rarity.color, fill: rarity.color }} />
                      ))}
                    </span>
                    <span className="mt-3 block font-title text-2xl text-white">{item.name}</span>
                  </motion.figcaption>
                </AnimatePresence>
              </div>
            </figure>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col">
            <div role="tablist" aria-orientation="vertical" aria-label="Personajes destacados" className="border-t border-white/[0.08]">
              {FEATURED.map((f, i) => {
                const selected = i === active;
                const r = RARITIES[f.rarity];
                return (
                  <button
                    key={f.name}
                    ref={(el) => {
                      tabsRef.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="featured-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => pick(i)}
                    onKeyDown={onTabKeyDown}
                    className="group relative flex w-full items-center justify-between gap-6 border-b border-white/[0.08] py-5 text-left"
                  >
                    <span className="flex items-baseline gap-5">
                      <span className="w-5 font-title text-sm text-white/25">{String(i + 1).padStart(2, '0')}</span>
                      <span
                        className={cn(
                          'font-title text-lg transition-colors md:text-xl',
                          selected ? 'text-white' : 'text-white/45 group-hover:text-white/75'
                        )}
                      >
                        {f.name}
                      </span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: selected ? r.color : 'rgba(255,255,255,0.3)' }}>
                      {r.label}
                    </span>
                    {selected ? (
                      <motion.span
                        key={`${active}-${autoplay}`}
                        className="absolute inset-x-0 -bottom-px h-px origin-left bg-primary"
                        initial={{ scaleX: autoplay ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={autoplay ? { duration: AUTOPLAY_SECONDS, ease: 'linear' } : { duration: 0 }}
                        onAnimationComplete={() => {
                          if (autoplay) setActive((current) => (current + 1) % FEATURED.length);
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div id="featured-panel" role="tabpanel" className="mt-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.dl
                  key={item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-3 divide-x divide-white/[0.08]"
                >
                  {[
                    { label: 'Tipo', value: TYPE_LABELS[item.type] },
                    { label: 'Rareza', value: rarity.label.charAt(0) + rarity.label.slice(1).toLowerCase() },
                    { label: 'Probabilidad', value: formatOdds(item.weight) },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col px-4 first:pl-0">
                      <dt className="order-2 mt-1 text-[11px] uppercase tracking-[0.2em] text-white/40">{stat.label}</dt>
                      <dd className="font-title text-lg tabular-nums text-white/90">{stat.value}</dd>
                    </div>
                  ))}
                </motion.dl>
              </AnimatePresence>
            </div>

            <Link
              href="/juego/gacha"
              className="group mt-10 inline-flex w-fit items-center gap-2 text-[15px] text-primary transition-colors hover:text-[#d8bd88]"
            >
              Probar suerte en el altar
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
