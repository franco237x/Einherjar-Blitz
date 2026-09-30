'use client';

/**
 * Full-screen summon ceremony.
 *
 * Firestore has already committed the pull before this component is shown.
 * This component only presents the result and never mutates economy state.
 *
 * Phases: converge (rarity-specific build-up) → flash (burst) → reveal (cards).
 * The pacing itself communicates the pull's value (1.45s common → 3.2s mythic).
 * In the reveal the cards are dealt from a deck and flip on landing; CONTINUAR
 * works at any moment, the deal never blocks the player.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from 'framer-motion';
import { RARITIES, type RarityKey, type RewardItem } from '@/constants/gachaData';
import { AnimatedNumber, EASE_OUT_EXPO, SPRINGS, Sheen, SplitText } from '../motion';
import { Icon } from '../Icon';
import { cn } from '@/lib/utils';
import { FOCUS_RING, Motes } from './fx';
import { DECK_ATTRIBUTE, RevealCard, dealDuration, dealTiming } from './RevealCard';
import {
  ChamberBackdrop,
  ConvergeScene,
  FlashHandoff,
  FlashScene,
  MYTHIC_SHAKE,
  RARITY_TIER,
  RitualRings,
  StarRays,
  sceneColor,
} from './SummonScenes';

interface SummonAnimationProps {
  visible: boolean;
  results: RewardItem[];
  onClose: () => void;
}

type Phase = 'converge' | 'flash' | 'reveal';

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
const CHARGE_SEGMENTS = 7;
/** The chamber opens as a circle growing from the core (72% of the reference radius covers any screen). */
const IRIS_CLOSED = 'circle(6% at 50% 50%)';
const IRIS_OPEN = 'circle(75% at 50% 50%)';
/** Fade back to the lobby; the close is reported a beat later, once the fade has surely finished. */
const CLOSE_FADE = 0.2;
const CLOSE_AFTER_MS = 300;

export const CONVERGE_DURATION: Record<RarityKey, number> = {
  mythic: 3200,
  legendary: 2800,
  epic: 2350,
  rare: 1850,
  common: 1450,
};

function getBestRarity(items: RewardItem[]): RarityKey {
  return RARITY_ORDER.find((rarity) => items.some((item) => item.rarity === rarity)) ?? 'common';
}

/** Mounted only while visible, so every summon starts from the converge phase. */
export function SummonAnimation(props: SummonAnimationProps) {
  if (!props.visible || typeof document === 'undefined') return null;
  return <SummonCeremony {...props} />;
}

function SummonCeremony({ results, onClose }: SummonAnimationProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>('converge');
  const [closing, setClosing] = useState(false);
  const phaseRef = useRef<Phase>('converge');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bestRarity = getBestRarity(results);
  const bestConfig = RARITIES[bestRarity];
  const bestResultCount = results.filter((item) => item.rarity === bestRarity).length;
  const convergeDuration = reduceMotion ? 220 : CONVERGE_DURATION[bestRarity];
  const color = sceneColor(bestRarity);

  const clearScheduledWork = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const goToFlash = useCallback(() => {
    // Check the phase first: clearing here during the flash would cancel the reveal and strand the player.
    if (phaseRef.current !== 'converge') return;
    clearScheduledWork();
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

  // CONTINUAR, the close button and Escape: the chamber fades back into the lobby, then closes.
  // The root is never clipped, so it keeps catching taps while it fades and nothing underneath can be
  // pressed by accident.
  const close = useCallback(() => {
    if (closeTimerRef.current) return;
    if (reduceMotion) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, CLOSE_AFTER_MS);
  }, [onClose, reduceMotion]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  // Escape skips the animation, then closes the results.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (phaseRef.current === 'reveal') close();
      else goToFlash();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, goToFlash]);

  // Load and decode the art during the build-up, so a card never turns over onto an empty face.
  useEffect(() => {
    for (const item of results) {
      if (!item.image) continue;
      const image = new Image();
      image.src = item.image;
      image.decode().catch(() => {});
    }
  }, [results]);

  const shake = !reduceMotion && bestRarity === 'mythic' && phase === 'flash';

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] overflow-hidden text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Invocación"
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={closing ? { duration: CLOSE_FADE, ease: 'easeOut' } : { duration: 0.18 }}
    >
      {/* The chamber opens as an iris from the core. It lives on its own layer and its target never
          changes, so closing only fades the (unclipped) root. */}
      <motion.div
        className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#020409_0%,#07101b_48%,#020204_100%)]"
        initial={reduceMotion ? false : { clipPath: IRIS_CLOSED }}
        animate={reduceMotion ? undefined : { clipPath: IRIS_OPEN, transitionEnd: { clipPath: 'none' } }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
      >
        <motion.div
          className="absolute inset-0"
          animate={shake ? MYTHIC_SHAKE : { x: 0, y: 0, rotate: 0 }}
          transition={shake ? { duration: 0.55, ease: 'easeOut' } : { duration: 0.2 }}
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

              <motion.div
                className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    className="flex h-8 w-8 rotate-45 items-center justify-center border"
                    style={{ borderColor: bestConfig.color }}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={SPRINGS.bouncy}
                  >
                    <Icon name="diamond-outline" size={15} color={bestConfig.color} className="-rotate-45" />
                  </motion.span>
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] text-white/50">CÁMARA EINHERJAR</p>
                    <p className="text-xs font-bold tracking-[0.18em] text-white/90">SECUENCIA DE INVOCACIÓN</p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={goToFlash}
                  whileTap={{ scale: 0.94 }}
                  transition={SPRINGS.snappy}
                  className={cn(
                    'group flex min-h-11 items-center gap-2 border border-white/20 bg-black/40 px-4 text-xs font-bold tracking-[0.2em] text-white/70 transition-colors hover:border-white/40 hover:text-white',
                    FOCUS_RING
                  )}
                  aria-label="Saltar animación de invocación"
                >
                  SALTAR
                  <Icon name="play-forward" size={14} className="transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              </motion.div>

              {!reduceMotion && <RitualRings color={color} duration={convergeDuration} />}

              <motion.div
                className="absolute bottom-6 left-1/2 w-[82%] max-w-[520px] -translate-x-1/2 border border-white/10 bg-black/50 p-4 backdrop-blur-sm"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse" style={{ backgroundColor: bestConfig.color }} />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-white/80">SINCRONIZANDO NÚCLEO</span>
                  </div>
                  <span className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                    <ChargePercent seconds={convergeDuration / 1000} color={bestConfig.color} />
                    <span>EIN // {results.length === 1 ? '01' : '10'}</span>
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: CHARGE_SEGMENTS }).map((_, index) => (
                    <motion.span
                      key={index}
                      className="h-1.5 flex-1 origin-left"
                      style={{ backgroundColor: bestConfig.color, boxShadow: `0 0 8px ${bestConfig.glowColor}` }}
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
              </motion.div>
            </div>
          )}

          {phase === 'flash' && <FlashScene rarity={bestRarity} reduceMotion={reduceMotion} />}

          {phase === 'reveal' && (
            <RevealScene
              results={results}
              bestRarity={bestRarity}
              bestResultCount={bestResultCount}
              reduceMotion={reduceMotion}
              onClose={close}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/** Charge readout in the HUD, counting to 100% with the build-up. */
function ChargePercent({ seconds, color }: { seconds: number; color: string }) {
  const progress = useMotionValue(0);
  const text = useTransform(progress, (value) => `${Math.round(value)}%`);
  useEffect(() => {
    const controls = animate(progress, 100, { duration: seconds, ease: [0.3, 0, 0.7, 1] });
    return () => controls.stop();
  }, [progress, seconds]);
  return (
    <motion.span className="min-w-[4ch] text-right font-bold tabular-nums" style={{ color }}>
      {text}
    </motion.span>
  );
}

// ─── Reveal ──────────────────────────────────────────────────────────

const headerChips: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
};

const chip: Variants = {
  hidden: { opacity: 0, x: -18, scale: 0.9 },
  shown: { opacity: 1, x: 0, scale: 1, transition: SPRINGS.bouncy },
};

function RevealScene({
  results,
  bestRarity,
  bestResultCount,
  reduceMotion,
  onClose,
}: {
  results: RewardItem[];
  bestRarity: RarityKey;
  bestResultCount: number;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const bestConfig = RARITIES[bestRarity];
  const tier = RARITY_TIER[bestRarity];
  const single = results.length <= 1;
  const dealEnd = dealDuration(results);
  // The chamber answers when the first card of the best rarity turns over.
  const bestFlip = dealTiming(Math.max(0, results.findIndex((item) => item.rarity === bestRarity)), bestRarity).flip;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col"
      initial={reduceMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${bestConfig.glowColor} 0%, rgba(6,10,17,0.92) 34%, rgba(2,3,6,0.99) 100%)`,
        }}
      />
      {!reduceMotion && bestRarity !== 'common' && <StarRays color={bestConfig.color} />}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
        style={{ background: `radial-gradient(ellipse 60% 70% at 50% 100%, ${bestConfig.glowColor}, transparent 70%)`, opacity: 0.45 }}
      />
      {tier >= 2 ? <Motes color={bestConfig.color} count={10} seed={21} rise={700} /> : null}
      {!reduceMotion && tier >= 2 && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 75% 55% at 50% 55%, ${bestConfig.color}, transparent 72%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, tier >= 3 ? 0.55 : 0.3, 0] }}
          transition={{ delay: bestFlip, duration: tier >= 3 ? 1.1 : 0.8, times: [0, 0.12, 1], ease: 'easeOut' }}
        />
      )}
      {/* The flash fades out over the results instead of cutting. */}
      {!reduceMotion && <FlashHandoff rarity={bestRarity} />}

      <div className="relative mx-auto w-full max-w-[1040px] px-3 pt-5 sm:px-6 sm:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <motion.p
              className="text-[10px] font-bold tracking-[0.25em]"
              style={{ color: bestConfig.color }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
            >
              TRANSMISIÓN COMPLETA
            </motion.p>
            <h2 className="mt-1 font-title text-[22px] leading-tight text-white/95 min-[400px]:text-2xl sm:text-3xl">
              <SplitText text="Recompensas obtenidas" delay={0.15} step={0.018} />
            </h2>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ ...SPRINGS.bouncy, delay: 0.3 }}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 transition-colors hover:text-white',
              FOCUS_RING
            )}
            aria-label="Cerrar resultados"
          >
            <Icon name="close" size={22} />
          </motion.button>
        </div>

        <motion.div
          className="mt-3 flex flex-wrap items-center gap-2"
          variants={headerChips}
          initial="hidden"
          animate="shown"
        >
          <motion.span
            variants={chip}
            className="relative flex items-center gap-1.5 overflow-hidden border px-3 py-1 text-[11px] font-bold tracking-[0.15em]"
            style={{ borderColor: bestConfig.color, backgroundColor: bestConfig.glowColor, color: '#fff' }}
          >
            {tier >= 3 ? <Sheen every={2.8} duration={0.9} delay={0.9} color="rgba(255,255,255,0.35)" /> : null}
            <motion.span
              className="flex"
              initial={{ rotate: -120, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ ...SPRINGS.bouncy, delay: 0.55 }}
            >
              <Icon name="star" size={13} />
            </motion.span>
            {bestConfig.label}
          </motion.span>
          <motion.span
            variants={chip}
            className="flex items-center gap-1.5 border border-gold/30 bg-black/40 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-white/80"
          >
            <Icon name="layers-outline" size={14} color="#c9aa71" />
            <AnimatedNumber
              value={results.length}
              // Counts up with the deal; reduced motion shows the total straight away.
              from={reduceMotion ? undefined : 0}
              duration={Math.max(0.4, dealEnd - 0.8)}
              className="tabular-nums"
            />
            {results.length === 1 ? 'RECOMPENSA' : 'RECOMPENSAS'}
          </motion.span>
          {bestResultCount > 1 && (
            <motion.span variants={chip} className="text-xs text-white/60">
              ×{bestResultCount} de máxima rareza
            </motion.span>
          )}
        </motion.div>
      </div>

      <div
        {...{ [DECK_ATTRIBUTE]: '' }}
        className="juego-scroll relative flex-1 overflow-y-auto overflow-x-hidden"
        aria-label="Resultados de la invocación"
      >
        {!reduceMotion && (
          // Summoning seal under the deck; it fades once the last card has left.
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${bestConfig.glowColor} 0%, transparent 65%)`,
              boxShadow: `inset 0 0 0 1px ${bestConfig.color}55`,
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1, 1.25], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 + results.length * 0.075 + 0.5, times: [0, 0.25, 1], ease: 'easeOut' }}
          />
        )}
        <div className="flex min-h-full flex-col justify-center [contain:paint]">
          <div
            className={cn(
              'mx-auto flex w-full flex-wrap justify-center px-3 py-4 sm:px-6',
              single ? 'max-w-[340px]' : 'max-w-[900px] gap-2 min-[640px]:gap-3'
            )}
          >
            {results.map((item, index) => (
              <RevealCard
                key={`${item.name}-${index}`}
                item={item}
                index={index}
                total={results.length}
                isBest={item.rarity === bestRarity}
                single={single}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-[1040px] px-3 pb-6 pt-2 sm:px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.soft, delay: 0.45 }}
      >
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRINGS.snappy}
          className={cn(
            'relative flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden text-sm font-bold tracking-[0.25em] text-[#08090b] transition-[filter] hover:brightness-110',
            FOCUS_RING
          )}
          style={{ background: `linear-gradient(90deg, ${bestConfig.color}, #c9aa71)` }}
          aria-label="Continuar después de la invocación"
          autoFocus
        >
          <Sheen every={3.6} duration={1.2} delay={Math.min(2.4, dealEnd)} color="rgba(255,255,255,0.45)" />
          <span className="relative">CONTINUAR</span>
          <Icon name="chevron-forward" size={18} className="relative" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
