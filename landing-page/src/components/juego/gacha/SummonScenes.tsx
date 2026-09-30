'use client';

/**
 * Visual layers of the summon ceremony: the chamber frame, the rarity-specific
 * build-up (converge) and the burst (flash). All of it is decorative: the
 * ceremony component owns the phases, timing and controls.
 *
 * Build-up per rarity, on top of a shared sigil, ring set and charging core:
 * - common: a few motes drift in.
 * - rare: water ripples and speed lines.
 * - epic: a spiral galaxy that winds tighter and faster into the core.
 * - legendary: a pillar of light falls onto the core, god rays, meteors.
 * - mythic: crimson storm, lightning and cracks, a tremor that keeps growing.
 */

import { useMemo } from 'react';
import { motion, type Transition } from 'framer-motion';
import { RARITIES, type RarityKey } from '@/constants/gachaData';
import { cn } from '@/lib/utils';
import { EASE_OUT_EXPO, seeded } from '../motion';
import { Icon } from '../Icon';
import { Motes } from './fx';

export const RARITY_TIER: Record<RarityKey, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };

const CENTER_ICON: Record<RarityKey, string> = {
  mythic: 'flash',
  legendary: 'sunny',
  epic: 'sparkles',
  rare: 'water',
  common: 'diamond',
};

const BURST_COUNT: Record<RarityKey, number> = {
  mythic: 54,
  legendary: 42,
  epic: 30,
  rare: 20,
  common: 12,
};

const VIGNETTE: Record<RarityKey, string> = {
  mythic: 'rgba(120,0,0,0.62)',
  legendary: 'rgba(90,66,18,0.5)',
  epic: 'rgba(66,0,112,0.5)',
  rare: 'rgba(0,40,110,0.42)',
  common: 'rgba(40,40,40,0.34)',
};

/** Accent used by the scenes; common gets a cool white instead of translucent grey. */
export function sceneColor(rarity: RarityKey): string {
  return rarity === 'common' ? '#dfe4ec' : RARITIES[rarity].color;
}

/** Energy is pulled in slowly, then rushes into the core. */
const EASE_CHARGE = [0.5, 0, 0.85, 0.4] as const;

// ─── Chamber frame ────────────────────────────────────────────────────

export function ChamberBackdrop({ color }: { color: string }) {
  const corner = 'absolute h-8 w-8';
  const corners = [
    { className: 'left-3 top-3 border-l-2 border-t-2', x: -14, y: -14 },
    { className: 'right-3 top-3 border-r-2 border-t-2', x: 14, y: -14 },
    { className: 'bottom-3 left-3 border-b-2 border-l-2', x: -14, y: 14 },
    { className: 'bottom-3 right-3 border-b-2 border-r-2', x: 14, y: 14 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <motion.span
        className="absolute bottom-[12%] left-6 top-[12%] origin-center border-l"
        style={{ borderColor: color }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.2 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      />
      <motion.span
        className="absolute bottom-[12%] right-6 top-[12%] origin-center border-r"
        style={{ borderColor: color }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.2 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      />
      {corners.map((c, i) => (
        <motion.span
          key={i}
          className={cn(corner, c.className)}
          style={{ borderColor: color }}
          initial={{ opacity: 0, x: c.x, y: c.y }}
          animate={{ opacity: 0.5, x: 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 * i, ease: EASE_OUT_EXPO }}
        />
      ))}
      <span className="absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(201,170,113,0.1),transparent)]" />
    </div>
  );
}

// ─── Upright ring set ────────────────────────────────────────────────

export function RitualRings({ color, duration }: { color: string; duration: number }) {
  const seconds = duration / 1000;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="relative h-[min(72vw,46vh,390px)] w-[min(72vw,46vh,390px)]">
        <motion.div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: color }}
          initial={{ opacity: 0, rotate: 0, scale: 0.72 }}
          animate={{ opacity: [0, 0.65, 1, 1], rotate: 200, scale: [0.72, 1, 1.04, 0.62] }}
          transition={{ duration: seconds, times: [0, 0.18, 0.86, 1], ease: EASE_CHARGE }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className="absolute inset-0" style={{ transform: `rotate(${index * 45}deg)` }}>
              <span className="absolute left-1/2 top-1 h-2.5 w-0.5 -translate-x-1/2" style={{ backgroundColor: color }} />
            </span>
          ))}
        </motion.div>
        <motion.div
          className="absolute inset-[14%] rounded-full border border-dashed"
          style={{ borderColor: color }}
          initial={{ opacity: 0, rotate: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.8, 1, 1], rotate: -300, scale: [0.6, 0.96, 1, 0.5] }}
          transition={{ duration: seconds, times: [0, 0.25, 0.86, 1], ease: EASE_CHARGE }}
        />
        <motion.span
          className="absolute left-1/2 top-1/2 h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 border"
          style={{ borderColor: color }}
          initial={{ opacity: 0, rotate: 45, scale: 0.4 }}
          animate={{ opacity: [0, 0.45, 0.7], rotate: 45 + 180, scale: [0.4, 1, 0.7] }}
          transition={{ duration: seconds, times: [0, 0.4, 1], ease: EASE_CHARGE }}
        />
        <motion.span
          className="absolute left-[11%] h-px w-[78%]"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
          initial={{ opacity: 0, top: '16%' }}
          animate={{ opacity: [0, 0.55, 0.8, 0], top: ['16%', '84%'] }}
          transition={{ duration: seconds, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// ─── Build-up ────────────────────────────────────────────────────────

/** Tremor that grows through the last part of the build-up (mythic, legendary). */
function tremorKeyframes(amplitude: number, seed: number) {
  const steps = 28;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const strength = t < 0.5 ? 0 : ((t - 0.5) / 0.5) ** 1.6 * amplitude;
    xs.push(i === steps ? 0 : (seeded(seed + i) - 0.5) * 2 * strength);
    ys.push(i === steps ? 0 : (seeded(seed + i + 50) - 0.5) * 2 * strength);
  }
  return { x: xs, y: ys };
}

export function ConvergeScene({ rarity, duration }: { rarity: RarityKey; duration: number }) {
  const color = sceneColor(rarity);
  const seconds = duration / 1000;
  const tremor = useMemo(
    () => (rarity === 'mythic' ? tremorKeyframes(7, 3) : rarity === 'legendary' ? tremorKeyframes(2.5, 9) : null),
    [rarity]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at center, transparent 32%, ${VIGNETTE[rarity]} 100%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.75, 1] }}
        transition={{ duration: seconds, times: [0, 0.4, 1] }}
      />

      {rarity === 'legendary' && <LightPillar color={color} seconds={seconds} />}
      {rarity === 'mythic' && <MythicStorm color={color} seconds={seconds} />}
      {rarity === 'rare' && <Ripples color={color} />}

      <motion.div
        className="absolute inset-0"
        animate={tremor ?? undefined}
        transition={tremor ? { duration: seconds, ease: 'linear' } : undefined}
      >
        <SigilFloor color={color} seconds={seconds} />
        {rarity === 'epic' && <SpiralArms color={color} seconds={seconds} />}
        {rarity !== 'common' && <SpeedLines color={color} seconds={seconds} rarity={rarity} />}
        <ConvergingParticles rarity={rarity} color={color} seconds={seconds} />
        <Core rarity={rarity} color={color} seconds={seconds} />
      </motion.div>
    </div>
  );
}

/** Magic circle lying on the floor under the core, drawn in and spun up. */
function SigilFloor({ color, seconds }: { color: string; seconds: number }) {
  const draw = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: Math.min(0.9, seconds * 0.4), delay, ease: EASE_OUT_EXPO },
  });
  const hexagram = (offset: number) =>
    Array.from({ length: 3 }, (_, i) => {
      const a = ((i * 120 + offset - 90) * Math.PI) / 180;
      return `${(Math.cos(a) * 66).toFixed(2)},${(Math.sin(a) * 66).toFixed(2)}`;
    }).join(' ');

  return (
    <div
      className="absolute left-1/2 top-[57%] h-[min(94vw,440px)] w-[min(94vw,440px)] -translate-x-1/2 -translate-y-1/2"
      style={{ transform: 'perspective(700px) rotateX(66deg)' }}
    >
      <motion.svg
        viewBox="-100 -100 200 200"
        className="h-full w-full overflow-visible"
        initial={{ rotate: 0, scale: 0.85, opacity: 0 }}
        animate={{ rotate: 260, scale: [0.85, 1, 1, 0.55], opacity: [0, 1, 1, 0.4] }}
        transition={{ duration: seconds, times: [0, 0.2, 0.86, 1], ease: EASE_CHARGE }}
        fill="none"
        stroke={color}
      >
        <circle r="96" strokeWidth="5" strokeOpacity="0.1" />
        <motion.circle r="96" strokeWidth="0.9" {...draw(0)} />
        <circle r="89" strokeWidth="2.4" strokeOpacity="0.55" strokeDasharray="0.6 3.4" />
        <motion.circle r="70" strokeWidth="0.7" {...draw(0.12)} />
        <motion.polygon points={hexagram(0)} strokeWidth="0.8" {...draw(0.24)} />
        <motion.polygon points={hexagram(60)} strokeWidth="0.8" {...draw(0.32)} />
        <motion.circle r="34" strokeWidth="1.2" {...draw(0.4)} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <circle
              key={i}
              cx={(Math.cos(a) * 80).toFixed(2)}
              cy={(Math.sin(a) * 80).toFixed(2)}
              r="3.2"
              strokeWidth="0.8"
              fill={color}
              fillOpacity="0.25"
            />
          );
        })}
      </motion.svg>
    </div>
  );
}

/** Particles drawn toward the core (or rising along the pillar for legendary). */
function ConvergingParticles({ rarity, color, seconds }: { rarity: RarityKey; color: string; seconds: number }) {
  const count = { mythic: 26, legendary: 22, epic: 30, rare: 18, common: 12 }[rarity];
  const ascending = rarity === 'legendary';
  const spiral = rarity === 'epic' ? 1.4 : 0;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + seeded(i + 7) * 0.5;
        return {
          angle,
          start: ascending ? 20 : 170 + seeded(i + 3) * 90,
          end: ascending ? 200 + seeded(i + 11) * 60 : 10,
          size: 3 + (i % 3) * 2,
          delay: seeded(i + 21) * seconds * 0.4,
        };
      }),
    [ascending, count, seconds]
  );

  return (
    <div className="absolute left-1/2 top-1/2">
      <motion.div
        className="absolute left-0 top-0"
        animate={spiral ? { rotate: 420 } : undefined}
        transition={spiral ? { duration: seconds, ease: EASE_CHARGE } : undefined}
      >
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{ x: Math.cos(p.angle) * p.start, y: Math.sin(p.angle) * p.start, opacity: 0 }}
            animate={{
              x: Math.cos(p.angle + spiral) * p.end,
              y: Math.sin(p.angle + spiral) * p.end,
              opacity: [0, 1, 0.9, 0],
            }}
            transition={{ duration: seconds - p.delay, delay: p.delay, ease: [0.25, 0.1, 0.2, 1] }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/** Light streaks rushing into the core from every direction. */
function SpeedLines({ color, seconds, rarity }: { color: string; seconds: number; rarity: RarityKey }) {
  const count = { mythic: 16, legendary: 14, epic: 12, rare: 10, common: 0 }[rarity];
  return (
    <div className="absolute left-1/2 top-1/2">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360 + seeded(i + 90) * 20;
        const travel = 180 + seeded(i + 91) * 120;
        return (
          <span key={i} className="absolute left-0 top-0" style={{ transform: `rotate(${angle}deg)` }}>
            <motion.span
              className="absolute left-0 top-0 block h-[1.5px] w-16 -translate-y-1/2"
              style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
              initial={{ x: travel, opacity: 0 }}
              animate={{ x: [travel, 18], opacity: [0, 0.95, 0] }}
              transition={{
                duration: 0.5 + seeded(i + 92) * 0.3,
                delay: seconds * 0.18 + seeded(i + 93) * 0.6,
                repeat: Infinity,
                repeatDelay: seeded(i + 94) * 0.45,
                ease: 'easeIn',
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Charging core: halo, orb with an accelerating heartbeat, white-hot center and glint. */
function Core({ rarity, color, seconds }: { rarity: RarityKey; color: string; seconds: number }) {
  const heart = [0, 0.45, 0.58, 0.64, 0.72, 0.77, 0.84, 0.88, 0.93, 0.96, 1];
  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
      <motion.span
        className="absolute h-[260px] w-[260px] rounded-full"
        style={{ background: `radial-gradient(circle, ${color}66 0%, ${color}22 38%, transparent 68%)` }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1, 1.25, 1.9], opacity: [0, 0.6, 0.8, 1] }}
        transition={{ duration: seconds, times: [0, 0.5, 0.85, 1], ease: 'easeOut' }}
      />
      <motion.span
        className="absolute h-[74px] w-[74px] rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 40px ${color}, 0 0 90px ${color}88` }}
        initial={{ scale: 0.1, opacity: 0.3 }}
        animate={{
          scale: [0.1, 0.55, 0.7, 0.6, 0.85, 0.72, 1, 0.88, 1.18, 1.05, 1.4],
          opacity: [0.3, 0.6, 0.8, 0.7, 0.9, 0.8, 1, 0.9, 1, 1, 1],
        }}
        transition={{ duration: seconds, times: heart, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute h-[30px] w-[30px] rounded-full bg-white"
        initial={{ scale: 0.1, opacity: 0.6 }}
        animate={{ scale: [0.1, 0.6, 0.75, 0.65, 0.9, 0.8, 1.05, 0.95, 1.25, 1.1, 1.5], opacity: 1 }}
        transition={{ duration: seconds, times: heart, ease: 'easeInOut' }}
      />
      {/* Star glint: a cross of light that stretches out just before the flash. */}
      <motion.span
        className="absolute h-[2px] w-[min(90vw,520px)]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, #fff, ${color}, transparent)` }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 0.15, 1], opacity: [0, 0.6, 1] }}
        transition={{ duration: seconds, times: [0, 0.6, 1], ease: 'easeIn' }}
      />
      <motion.span
        className="absolute h-[min(60vh,420px)] w-[2px]"
        style={{ background: `linear-gradient(180deg, transparent, ${color}, #fff, ${color}, transparent)` }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 0.1, 0.8], opacity: [0, 0.5, 0.9] }}
        transition={{ duration: seconds, times: [0, 0.65, 1], ease: 'easeIn' }}
      />
      <motion.span
        className="relative flex"
        initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
        animate={{ opacity: [0, 0.8, 1], scale: 1, rotate: 0 }}
        transition={{ duration: seconds * 0.6, ease: EASE_OUT_EXPO }}
      >
        <Icon name={CENTER_ICON[rarity]} size={30} color={rarity === 'common' ? '#0b0d12' : '#fff'} />
      </motion.span>
    </div>
  );
}

// Three logarithmic spiral arms (viewBox -100..100), built once.
const SPIRAL_ARMS = [0, 120, 240].map((offset) => {
  const points: string[] = [];
  for (let i = 0; i <= 44; i += 1) {
    const theta = (i / 44) * Math.PI * 2.7;
    const radius = 9 * Math.exp(0.26 * theta);
    const a = theta + (offset * Math.PI) / 180;
    points.push(`${(Math.cos(a) * radius).toFixed(2)} ${(Math.sin(a) * radius).toFixed(2)}`);
  }
  return `M${points.join(' L')}`;
});

/** Epic: galaxy arms winding faster and tighter into the core. */
function SpiralArms({ color, seconds }: { color: string; seconds: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 h-[min(110vw,560px)] w-[min(110vw,560px)] -translate-x-1/2 -translate-y-1/2">
      <motion.svg
        viewBox="-100 -100 200 200"
        className="h-full w-full overflow-visible"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        initial={{ rotate: 0, scale: 1.3, opacity: 0 }}
        animate={{ rotate: 620, scale: [1.3, 1, 0.3], opacity: [0, 0.95, 1] }}
        transition={{ duration: seconds, times: [0, 0.55, 1], ease: EASE_CHARGE }}
      >
        {SPIRAL_ARMS.map((d, i) => (
          <g key={i}>
            <path d={d} strokeWidth="6" strokeOpacity="0.1" />
            <motion.path
              d={d}
              strokeWidth="1.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: seconds * 0.45, delay: i * 0.08, ease: EASE_OUT_EXPO }}
            />
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

/** Legendary: a column of light falling onto the core, with god rays and meteors. */
function LightPillar({ color, seconds }: { color: string; seconds: number }) {
  return (
    <>
      <motion.div
        className="absolute left-1/2 top-1/2 h-[min(150vw,900px)] w-[min(150vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${color}2e 0deg 5deg, transparent 5deg 22deg)`,
          WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
          maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
        }}
        initial={{ opacity: 0, rotate: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.4, 1], rotate: 55, scale: [0.6, 1, 1.1] }}
        transition={{ duration: seconds, times: [0, 0.4, 1], ease: 'easeIn' }}
      />
      {/* Soft halo, then the bright core of the beam. */}
      <motion.div
        className="absolute inset-y-0 left-1/2 w-[240px] -translate-x-1/2 origin-top"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}33 30%, ${color}55 50%, ${color}33 70%, transparent)`,
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1], opacity: [0, 0.8, 1], scaleX: [0.5, 0.8, 1.15] }}
        transition={{ duration: seconds, times: [0, 0.32, 1], ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-y-0 left-1/2 w-[34px] -translate-x-1/2 origin-top"
        style={{
          background: `linear-gradient(90deg, transparent, ${color} 30%, #fff8e6 50%, ${color} 70%, transparent)`,
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1], opacity: [0, 0.9, 1], scaleX: [0.2, 0.6, 1.3] }}
        transition={{ duration: seconds, times: [0, 0.28, 1], ease: 'easeInOut' }}
      />
      <Motes color="#f5dca4" count={12} seed={7} rise={760} />
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.span
          key={`meteor-${i}`}
          className="absolute h-[2px] w-24 origin-right"
          style={{
            left: `${10 + seeded(i + 31) * 80}%`,
            top: `${seeded(i + 41) * 30}%`,
            rotate: '-35deg',
            background: `linear-gradient(90deg, transparent, ${color})`,
          }}
          initial={{ opacity: 0, x: -80, y: -80 }}
          animate={{ opacity: [0, 1, 0], x: 160, y: 160 }}
          transition={{ duration: 0.9, delay: seeded(i + 51) * seconds * 0.8, repeat: Infinity, repeatDelay: seeded(i + 61) * 0.8 }}
        />
      ))}
    </>
  );
}

// Jagged cracks radiating from around the core (viewBox -100..100), built once.
const CRACKS = Array.from({ length: 8 }, (_, i) => {
  const base = (i / 8) * Math.PI * 2 + seeded(i + 200) * 0.4;
  const start = 22;
  let d = `M${(Math.cos(base) * start).toFixed(2)} ${(Math.sin(base) * start).toFixed(2)}`;
  for (let step = 1; step <= 7; step += 1) {
    const r = start + step * (9 + seeded(i + step + 500) * 5);
    const a = base + (seeded(i * 10 + step + 300) - 0.5) * 0.7;
    d += ` L${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  }
  return d;
});

// Lightning bolts from the top edge (viewBox 0..100, stretched to the screen), built once.
const BOLTS = Array.from({ length: 5 }, (_, i) => {
  const x = 10 + seeded(i + 71) * 80;
  let points = `${x},0`;
  let cx = x;
  for (let step = 1; step <= 6; step += 1) {
    cx += (seeded(i * 10 + step) - 0.5) * 14;
    points += ` ${cx.toFixed(2)},${((step / 6) * 50).toFixed(2)}`;
  }
  return points;
});

/** Mythic: crimson storm, lightning, cracks through the floor and an eclipse behind the core. */
function MythicStorm({ color, seconds }: { color: string; seconds: number }) {
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {BOLTS.map((points, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 0.8, 0] }}
            transition={{ duration: 0.5, delay: i * 0.15 * seconds, repeat: Infinity, repeatDelay: 0.4 + seeded(i + 81) }}
          >
            <polyline points={points} fill="none" stroke={color} strokeWidth={1.4} strokeOpacity={0.25} />
            <polyline points={points} fill="none" stroke="#ffd4d4" strokeWidth={0.35} />
          </motion.g>
        ))}
      </svg>
      <Motes color="#ff6b5a" count={14} seed={11} rise={680} />
      <div className="absolute left-1/2 top-1/2 h-[min(120vw,620px)] w-[min(120vw,620px)] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible" fill="none" strokeLinejoin="round">
          {CRACKS.map((d, i) => (
            <g key={i}>
              <motion.path
                d={d}
                stroke={color}
                strokeWidth="3.2"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 0, 1] }}
                transition={{ duration: seconds, times: [0, 0.45 + i * 0.04, 1], ease: 'easeOut' }}
              />
              <motion.path
                d={d}
                stroke="#ffb4a8"
                strokeWidth="0.7"
                strokeOpacity="0.9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 0, 1] }}
                transition={{ duration: seconds, times: [0, 0.45 + i * 0.04, 1], ease: 'easeOut' }}
              />
            </g>
          ))}
        </svg>
      </div>
      {/* Eclipse: a dark disc with a burning rim swelling behind the core. */}
      <motion.span
        className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#050000]"
        style={{ boxShadow: `0 0 0 2px ${color}, 0 0 40px 6px ${color}, inset 0 0 30px ${color}88` }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 0.9, 1.05], opacity: [0, 0.9, 1] }}
        transition={{ duration: seconds, times: [0, 0.6, 1], ease: 'easeOut' }}
      />
    </>
  );
}

/** Rare: water ripples spreading from the core. */
function Ripples({ color }: { color: string }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`ripple-${i}`} className="absolute left-1/2 top-1/2">
          <motion.span
            className="absolute -left-[140px] -top-[140px] h-[280px] w-[280px] rounded-full border"
            style={{ borderColor: color }}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.4, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>
      ))}
    </>
  );
}

// ─── Flash ───────────────────────────────────────────────────────────

/**
 * How hard the flash lights the chamber up. The pacing already tells the value of
 * a pull; the flash follows it, so a common pull glows and a mythic one blinds.
 */
const FLASH_PEAK: Record<RarityKey, number> = { mythic: 1, legendary: 1, epic: 0.85, rare: 0.6, common: 0.45 };

/** How far the colour reaches before falling into the rim (% of the flash radius): a bloom low, a white-out at the top. */
const FLASH_REACH: Record<RarityKey, number> = { mythic: 36, legendary: 36, epic: 30, rare: 20, common: 12 };

/** Share of the peak still lit when the reveal takes over and fades the flash out. */
const FLASH_HANDOFF = 0.72;

/** Deep tone at the rim of the flash, so it reads as light pouring out of the core, not a flat fill. */
const FLASH_RIM: Record<RarityKey, string> = {
  mythic: '#4a0707',
  legendary: '#4d3a17',
  epic: '#2e0b52',
  rare: '#0b2152',
  common: '#141b26',
};

/**
 * The flash is two full-screen layers shared by the flash and the reveal that fades
 * it out, so the handoff is seamless: the rarity colour pouring into a deep rim, and
 * a white-hot core on top that burns off faster. Both add light (screen blend) rather
 * than veiling what is under them in grey, and overscan the screen (`-inset-10`) so the
 * mythic tremor never uncovers an edge.
 */
function flashLayers(rarity: RarityKey) {
  // Common gets a cool steel tint: a light neutral at partial strength would read as grey fog.
  const color = rarity === 'common' ? '#b9c8de' : RARITIES[rarity].color;
  const reach = FLASH_REACH[rarity];
  // Low tiers fall into the rim quickly; a slow falloff all the way out washes the screen in mid-tones.
  const rim = Math.min(100, Math.round(reach * 2.6));
  return {
    fill: `radial-gradient(ellipse 85% 70% at 50% 50%, ${color} 0%, ${color} ${reach}%, ${FLASH_RIM[rarity]} ${rim}%)`,
    core: `radial-gradient(ellipse 85% 70% at 50% 50%, #ffffff 0%, rgba(255,255,255,0.55) ${reach / 2}%, rgba(255,255,255,0) ${reach}%)`,
  };
}

const FLASH_LAYER = 'pointer-events-none absolute -inset-10 mix-blend-screen';

/** The last of the flash, fading over the freshly mounted reveal. */
export function FlashHandoff({ rarity }: { rarity: RarityKey }) {
  const { fill, core } = flashLayers(rarity);
  const from = FLASH_PEAK[rarity] * FLASH_HANDOFF;
  // The rarer the pull, the longer the afterglow lingers over the cards.
  const fade = 0.35 + RARITY_TIER[rarity] * 0.05;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className={cn(FLASH_LAYER, 'z-30')}
        style={{ background: fill }}
        initial={{ opacity: from }}
        animate={{ opacity: 0 }}
        transition={{ duration: fade, ease: 'easeOut' }}
      />
      <motion.div
        aria-hidden="true"
        className={cn(FLASH_LAYER, 'z-30')}
        style={{ background: core }}
        initial={{ opacity: from }}
        animate={{ opacity: 0 }}
        transition={{ duration: fade * 0.45, ease: 'easeOut' }}
      />
    </>
  );
}

export function FlashScene({ rarity, reduceMotion }: { rarity: RarityKey; reduceMotion: boolean }) {
  const color = sceneColor(rarity);
  const tier = RARITY_TIER[rarity];
  const count = reduceMotion ? 0 : BURST_COUNT[rarity];
  const layers = flashLayers(rarity);
  const peak = FLASH_PEAK[rarity];
  // Starts hot: the core and rings vanish with the phase change, so a flash that ramps up
  // from 0 reads as a blink of darkness right at the climax.
  const burn = { opacity: [peak * 0.85, peak, peak, peak * FLASH_HANDOFF] };
  const burnTransition: Transition = { duration: 0.5, times: [0, 0.2, 0.55, 1], ease: 'easeOut' };

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {!reduceMotion && rarity === 'legendary' && (
        <motion.div
          className="absolute inset-y-0 left-1/2 w-[60px] -translate-x-1/2"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, #fff8e6, ${color}, transparent)` }}
          initial={{ scaleX: 1.2, opacity: 1 }}
          animate={{ scaleX: 16, opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        />
      )}

      {!reduceMotion && tier >= 2 && (
        <div className="absolute left-1/2 top-1/2">
          {Array.from({ length: 12 + tier * 2 }, (_, i) => (
            <span
              key={i}
              className="absolute left-0 top-0"
              style={{ transform: `rotate(${(i / (12 + tier * 2)) * 360 + seeded(i + 400) * 12}deg)` }}
            >
              <motion.span
                className="absolute left-0 top-0 block h-[3px] w-[75vmax] origin-left -translate-y-1/2"
                style={{ background: `linear-gradient(90deg, #fff, ${color} 30%, transparent 85%)` }}
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{ scaleX: 1, opacity: 0 }}
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: seeded(i + 410) * 0.06 }}
              />
            </span>
          ))}
        </div>
      )}

      <div className="absolute left-1/2 top-1/2">
        {Array.from({ length: count }).map((_, index) => {
          const angle = seeded(index + 1) * Math.PI * 2;
          const distance = 120 + seeded(index + 50) * 320;
          const size = 2 + seeded(index + 99) * 4;
          const streak = tier >= 3 && index % 2 === 0;
          return (
            <motion.span
              key={index}
              className="absolute rounded-full"
              style={{
                width: streak ? size * 5 : size,
                height: streak ? Math.max(1.5, size / 2) : size,
                rotate: streak ? `${(angle * 180) / Math.PI}deg` : undefined,
                backgroundColor: index % 3 === 0 ? '#fff' : color,
                boxShadow: `0 0 8px ${color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0 }}
              transition={{ duration: 0.76, ease: [0.33, 1, 0.68, 1] }}
            />
          );
        })}
      </div>

      <div className="absolute left-1/2 top-1/2">
        {!reduceMotion && (
          <motion.span
            className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-2"
            style={{ borderColor: color }}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.76, ease: 'easeOut' }}
          />
        )}
        {!reduceMotion && (
          <motion.span
            className="absolute -left-10 -top-10 h-20 w-20 rounded-full border"
            style={{ borderColor: '#fff' }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 5.5, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.07, ease: 'easeOut' }}
          />
        )}
        {!reduceMotion && rarity === 'mythic' && (
          // Chromatic split: a cyan ghost ring drifting off the red one.
          <motion.span
            className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-2"
            style={{ borderColor: '#5eead4' }}
            initial={{ scale: 0.2, opacity: 0.7, x: 0 }}
            animate={{ scale: 7.4, opacity: 0, x: 10 }}
            transition={{ duration: 0.7, delay: 0.03, ease: 'easeOut' }}
          />
        )}
      </div>

      {/* Still lit when the reveal mounts, which fades it out over the cards (no dark gap).
          Reduced motion gets a soft, flat tint instead of a bright flash. */}
      {reduceMotion ? (
        <motion.div
          className="absolute -inset-10"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0.4, 0] }}
          transition={{ duration: 0.17, times: [0, 0.22, 0.43, 1], ease: 'easeInOut' }}
        />
      ) : (
        <>
          <motion.div
            className={FLASH_LAYER}
            style={{ background: layers.fill }}
            initial={{ opacity: burn.opacity[0] }}
            animate={burn}
            transition={burnTransition}
          />
          <motion.div
            className={FLASH_LAYER}
            style={{ background: layers.core }}
            initial={{ opacity: burn.opacity[0] }}
            animate={burn}
            transition={burnTransition}
          />
        </>
      )}
      {!reduceMotion && tier >= 3 && (
        <motion.div
          className="absolute -inset-10 bg-white"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: [0.55, 0.85, 0] }}
          transition={{ duration: 0.34, times: [0, 0.3, 1], ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

/** Mythic flash: the whole chamber is hit and rattles back to rest. */
export const MYTHIC_SHAKE = {
  x: [0, -18, 15, -12, 9, -6, 4, -2, 0],
  y: [0, 9, -12, 8, -6, 4, -2, 1, 0],
  rotate: [0, -0.8, 0.7, -0.5, 0.35, -0.2, 0.1, 0, 0],
};

// ─── Reveal backdrop ─────────────────────────────────────────────────

/**
 * Light rays fanning out behind the results header, drawn as a single conic gradient
 * that fades out radially (one modest element instead of a screen-sized stack of rays).
 * They swing into place once and then hold still: the entrance runs on the compositor
 * (a `transform` string goes to WAAPI) and, once it ends, the masked layer drops back
 * into plain raster, so it costs nothing per frame while the results sit on screen.
 */
export function StarRays({ color, rayCount = 16 }: { color: string; rayCount?: number }) {
  const step = 360 / rayCount;
  const mask = 'radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,0.55) 45%, transparent 100%)';
  return (
    <div className="pointer-events-none absolute left-1/2 top-[18%] h-0 w-0" aria-hidden="true">
      <motion.span
        className="absolute left-1/2 top-1/2 h-[min(150vw,110vh,760px)] w-[min(150vw,110vh,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${color} 0deg, transparent ${step * 0.09}deg, transparent ${
            step * 0.91
          }deg, ${color} ${step}deg)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
        initial={{ opacity: 0, transform: 'scale(0.6) rotate(0deg)' }}
        animate={{ opacity: 0.4, transform: 'scale(1) rotate(25deg)' }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
    </div>
  );
}
