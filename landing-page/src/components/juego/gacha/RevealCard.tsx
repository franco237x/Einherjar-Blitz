'use client';

/**
 * Result card of the summon ceremony. The cards start stacked face-down as a
 * deck in the middle of the results area, are dealt one by one to their slot
 * with a 3D flight, and flip on landing. Epic and better hold a beat, glowing,
 * before they turn and send out a shockwave; legendary and mythic also get a
 * column of light, a spark burst and a holographic foil.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
  type Variants,
} from 'framer-motion';
import { RARITIES, REWARD_TYPE_LABELS, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { cn } from '@/lib/utils';
import { EASE_OUT_EXPO, ParticleBurst, SPRINGS, seeded } from '../motion';
import { Icon } from '../Icon';
import { HoloFoil } from './fx';
import { RARITY_TIER } from './SummonScenes';

/** Seconds after the reveal mounts when the first card leaves the deck. */
const DEAL_START = 0.5;
/** Seconds between two cards leaving the deck. */
const DEAL_STEP = 0.075;
const FLIGHT = 0.55;
/** Extra beat epic+ cards hold face-down, glowing, before they turn. */
const SUSPENSE = 0.26;

export function dealTiming(index: number, rarity: RarityKey) {
  const leave = DEAL_START + index * DEAL_STEP;
  const land = leave + FLIGHT;
  const flip = land + 0.04 + (RARITY_TIER[rarity] >= 2 ? SUSPENSE : 0);
  return { leave, land, flip };
}

/** When the last card of a pull has turned (seconds after the reveal mounts). */
export function dealDuration(results: RewardItem[]) {
  return results.reduce((end, item, index) => Math.max(end, dealTiming(index, item.rarity).flip + 0.45), 0);
}

const FLIGHT_EASE = [0.22, 0.9, 0.3, 1] as const;

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  shown: (i: number) => ({ opacity: 1, scale: 1, transition: { ...SPRINGS.bouncy, delay: 0.08 + i * 0.05 } }),
};

interface RevealCardProps {
  item: RewardItem;
  index: number;
  total: number;
  isBest: boolean;
  single: boolean;
  reduceMotion: boolean;
}

/** Attribute marking the element whose visible center is where the deck sits. */
export const DECK_ATTRIBUTE = 'data-summon-deck';

export function RevealCard({ item, index, total, isBest, single, reduceMotion }: RevealCardProps) {
  const rarity = RARITIES[item.rarity];
  const tier = RARITY_TIER[item.rarity];
  const typeLabel = REWARD_TYPE_LABELS[item.type] ?? 'Recurso';
  const [imageError, setImageError] = useState(false);
  const [revealed, setRevealed] = useState(reduceMotion);
  const flipAt = dealTiming(index, item.rarity).flip;

  const slotRef = useRef<HTMLDivElement>(null);
  // Flight from the deck to the slot.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spin = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const lift = useMotionValue(1);
  const shown = useMotionValue(reduceMotion ? 1 : 0);
  const layer = useMotionValue(1);
  // Suspense before the flip (epic+): a wobble and the rarity glow seeping out.
  const wobble = useMotionValue(0);
  const charge = useMotionValue(0);
  // Front face angle: -180 is face-down, 0 face-up. The back stays 180° behind.
  const face = useMotionValue(reduceMotion ? 0 : -180);
  const back = useTransform(face, (angle) => angle + 180);
  const rotate = useTransform(() => spin.get() + wobble.get());

  useMotionValueEvent(face, 'change', (angle) => {
    if (!revealed && angle > -90) setRevealed(true);
  });

  // Measure before paint so the card never shows in its slot before the deal.
  useLayoutEffect(() => {
    if (reduceMotion) return;
    const slot = slotRef.current;
    // Found through the DOM: an ancestor's ref is not attached yet when this runs.
    const deck = slot?.closest(`[${DECK_ATTRIBUTE}]`);
    if (!slot || !deck) return;
    const s = slot.getBoundingClientRect();
    const d = deck.getBoundingClientRect();
    const dx = d.left + d.width / 2 - (s.left + s.width / 2);
    // Each card sits a hair higher than the one under it, so the deck has thickness.
    const dy = d.top + d.height / 2 - (s.top + s.height / 2) - (total - index) * 1.2;
    const { leave, land, flip } = dealTiming(index, item.rarity);
    const startSpin = (seeded(index + 11) - 0.5) * 14;
    const side = dx > 0 ? -1 : 1;

    x.set(dx);
    y.set(dy);
    spin.set(startSpin);
    lift.set(0.74);
    layer.set(60 + total - index);

    const running: AnimationPlaybackControls[] = [
      animate(shown, 1, { delay: 0.06 + (total - 1 - index) * 0.03, duration: 0.22 }),
      animate(x, 0, { delay: leave, duration: FLIGHT, ease: FLIGHT_EASE }),
      animate(y, [dy, dy - 36, 0], { delay: leave, duration: FLIGHT, times: [0, 0.2, 1], ease: ['easeOut', FLIGHT_EASE] }),
      animate(spin, [startSpin, side * 16, 0], { delay: leave, duration: FLIGHT + 0.05, times: [0, 0.45, 1] }),
      animate(tiltX, [0, 44, 0], { delay: leave, duration: FLIGHT, times: [0, 0.4, 1] }),
      animate(lift, [0.74, 1.14, 1], { delay: leave, duration: FLIGHT + 0.1, times: [0, 0.5, 1] }),
      animate(face, 0, { delay: flip, type: 'spring', stiffness: 160, damping: 15, mass: 0.9 }),
    ];
    if (tier >= 2) {
      running.push(
        // Builds while the card waits face-down, peaks as it turns, then lets go.
        animate(charge, [0, 1, 1, 0], {
          delay: land - 0.05,
          duration: flip - land + 0.75,
          times: [0, (flip - land) / (flip - land + 0.75), (flip - land + 0.2) / (flip - land + 0.75), 1],
        }),
        animate(wobble, [0, -4, 4, -3, 2, 0], { delay: land, duration: flip - land + 0.08 })
      );
    }
    // Landed cards go under the deck and the cards still in flight.
    const timers = [
      setTimeout(() => layer.set(1), land * 1000),
      setTimeout(() => layer.set(tier >= 2 ? 3 : 1), flip * 1000),
    ];
    return () => {
      running.forEach((controls) => controls.stop());
      timers.forEach(clearTimeout);
    };
  }, [charge, face, index, item.rarity, layer, lift, reduceMotion, shown, spin, tier, tiltX, total, wobble, x, y]);

  const fx = revealed && !reduceMotion;

  return (
    <motion.div
      ref={slotRef}
      role="img"
      aria-label={`Recompensa ${index + 1}: ${item.name}, ${rarity.label}${isBest ? ', destacado' : ''}`}
      className={cn(
        'relative shrink-0',
        single
          ? 'aspect-[5/7] w-[min(62vw,290px,calc((100dvh-300px)*0.7))]'
          : 'h-[clamp(140px,calc((100dvh-290px)/3),220px)] w-[calc((100%-24px)/4)] min-[640px]:h-[clamp(170px,calc((100dvh-300px)/2),300px)] min-[640px]:w-[calc((100%-48px)/5)]'
      )}
      style={{ zIndex: layer }}
    >
      {fx && tier >= 3 ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[150%] -translate-x-1/2 -translate-y-1/2"
          style={{ background: `radial-gradient(ellipse 34% 50% at 50% 50%, ${rarity.color}aa, ${rarity.color}33 45%, transparent 72%)` }}
          initial={{ scaleY: 0.1, opacity: 0 }}
          animate={{ scaleY: [0.1, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, times: [0, 0.25, 1], ease: 'easeOut' }}
        />
      ) : null}

      <motion.div
        className="absolute inset-0"
        style={{ x, y, rotate, rotateX: tiltX, scale: lift, opacity: shown, transformPerspective: 800 }}
      >
        {tier >= 2 && !reduceMotion ? (
          // Turns with the back face, so the glow goes edge-on with the card instead of framing an
          // empty slot mid-flip; the front face's ring and shockwave take over once it has turned.
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-[14px] [backface-visibility:hidden]"
            style={{
              rotateY: back,
              transformPerspective: 900,
              opacity: charge,
              boxShadow: `0 0 26px 4px ${rarity.color}, inset 0 0 0 1.5px ${rarity.color}`,
            }}
          />
        ) : null}

        {/* Back face */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[10px] border border-gold/50 [backface-visibility:hidden]"
          style={{
            rotateY: back,
            transformPerspective: 900,
            background: 'radial-gradient(circle at 50% 38%, #1b2440 0%, #0a0d18 58%, #05070c 100%)',
            boxShadow: '0 12px 26px -10px rgba(0,0,0,0.9)',
          }}
        >
          <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(201,170,113,0.07)_0_1px,transparent_1px_9px)]" />
          <span className="absolute inset-[5px] rounded-[7px] border border-gold/20" />
          {tier >= 2 && !reduceMotion ? (
            <motion.span
              className="absolute inset-0"
              style={{ opacity: charge, background: `radial-gradient(circle at 50% 45%, ${rarity.glowColor}, transparent 72%)` }}
            />
          ) : null}
          <span
            className={cn(
              'relative flex rotate-45 items-center justify-center border border-gold/70 bg-black/30',
              single ? 'h-20 w-20' : 'h-9 w-9 min-[640px]:h-12 min-[640px]:w-12'
            )}
          >
            <Icon name="diamond" size={single ? 36 : 16} color="#e2c68e" className="-rotate-45" />
          </span>
          <span
            className={cn(
              'relative mt-3 font-mono tracking-widest text-gold/80',
              single ? 'text-xs' : 'text-[9px] min-[640px]:text-[10px]'
            )}
          >
            EIN // {String(index + 1).padStart(2, '0')}
          </span>
        </motion.div>

        {/* Front face */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#070a10] [backface-visibility:hidden]"
          style={{
            rotateY: face,
            transformPerspective: 900,
            border: `${isBest ? 2 : 1}px solid ${rarity.color}`,
            boxShadow: `0 0 22px ${rarity.glowColor}`,
          }}
        >
          {item.image && !imageError ? (
            <img
              src={item.image}
              alt=""
              // Decoded with the frame it first shows in: a blank face mid-flip reads as a glitch.
              decoding="sync"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pb-[30%]" style={{ backgroundColor: rarity.glowColor }}>
              <Icon name={item.fallbackIcon} size={single ? 64 : 32} color={rarity.color} />
            </div>
          )}
          <span
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 38%, ${rarity.glowColor} 68%, rgba(4,6,10,0.97) 100%)`,
            }}
          />
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: rarity.color }} />
          {tier >= 2 ? (
            <span className="absolute inset-[4px] rounded-[7px] border opacity-40" style={{ borderColor: rarity.color }} />
          ) : null}
          {tier >= 3 && !reduceMotion ? <HoloFoil delay={flipAt + 0.3} every={4.8} /> : null}
          {fx ? (
            // The face catches the light as it turns.
            <motion.span
              className="absolute inset-0 z-[8] bg-white"
              initial={{ opacity: 0.75 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ) : null}

          {isBest && (
            // On the phone grid the badge is a star chip; the word comes back where there is room.
            <motion.span
              className={cn(
                'absolute left-1.5 top-2 z-10 flex items-center gap-1 font-bold tracking-[0.12em] text-[#08090b]',
                single ? 'left-2 px-1.5 py-0.5 text-[10px]' : 'p-1 text-[10px] min-[640px]:px-1.5 min-[640px]:py-0.5'
              )}
              style={{ backgroundColor: rarity.color }}
              variants={pop}
              custom={0}
              initial={reduceMotion ? false : 'hidden'}
              animate={revealed ? 'shown' : 'hidden'}
            >
              <Icon name="star" size={single ? 10 : 11} />
              <span className={single ? undefined : 'hidden min-[640px]:inline'}>DESTACADO</span>
            </motion.span>
          )}

          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-[7] flex flex-col items-center text-center',
              single ? 'gap-1.5 p-4' : 'gap-0.5 px-1 pb-1.5 min-[640px]:gap-1 min-[640px]:p-2'
            )}
          >
            <span className="flex gap-px">
              {Array.from({ length: rarity.stars }).map((_, i) => (
                <motion.span
                  key={i}
                  className="flex"
                  variants={pop}
                  custom={i + 1}
                  initial={reduceMotion ? false : 'hidden'}
                  animate={revealed ? 'shown' : 'hidden'}
                >
                  <Icon name="star" size={single ? 14 : 9} color={rarity.color} />
                </motion.span>
              ))}
            </span>
            <span
              className={cn(
                'line-clamp-2 font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.95)]',
                single ? 'text-xl leading-6' : 'text-[11px] leading-[13px] min-[640px]:text-[13px] min-[640px]:leading-4'
              )}
            >
              {item.name}
            </span>
            {/* Too small to read on the four-column phone grid, so it only shows from 640px up. */}
            <span
              className={cn(
                'uppercase tracking-wider text-white/85',
                single ? 'mt-1 rounded-full border border-white/25 px-2 py-px text-[11px]' : 'hidden text-[10px] min-[640px]:inline'
              )}
            >
              {typeLabel}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {fx && tier >= 2 ? (
        <>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[12px] border-2"
            style={{ borderColor: rarity.color, boxShadow: `0 0 16px ${rarity.color}` }}
            initial={{ scale: 1, opacity: 0.95 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: rarity.color }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: tier >= 3 ? 2 : 1.5, opacity: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.05 }}
          />
        </>
      ) : null}
      {tier >= 3 ? (
        <ParticleBurst
          burstKey={fx ? index + 1 : null}
          colors={[rarity.color, '#fff4d6', '#ffffff']}
          count={single ? 26 : 14}
          distance={single ? [90, 190] : [45, 105]}
          size={[2, 5]}
          shape="spark"
        />
      ) : null}
    </motion.div>
  );
}
