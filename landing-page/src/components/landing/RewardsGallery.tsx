'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BANNERS, RARITIES } from '@/constants/gachaData';
import { Eyebrow } from './primitives';

// The landing showcases the Persona banner specifically.
const banner = BANNERS.find((b) => b.id === 'persona') ?? BANNERS[0];
const TOTAL_WEIGHT = banner.rewards.reduce((sum, item) => sum + item.weight, 0);
// Characters and personas only; skip the generic resource drop.
const REWARDS = banner.rewards.filter((item) => item.image && !(item.type === 'otros' && item.rarity === 'common'));

function formatOdds(weight: number) {
  const p = (weight / TOTAL_WEIGHT) * 100;
  return p >= 1 ? `${p.toFixed(1)}%` : `${p.toFixed(2)}%`;
}

/**
 * Vertical scroll drives a horizontal track while the panel is pinned.
 * The pinned distance equals the track overflow, so the pace is 1:1.
 */
export function RewardsGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!track || !viewport) return;
    const observer = new ResizeObserver(() => {
      setDistance(Math.max(0, track.scrollWidth - viewport.clientWidth));
    });
    observer.observe(track);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  return (
    <div ref={containerRef} className="relative mt-24 md:mt-32" style={{ height: `calc(100svh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 flex w-full max-w-6xl items-end justify-between gap-6 px-6">
          <div>
            <Eyebrow>Dentro del banner</Eyebrow>
            <p className="mt-4 font-title text-2xl text-white/90 md:text-3xl">{REWARDS.length} personajes para invocar</p>
          </div>
          <div className="hidden w-40 md:block" aria-hidden="true">
            <div className="h-px w-full bg-white/10">
              <motion.div className="h-px origin-left bg-primary" style={{ scaleX: scrollYProgress }} />
            </div>
          </div>
        </div>

        <motion.ul ref={trackRef} style={{ x }} className="flex w-max gap-5 px-6 md:gap-7 xl:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
          {REWARDS.map((item) => {
            const rarity = RARITIES[item.rarity];
            return (
              <li key={item.name} className="w-[210px] shrink-0 md:w-[250px]">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#121110]">
                  <Image
                    src={item.image as string}
                    alt={item.name}
                    fill
                    sizes="250px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                  <span className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: rarity.color }} />
                </div>
                <p className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em]">
                  <span style={{ color: rarity.color }}>{rarity.label}</span>
                  <span className="tabular-nums text-white/40">{formatOdds(item.weight)}</span>
                </p>
                <p className="mt-2 font-title text-[15px] text-white/85">{item.name}</p>
              </li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}
