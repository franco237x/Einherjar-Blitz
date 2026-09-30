'use client';

/**
 * Horizontal strip of a banner's top rewards. Cards swing in one after another,
 * lean toward the pointer, and the legendary/mythic ones carry a holo foil.
 * Kept light: it mounts whenever the banner changes, so the stars pop with CSS
 * and touch screens (which never tilt) get a plain press instead of TiltCard.
 */

import { memo, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { RARITIES, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { SPRINGS, TiltCard } from '../motion';
import { Icon } from '../Icon';
import { HoloFoil, useFinePointer } from './fx';

const FOIL_RARITIES: RarityKey[] = ['mythic', 'legendary'];
const LIST_DELAY = 0.05;
const LIST_STEP = 0.07;

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: LIST_STEP, delayChildren: LIST_DELAY } },
};

const card: Variants = {
  hidden: { opacity: 0, x: 48, rotateY: -28, scale: 0.94 },
  show: { opacity: 1, x: 0, rotateY: 0, scale: 1, transition: SPRINGS.soft },
};

export const FeaturedRewards = memo(function FeaturedRewards({ rewards }: { rewards: RewardItem[] }) {
  const tilt = useFinePointer();
  return (
    <motion.ul
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ perspective: 900 }}
      variants={list}
      initial="hidden"
      animate="show"
    >
      {rewards.map((reward, index) => (
        <FeaturedReward key={reward.name} reward={reward} index={index} tilt={tilt} />
      ))}
    </motion.ul>
  );
});

function CardFrame({ tilt, style, children }: { tilt: boolean; style: CSSProperties; children: ReactNode }) {
  const className = 'relative overflow-hidden rounded-2xl border bg-[#0e0d0c]';
  if (tilt) {
    return (
      <TiltCard max={10} className={className} style={style}>
        {children}
      </TiltCard>
    );
  }
  return (
    <motion.div className={className} style={style} whileTap={{ scale: 0.97 }} transition={SPRINGS.snappy}>
      {children}
    </motion.div>
  );
}

function FeaturedReward({ reward, index, tilt }: { reward: RewardItem; index: number; tilt: boolean }) {
  const [imageError, setImageError] = useState(false);
  const rarity = RARITIES[reward.rarity];
  const foil = FOIL_RARITIES.includes(reward.rarity);
  // The stars pop once the card has swung in, following the list's stagger.
  const starsAt = LIST_DELAY + index * LIST_STEP + 0.25;

  return (
    <motion.li variants={card} className="w-[138px] shrink-0 snap-start">
      <CardFrame
        tilt={tilt}
        style={{
          borderColor: `${rarity.color}66`,
          boxShadow: `0 14px 28px -16px ${rarity.glowColor}, inset 0 0 0 1px ${rarity.color}14`,
        }}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {reward.image && !imageError ? (
            <img
              src={reward.image}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon name={reward.fallbackIcon} size={40} color={rarity.color} />
            </div>
          )}
          <span
            className="pointer-events-none absolute inset-0"
            // A low rarity tint that sinks into the card body without washing out the art.
            style={{ background: `linear-gradient(180deg, transparent 52%, ${rarity.glowColor} 88%, #0e0d0c 100%)`, opacity: 0.75 }}
          />
          {foil ? <HoloFoil delay={1 + index * 0.35} every={5.5} /> : null}
          <span
            className="absolute left-2 top-2 z-[7] rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] backdrop-blur-md"
            style={{ color: rarity.color }}
          >
            {rarity.label}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="block h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)` }}
        />
        <div className="px-3 pb-3 pt-2">
          <p className="truncate text-sm font-bold text-white/95">{reward.name}</p>
          <div className="mt-1 flex gap-px" aria-label={`${rarity.stars} estrellas`}>
            {Array.from({ length: rarity.stars }).map((_, i) => (
              <span
                key={i}
                className="juego-pop-in flex"
                style={{ animationDelay: `${(starsAt + i * 0.05).toFixed(2)}s` }}
              >
                <Icon name="star" size={10} color={rarity.color} />
              </span>
            ))}
          </div>
        </div>
      </CardFrame>
    </motion.li>
  );
}
