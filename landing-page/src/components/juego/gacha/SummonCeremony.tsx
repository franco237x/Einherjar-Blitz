'use client';

/**
 * Full-screen summon ceremony.
 *
 * Firestore has already committed the pull before this component is shown.
 * This component only presents the result and never mutates economy state.
 *
 * Phases: converge (rarity-specific build-up) → flash (burst) → reveal (cards).
 * The pacing itself communicates the pull's value (1.45s common → 3.2s mythic).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { RARITIES, REWARD_TYPE_LABELS, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { Icon } from '../Icon';
import { cn } from '@/lib/utils';

interface SummonAnimationProps {
  visible: boolean;
  results: RewardItem[];
  onClose: () => void;
}

type Phase = 'converge' | 'flash' | 'reveal';

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
const CHARGE_SEGMENTS = 7;

export const CONVERGE_DURATION: Record<RarityKey, number> = {
  mythic: 3200,
  legendary: 2800,
  epic: 2350,
  rare: 1850,
  common: 1450,
};

const BURST_COUNT: Record<RarityKey, number> = {
  mythic: 54,
  legendary: 42,
  epic: 30,
  rare: 20,
  common: 12,
};

const CENTER_ICON: Record<RarityKey, string> = {
  mythic: 'flash',
  legendary: 'sunny',
  epic: 'sparkles',
  rare: 'water',
  common: 'diamond',
};

function getBestRarity(items: RewardItem[]): RarityKey {
  return RARITY_ORDER.find((rarity) => items.some((item) => item.rarity === rarity)) ?? 'common';
}

/** Deterministic pseudo-random in [0, 1) so particles don't reshuffle on re-render. */
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Mounted only while visible, so every summon starts from the converge phase. */
export function SummonAnimation(props: SummonAnimationProps) {
  if (!props.visible || typeof document === 'undefined') return null;
  return <SummonCeremony {...props} />;
}

function SummonCeremony({ results, onClose }: SummonAnimationProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>('converge');
  const phaseRef = useRef<Phase>('converge');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bestRarity = getBestRarity(results);
  const bestConfig = RARITIES[bestRarity];
  const bestResultCount = results.filter((item) => item.rarity === bestRarity).length;
  const convergeDuration = reduceMotion ? 220 : CONVERGE_DURATION[bestRarity];
  const flashColor = bestRarity === 'common' ? '#e5e7eb' : bestConfig.color;

  const clearScheduledWork = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const goToFlash = useCallback(() => {
    clearScheduledWork();
    if (phaseRef.current !== 'converge') return;
    phaseRef.current = 'flash';
    setPhase('flash');
    timeoutRef.current = setTimeout(
      () => {
        phaseRef.current = 'reveal';
        setPhase('reveal');
      },
      reduceMotion ? 120 : 510
    );
  }, [clearScheduledWork, reduceMotion]);

  useEffect(() => {
    timeoutRef.current = setTimeout(goToFlash, convergeDuration);
    return clearScheduledWork;
  }, [clearScheduledWork, convergeDuration, goToFlash]);

  // Escape skips the animation, then closes the results.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (phaseRef.current === 'reveal') onClose();
      else goToFlash();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [goToFlash, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] overflow-hidden bg-[linear-gradient(180deg,#020409_0%,#07101b_48%,#020204_100%)] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Invocación"
    >
      <ChamberBackdrop color={bestConfig.color} />

      {phase === 'converge' && (
        <div className="absolute inset-0">
          {reduceMotion ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border-2"
                style={{ borderColor: bestConfig.color, backgroundColor: bestConfig.glowColor }}
              >
                <Icon name="diamond" size={38} color={bestConfig.color} />
              </div>
            </div>
          ) : (
            <ConvergeScene rarity={bestRarity} duration={convergeDuration} />
          )}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 rotate-45 items-center justify-center border"
                style={{ borderColor: bestConfig.color }}
              >
                <Icon name="diamond-outline" size={15} color={bestConfig.color} className="-rotate-45" />
              </span>
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] text-white/50">CÁMARA EINHERJAR</p>
                <p className="text-xs font-bold tracking-[0.18em] text-white/90">SECUENCIA DE INVOCACIÓN</p>
              </div>
            </div>
            <button
              type="button"
              onClick={goToFlash}
              className="flex min-h-10 items-center gap-2 border border-white/20 bg-black/40 px-4 text-xs font-bold tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
              aria-label="Saltar animación de invocación"
            >
              SALTAR
              <Icon name="play-forward" size={14} />
            </button>
          </div>

          {!reduceMotion && <RitualRings color={bestConfig.color} duration={convergeDuration} />}

          <div className="absolute bottom-6 left-1/2 w-[82%] max-w-[520px] -translate-x-1/2 border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: bestConfig.color }} />
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/80">SINCRONIZANDO NÚCLEO</span>
              </div>
              <span className="font-mono text-[10px] text-white/40">EIN // {results.length === 1 ? '01' : '10'}</span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: CHARGE_SEGMENTS }).map((_, index) => (
                <motion.span
                  key={index}
                  className="h-1.5 flex-1 origin-left"
                  style={{ backgroundColor: bestConfig.color }}
                  initial={{ opacity: 0.16, scaleX: 0.35 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{
                    delay: (index / CHARGE_SEGMENTS) * (convergeDuration / 1000),
                    duration: (convergeDuration / 1000) * 0.14,
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/50">
              La frecuencia de la recompensa se está estabilizando
            </p>
          </div>
        </div>
      )}

      {phase === 'flash' && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2">
            {Array.from({ length: reduceMotion ? 0 : BURST_COUNT[bestRarity] }).map((_, index) => {
              const angle = rand(index + 1) * Math.PI * 2;
              const distance = 120 + rand(index + 50) * 320;
              const size = 2 + rand(index + 99) * 4;
              return (
                <motion.span
                  key={index}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: flashColor,
                    boxShadow: `0 0 8px ${flashColor}`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0 }}
                  transition={{ duration: 0.76, ease: [0.33, 1, 0.68, 1] }}
                />
              );
            })}
          </div>
          <div className="absolute left-1/2 top-1/2">
            <motion.span
              className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-2"
              style={{ borderColor: flashColor }}
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 8, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.76, ease: 'easeOut' }}
            />
          </div>
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: flashColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: reduceMotion ? 0.17 : 0.58,
              times: [0, 0.22, 0.43, 1],
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {phase === 'reveal' && (
        <motion.div
          className="absolute inset-0 flex flex-col"
          initial={{ opacity: 0, scale: 0.975 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.42, ease: 'easeOut' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${bestConfig.glowColor} 0%, rgba(6,10,17,0.92) 34%, rgba(2,3,6,0.99) 100%)`,
            }}
          />
          {!reduceMotion && bestRarity !== 'common' && <StarRays color={bestConfig.color} />}

          <div className="relative mx-auto w-full max-w-[1040px] px-3 pt-5 sm:px-6 sm:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em]" style={{ color: bestConfig.color }}>
                  TRANSMISIÓN COMPLETA
                </p>
                <h2 className="mt-1 font-title text-2xl text-white/95 sm:text-3xl">Recompensas obtenidas</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition hover:text-white"
                aria-label="Cerrar resultados"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="flex items-center gap-1.5 border px-3 py-1 text-[11px] font-bold tracking-[0.15em]"
                style={{ borderColor: bestConfig.color, backgroundColor: bestConfig.glowColor, color: bestConfig.color }}
              >
                <Icon name="star" size={13} />
                {bestConfig.label}
              </span>
              <span className="flex items-center gap-1.5 border border-gold/30 bg-black/40 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-white/80">
                <Icon name="layers-outline" size={14} color="#c9aa71" />
                {results.length} {results.length === 1 ? 'RECOMPENSA' : 'RECOMPENSAS'}
              </span>
              {bestResultCount > 1 && (
                <span className="text-xs text-white/60">×{bestResultCount} de máxima rareza</span>
              )}
            </div>
          </div>

          <div className="juego-scroll relative flex-1 overflow-y-auto" aria-label="Resultados de la invocación">
            <div
              className={cn(
                'mx-auto grid w-full max-w-[1040px] gap-2 px-3 py-4 sm:gap-3 sm:px-6',
                results.length <= 1
                  ? 'max-w-[310px] grid-cols-1'
                  : 'grid-cols-2 min-[620px]:grid-cols-4 min-[900px]:grid-cols-5'
              )}
            >
              {results.map((item, index) => (
                <FlipCard
                  key={`${item.name}-${index}`}
                  item={item}
                  index={index}
                  isBest={item.rarity === bestRarity}
                  delayMs={120 + index * 65}
                  single={results.length <= 1}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[1040px] px-3 pb-6 pt-2 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 text-sm font-bold tracking-[0.25em] text-[#08090b] transition hover:brightness-110"
              style={{ background: `linear-gradient(90deg, ${bestConfig.color}, #c9aa71)` }}
              aria-label="Continuar después de la invocación"
              autoFocus
            >
              CONTINUAR
              <Icon name="chevron-forward" size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </div>,
    document.body
  );
}

// ─── Backdrop ─────────────────────────────────────────────────────────

function ChamberBackdrop({ color }: { color: string }) {
  const corner = 'absolute h-8 w-8 opacity-50';
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span className="absolute bottom-[12%] left-6 top-[12%] border-l opacity-20" style={{ borderColor: color }} />
      <span className="absolute bottom-[12%] right-6 top-[12%] border-r opacity-20" style={{ borderColor: color }} />
      <span className={cn(corner, 'left-3 top-3 border-l-2 border-t-2')} style={{ borderColor: color }} />
      <span className={cn(corner, 'right-3 top-3 border-r-2 border-t-2')} style={{ borderColor: color }} />
      <span className={cn(corner, 'bottom-3 left-3 border-b-2 border-l-2')} style={{ borderColor: color }} />
      <span className={cn(corner, 'bottom-3 right-3 border-b-2 border-r-2')} style={{ borderColor: color }} />
      <span className="absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(201,170,113,0.08),transparent)]" />
    </div>
  );
}

function RitualRings({ color, duration }: { color: string; duration: number }) {
  const seconds = duration / 1000;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="relative h-[min(72vw,46vh,390px)] w-[min(72vw,46vh,390px)]">
        <motion.div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: color }}
          initial={{ opacity: 0, rotate: 0, scale: 0.72 }}
          animate={{ opacity: [0, 0.65, 1], rotate: 150, scale: [0.72, 1, 1.04] }}
          transition={{ duration: seconds, times: [0, 0.18, 1], ease: [0.25, 0.1, 0.2, 1] }}
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
          animate={{ opacity: [0, 0.8, 1], rotate: -220, scale: [0.6, 0.96, 1] }}
          transition={{ duration: seconds, times: [0, 0.25, 1], ease: [0.25, 0.1, 0.2, 1] }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 rotate-45 border opacity-40"
          style={{ borderColor: color }}
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

// ─── Rarity-specific convergence ─────────────────────────────────────

function ConvergeScene({ rarity, duration }: { rarity: RarityKey; duration: number }) {
  const cfg = RARITIES[rarity];
  const seconds = duration / 1000;

  const particleCount = { mythic: 28, legendary: 24, epic: 32, rare: 18, common: 10 }[rarity];
  const ascending = rarity === 'legendary';

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2 + rand(i + 7) * 0.5;
        const start = ascending ? 20 : 180 + rand(i + 3) * 80;
        const end = ascending ? 200 + rand(i + 11) * 60 : 12;
        return {
          angle,
          start,
          end,
          size: 4 + (i % 3) * 2,
          delay: rand(i + 21) * seconds * 0.35,
        };
      }),
    [ascending, particleCount, seconds]
  );

  const shake: CSSProperties | undefined = rarity === 'mythic' ? { animation: 'juego-shake 160ms linear infinite' } : undefined;

  return (
    <div className="pointer-events-none absolute inset-0" style={shake} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent 45%, ${
            { mythic: 'rgba(120,0,0,0.5)', legendary: 'rgba(80,60,20,0.4)', epic: 'rgba(60,0,100,0.4)', rare: 'rgba(0,40,100,0.35)', common: 'rgba(40,40,40,0.3)' }[rarity]
          } 100%)`,
        }}
      />

      {rarity === 'legendary' && (
        <motion.div
          className="absolute bottom-0 left-1/2 h-full w-[120px] -translate-x-1/2 origin-bottom"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${cfg.glowColor} 20%, ${cfg.color} 50%, ${cfg.glowColor} 80%, transparent 100%)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0.5, 0.8, 1], scaleY: 1 }}
          transition={{ duration: seconds, times: [0, 0.3, 0.9, 1] }}
        />
      )}

      {rarity === 'legendary' &&
        Array.from({ length: 8 }).map((_, i) => (
          <motion.span
            key={`meteor-${i}`}
            className="absolute h-[2px] w-24 origin-right"
            style={{
              left: `${10 + rand(i + 31) * 80}%`,
              top: `${rand(i + 41) * 30}%`,
              rotate: '-35deg',
              background: `linear-gradient(90deg, transparent, ${cfg.color})`,
            }}
            initial={{ opacity: 0, x: -80, y: -80 }}
            animate={{ opacity: [0, 1, 0], x: 160, y: 160 }}
            transition={{ duration: 0.9, delay: rand(i + 51) * seconds * 0.8, repeat: Infinity, repeatDelay: rand(i + 61) * 0.8 }}
          />
        ))}

      {rarity === 'mythic' && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 5 }).map((_, i) => {
            const x = 10 + rand(i + 71) * 80;
            let points = `${x},0`;
            let cx = x;
            for (let step = 1; step <= 6; step += 1) {
              cx += (rand(i * 10 + step) - 0.5) * 14;
              points += ` ${cx},${(step / 6) * 50}`;
            }
            return (
              <motion.polyline
                key={i}
                points={points}
                fill="none"
                stroke={cfg.color}
                strokeWidth={0.4}
                style={{ filter: `drop-shadow(0 0 1px ${cfg.color})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 0.8, 0] }}
                transition={{ duration: 0.5, delay: i * 0.15 * seconds, repeat: Infinity, repeatDelay: 0.4 + rand(i + 81) }}
              />
            );
          })}
        </svg>
      )}

      {rarity === 'rare' &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={`ripple-${i}`} className="absolute left-1/2 top-1/2">
            <motion.span
              className="absolute -left-[140px] -top-[140px] h-[280px] w-[280px] rounded-full border"
              style={{ borderColor: cfg.color }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.4, delay: i * 0.35, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
        ))}

      <div className="absolute left-1/2 top-1/2">
        <motion.div
          className="absolute left-0 top-0"
          animate={rarity === 'epic' ? { rotate: 360 } : undefined}
          transition={rarity === 'epic' ? { duration: 4, repeat: Infinity, ease: 'linear' } : undefined}
        >
          {particles.map((p, i) => {
            const spiral = rarity === 'epic' ? 0.9 : 0;
            return (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  backgroundColor: cfg.color,
                  boxShadow: `0 0 8px ${cfg.color}`,
                }}
                initial={{
                  x: Math.cos(p.angle) * p.start,
                  y: Math.sin(p.angle) * p.start,
                  opacity: 0,
                }}
                animate={{
                  x: Math.cos(p.angle + spiral) * p.end,
                  y: Math.sin(p.angle + spiral) * p.end,
                  opacity: [0, 1, 0.9, 0],
                }}
                transition={{ duration: seconds - p.delay, delay: p.delay, ease: [0.25, 0.1, 0.2, 1] }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Central orb */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <motion.span
          className="absolute h-[220px] w-[220px] rounded-full"
          style={{ backgroundColor: cfg.glowColor, filter: 'blur(20px)' }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1, 1.8], opacity: [0, 0.3, 0.5, 0.2] }}
          transition={{ duration: seconds, ease: 'easeOut' }}
        />
        <motion.span
          className="absolute h-[75px] w-[75px] rounded-full"
          style={{ backgroundColor: cfg.color, boxShadow: `0 0 40px ${cfg.color}` }}
          initial={{ scale: 0.1, opacity: 0.3 }}
          animate={{ scale: [0.1, 0.6, 1, 1.3], opacity: [0.3, 0.6, 0.9, 1] }}
          transition={{ duration: seconds, times: [0, 0.5, 0.9, 1] }}
        />
        <motion.span
          className="absolute h-[30px] w-[30px] rounded-full bg-white/90"
          initial={{ scale: 0.1 }}
          animate={{ scale: [0.1, 0.6, 1, 1.3] }}
          transition={{ duration: seconds, times: [0, 0.5, 0.9, 1] }}
        />
        <motion.span
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 1] }}
          transition={{ duration: seconds }}
        >
          <Icon name={CENTER_ICON[rarity]} size={30} color="#fff" />
        </motion.span>
      </div>
    </div>
  );
}

function StarRays({ color, rayCount = 16 }: { color: string; rayCount?: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center" aria-hidden="true">
      <motion.div
        className="relative h-0 w-0"
        initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
        animate={{ opacity: 0.35, scale: 1, rotate: 25 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      >
        {Array.from({ length: rayCount }).map((_, i) => (
          <span
            key={i}
            className="absolute left-0 top-0 h-[70vh] w-[3px] origin-top"
            style={{
              transform: `rotate(${(360 / rayCount) * i}deg)`,
              background: `linear-gradient(180deg, ${color}, transparent 70%)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Reveal card ─────────────────────────────────────────────────────

function FlipCard({
  item,
  index,
  isBest,
  delayMs,
  single,
  reduceMotion,
}: {
  item: RewardItem;
  index: number;
  isBest: boolean;
  delayMs: number;
  single: boolean;
  reduceMotion: boolean;
}) {
  const rarity = RARITIES[item.rarity];
  const [imageError, setImageError] = useState(false);
  const typeLabel = REWARD_TYPE_LABELS[item.type] ?? 'Recurso';
  const transition = reduceMotion
    ? { duration: 0.08 }
    : { delay: delayMs / 1000, type: 'spring' as const, damping: 14, stiffness: 120, mass: 0.6 };

  return (
    <div
      className={cn('relative [perspective:1000px]', single ? 'aspect-[3/4]' : 'h-[clamp(188px,36vw,260px)]')}
      aria-label={`Recompensa ${index + 1}: ${item.name}, ${rarity.label}`}
      role="img"
    >
      {/* Back face */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 border bg-[#05070c] [backface-visibility:hidden]"
        style={{ borderColor: rarity.color, boxShadow: `0 0 18px ${rarity.glowColor}` }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={transition}
      >
        <span className="flex h-14 w-14 rotate-45 items-center justify-center border" style={{ borderColor: rarity.color }}>
          <Icon name="diamond" size={28} color={rarity.color} className="-rotate-45" />
        </span>
        <span className="mt-2 flex gap-0.5">
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Icon key={i} name="star" size={8} color={rarity.color} />
          ))}
        </span>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: rarity.color }}>
          EIN // {String(index + 1).padStart(2, '0')}
        </span>
      </motion.div>

      {/* Front face */}
      <motion.div
        className="absolute inset-0 flex flex-col overflow-hidden bg-[#070a10] [backface-visibility:hidden]"
        style={{
          border: `${isBest ? 2 : 1}px solid ${rarity.color}`,
          boxShadow: `0 0 22px ${rarity.glowColor}`,
        }}
        initial={{ rotateY: -180 }}
        animate={{ rotateY: 0 }}
        transition={transition}
      >
        <span className="h-[3px] w-full shrink-0" style={{ backgroundColor: rarity.color }} />
        {isBest && (
          <span
            className="absolute left-2 top-2 z-10 flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.15em] text-[#08090b]"
            style={{ backgroundColor: rarity.color }}
          >
            <Icon name="star" size={8} />
            DESTACADO
          </span>
        )}
        <div className="relative min-h-0 flex-[0_0_60%]">
          {item.image && !imageError ? (
            <img src={item.image} alt="" className="h-full w-full object-cover" onError={() => setImageError(true)} />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: rarity.glowColor }}>
              <Icon name={item.fallbackIcon} size={40} color={rarity.color} />
            </div>
          )}
          <span
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 48%, ${rarity.glowColor} 78%, rgba(4,6,10,0.96) 100%)` }}
          />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="flex gap-0.5">
            {Array.from({ length: rarity.stars }).map((_, i) => (
              <Icon key={i} name="star" size={10} color={rarity.color} />
            ))}
          </span>
          <span className="line-clamp-2 text-[13px] font-bold leading-4" style={{ color: rarity.color }}>
            {item.name}
          </span>
          <span
            className="rounded-full border px-2 py-px text-[10px] uppercase tracking-wider"
            style={{ borderColor: rarity.color, color: rarity.color }}
          >
            {typeLabel}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
