'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion, useAnimate, useReducedMotion, type Variants } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { Spinner } from '@/components/juego/Spinner';
import { AnimatedNumber, EASE_OUT_EXPO, ParticleBurst, SPRINGS, Sheen, stagger } from '@/components/juego/motion';
import { cn } from '@/lib/utils';
import { CountUp } from './CountUp';
import { SuccessMark } from './ResultEmblem';
import styles from './dashboard.module.css';

export const SPHERES_PER_KEY = 50;

/** How long the stage keeps showing a finished conversion: comet landing (~0.6s) plus a beat to read it. */
const HOLD_MS = 2000;

export interface ConvertSuccess {
  /** Changes on every conversion, so the celebration replays. */
  id: number;
  spheres: number;
}

interface ConvertPanelProps {
  amount: string;
  onAmountChange: (value: string) => void;
  keys: number;
  spheres: number;
  busy: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  /** Only while the success message is on screen. */
  success: ConvertSuccess | null;
  onSubmit: (event?: FormEvent) => void;
  onClose: () => void;
}

/** Modal content lands piece by piece right behind the sheet. */
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.soft },
};

/** Contents of the status slot swap in place; the slot keeps its height so the sheet never jumps. */
const slotSwap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { ...SPRINGS.soft, opacity: { duration: 0.2 } } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14 } },
};

/**
 * Body of the "Convertir llaves" modal. Purely presentational: the parent
 * owns the amount, validation and the server call.
 */
export function ConvertPanel({
  amount,
  onAmountChange,
  keys,
  spheres,
  busy,
  message,
  success,
  onSubmit,
  onClose,
}: ConvertPanelProps) {
  const reduceMotion = useReducedMotion();
  const parsedAmount = parseInt(amount, 10) || 0;
  const [inputScope, animateInput] = useAnimate<HTMLInputElement>();
  const [errorScope, animateError] = useAnimate<HTMLParagraphElement>();

  // The parent resets the amount to 1 on success. While the conversion is celebrated the stage
  // keeps showing what was converted; the timer or any edit of the amount hands it back.
  const [releasedId, setReleasedId] = useState<number | null>(null);
  const holding = success !== null && releasedId !== success.id;
  const stageAmount = success && holding ? Math.round(success.spheres / SPHERES_PER_KEY) : parsedAmount;
  const successId = success?.id ?? null;
  useEffect(() => {
    if (successId === null) return;
    const timer = setTimeout(() => setReleasedId(successId), HOLD_MS);
    return () => clearTimeout(timer);
  }, [successId]);
  const release = () => {
    if (successId !== null) setReleasedId(successId);
  };

  // Each new error object shakes the message, even when the text repeats.
  useEffect(() => {
    if (message?.type !== 'error' || reduceMotion || !errorScope.current) return;
    animateError(errorScope.current, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.4 });
  }, [animateError, errorScope, message, reduceMotion]);

  const bump = (direction: 1 | -1) => {
    if (reduceMotion || !inputScope.current) return;
    animateInput(inputScope.current, { scale: [1.07, 1], y: [direction * -3, 0] }, SPRINGS.bouncy);
  };

  return (
    <motion.form onSubmit={onSubmit} initial="hidden" animate="show" variants={stagger(0.05, 0.08)}>
      <motion.div variants={item} className="mb-4 flex items-center justify-between">
        <h2 className="font-title text-lg tracking-wide text-gold">Convertir Llaves</h2>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 active:bg-white/10"
          aria-label="Cerrar conversión"
        >
          <Icon name="close" size={22} />
        </button>
      </motion.div>

      <motion.div variants={item} className="mb-4 grid grid-cols-2 gap-2 text-[13px] font-bold text-white/95">
        <span className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/5 px-3 py-2">
          <Icon name="key-outline" size={17} color="#c9aa71" />
          <span>
            Llaves: <AnimatedNumber value={keys} className="tabular-nums" />
          </span>
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/5 px-3 py-2">
          <Icon name="planet-outline" size={17} color="#7ed9e7" />
          <span>
            Esferas: <AnimatedNumber value={spheres} className="tabular-nums" />
          </span>
        </span>
      </motion.div>

      <motion.div variants={item}>
        <label htmlFor="convert-amount" className="mb-1 mt-2 block text-xs text-white/70">
          Cantidad de llaves a convertir
        </label>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.86 }}
            transition={SPRINGS.snappy}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-gold transition-colors hover:bg-white/10"
            onClick={() => {
              release();
              onAmountChange(String(Math.max(1, (parseInt(amount, 10) || 1) - 1)));
              bump(-1);
            }}
            aria-label="Restar una llave"
          >
            <Icon name="remove" size={20} />
          </motion.button>
          <input
            ref={inputScope}
            id="convert-amount"
            className="h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-center text-base font-bold text-white/95 outline-none transition-colors focus:border-gold/60"
            placeholder="1"
            value={amount}
            onChange={(e) => {
              release();
              onAmountChange(e.target.value.replace(/[^0-9]/g, ''));
            }}
            inputMode="numeric"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.86 }}
            transition={SPRINGS.snappy}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-white/5 text-gold transition-colors hover:bg-white/10"
            onClick={() => {
              release();
              onAmountChange(String((parseInt(amount, 10) || 0) + 1));
              bump(1);
            }}
            aria-label="Sumar una llave"
          >
            <Icon name="add" size={20} />
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <TransmuteStage amount={stageAmount} holding={holding} success={success} />
      </motion.div>

      {/* Status slot: balance preview, error or success, always the same height. */}
      <motion.div variants={item} className="mt-3 grid min-h-[56px]">
        <AnimatePresence initial={false}>
          {message?.type === 'error' ? (
            <motion.div key="error" className="flex [grid-area:1/1]" {...slotSwap}>
              <p
                ref={errorScope}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#e57373]/25 bg-[#e57373]/[0.07] px-3 py-2.5 text-center text-xs text-[#e57373]"
                role="alert"
              >
                <Icon name="alert-circle" size={14} className="shrink-0" />
                {message.text}
              </p>
            </motion.div>
          ) : message?.type === 'success' ? (
            <motion.div
              key={`success-${success?.id ?? 0}`}
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2.5 [grid-area:1/1]"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={slotSwap.exit}
              transition={{ ...SPRINGS.bouncy, delay: 0.45, opacity: { duration: 0.25, delay: 0.45 } }}
            >
              <SuccessMark size={30} delay={0.5} />
              <p className="min-w-0 flex-1 text-[12px] leading-4 text-[#a7e3b0]">{message.text}</p>
              {success ? (
                <span aria-hidden="true" className="shrink-0 font-title text-lg text-[#9be8f2]">
                  <CountUp value={success.spheres} delay={0.6} duration={1.1} prefix="+" />
                </span>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="preview" className="flex [grid-area:1/1]" {...slotSwap}>
              <BalancePreview keys={keys - parsedAmount} spheres={spheres + parsedAmount * SPHERES_PER_KEY} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={item}>
        <motion.button
          type="submit"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          transition={SPRINGS.snappy}
          className="relative mt-5 flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold tracking-[0.15em] text-[#0b0a09] shadow-[0_10px_30px_-12px_rgba(201,170,113,0.8)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-60"
        >
          {!busy ? <Sheen every={4} delay={1.4} color="rgba(255,255,255,0.45)" /> : null}
          {busy ? <Spinner className="text-ink-deep" /> : <span className="relative">CONVERTIR</span>}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}

/** Balances the player ends up with; the key side turns red when the amount is more than they own. */
function BalancePreview({ keys, spheres }: { keys: number; spheres: number }) {
  const short = keys < 0;
  return (
    <div className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Tras convertir</span>
      <span className="ml-auto flex items-center gap-3 text-[13px] font-bold">
        <span className={cn('flex items-center gap-1 transition-colors', short ? 'text-[#e57373]' : 'text-gold-light')}>
          <Icon name="key-outline" size={14} />
          <AnimatedNumber value={keys} duration={0.5} className="tabular-nums" />
          <span className="sr-only">{Math.abs(keys) === 1 ? 'llave' : 'llaves'}</span>
        </span>
        <span className="flex items-center gap-1 text-[#9be8f2]">
          <Icon name="planet-outline" size={14} />
          <AnimatedNumber value={spheres} duration={0.5} className="tabular-nums" />
          <span className="sr-only">esferas</span>
        </span>
      </span>
    </div>
  );
}

const flip: Variants = {
  enter: (direction: number) => ({ y: direction > 0 ? '70%' : '-70%', opacity: 0 }),
  center: { y: '0%', opacity: 1, transition: SPRINGS.snappy },
  exit: (direction: number) => ({ y: direction > 0 ? '-70%' : '70%', opacity: 0, transition: { duration: 0.14 } }),
};

/**
 * Key → spheres preview. Energy streams from the key orb to the sphere orb;
 * on a successful conversion a comet crosses and the sphere orb bursts.
 */
function TransmuteStage({
  amount,
  holding,
  success,
}: {
  amount: number;
  /** True while the stage shows a finished conversion instead of the live amount. */
  holding: boolean;
  success: ConvertSuccess | null;
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(amount);
  const [direction, setDirection] = useState(1);
  const [wasHolding, setWasHolding] = useState(holding);
  // True when the last change came from leaving a celebration: the total resets in place instead of counting down.
  const [snap, setSnap] = useState(false);
  if (amount !== shown) {
    setDirection(amount > shown ? 1 : -1);
    setShown(amount);
    setSnap(wasHolding && !holding);
  }
  if (holding !== wasHolding) setWasHolding(holding);
  // Id of the conversion whose comet already reached the sphere orb.
  const [landed, setLanded] = useState<number | null>(null);
  const arrived = success && (reduceMotion || landed === success.id) ? success.id : null;
  const cometId = success && !reduceMotion && landed !== success.id ? success.id : null;

  return (
    <div className="relative mt-4 rounded-2xl border border-gold/15 bg-[radial-gradient(120%_110%_at_50%_0%,rgba(201,170,113,0.15),rgba(201,170,113,0.03)_70%)] px-4 pb-3.5 pt-4">
      <p className="sr-only">
        {amount} {amount === 1 ? 'llave' : 'llaves'} → {amount * SPHERES_PER_KEY} esferas
      </p>
      <div aria-hidden="true">
        <div className="flex items-center">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <motion.span
              key={`key-${success?.id ?? 0}`}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/45 bg-[radial-gradient(circle_at_35%_30%,rgba(240,217,166,0.4),rgba(201,170,113,0.08)_70%)] shadow-[0_0_26px_-8px_rgba(201,170,113,0.8)]"
              initial={success ? { scale: 1 } : false}
              animate={success ? { scale: [1, 1.24, 0.88, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            >
              <motion.span
                key={shown}
                className="flex"
                initial={{ rotate: direction > 0 ? -22 : 22, scale: 1.2 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={SPRINGS.bouncy}
              >
                <Icon name="key" size={24} color="#f0d9a6" />
              </motion.span>
            </motion.span>
            {success && !reduceMotion ? <Burst key={`key-fx-${success.id}`} color="#e2c68e" glow="rgba(240,217,166,0.55)" /> : null}
          </span>

          <span className="relative mx-3 h-8 flex-1">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,rgba(201,170,113,0.55),rgba(126,217,231,0.55))]" />
            {[0, 0.6, 1.2].map((at) => (
              <span
                key={at}
                className={`absolute inset-0 ${styles.flow}`}
                style={{ '--flow-delay': `${at}s` } as CSSProperties}
              >
                <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#fff1cf] shadow-[0_0_8px_2px_rgba(226,198,142,0.7)]" />
              </span>
            ))}
            {cometId !== null ? (
              <motion.span
                key={cometId}
                className="absolute inset-0"
                initial={{ x: '0%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.45, delay: 0.12, ease: [0.55, 0, 0.8, 0.3] }}
                onAnimationComplete={() => setLanded(cometId)}
              >
                <span className="absolute left-0 top-1/2 h-2.5 w-9 -translate-x-full -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,transparent,#e2c68e_60%,#ffffff)] shadow-[0_0_14px_4px_rgba(226,198,142,0.55)]" />
              </motion.span>
            ) : null}
          </span>

          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <motion.span
              key={`sphere-${arrived ?? 0}`}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[#7ed9e7]/45 bg-[radial-gradient(circle_at_35%_30%,rgba(190,243,250,0.4),rgba(126,217,231,0.08)_70%)] shadow-[0_0_26px_-8px_rgba(126,217,231,0.9)]"
              initial={arrived !== null ? { scale: 1.38 } : false}
              animate={{ scale: 1 }}
              transition={SPRINGS.bouncy}
            >
              <Icon name="planet" size={24} color="#bff3fa" className={styles.orbit} />
            </motion.span>
            {arrived !== null && !reduceMotion ? (
              <Burst key={`sphere-fx-${arrived}`} color="#9be8f2" glow="rgba(126,217,231,0.7)" big />
            ) : null}
            {/* Sized to stay inside the sheet's padding, so the burst can spill over the stage border without
                creating horizontal overflow. */}
            <ParticleBurst
              burstKey={arrived}
              colors={['#7ed9e7', '#bff3fa', '#3fb8c9', '#ffffff']}
              count={18}
              distance={[24, 56]}
              size={[4, 8]}
              duration={1}
            />
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="relative inline-flex h-8 min-w-[1ch] items-center overflow-hidden text-2xl font-bold leading-none text-gold-light">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                  key={shown}
                  custom={direction}
                  variants={flip}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="tabular-nums"
                >
                  {shown.toLocaleString('es')}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold/70">
              {amount === 1 ? 'llave' : 'llaves'}
            </span>
          </span>
          <span className="ml-auto flex min-w-0 items-baseline gap-1.5">
            <AnimatedNumber
              value={amount * SPHERES_PER_KEY}
              duration={snap ? 0 : 0.6}
              className="text-2xl font-bold leading-none tabular-nums text-[#9be8f2]"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9be8f2]/70">esferas</span>
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-white/60">Tasa: 1 llave = 50 esferas</p>
    </div>
  );
}

/** Flash + shockwave ring around an orb (its relative parent). */
function Burst({ color, glow, big }: { color: string; glow: string; big?: boolean }) {
  return (
    <>
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: big ? 2.2 : 1.9, opacity: [0, 1, 0] }}
        transition={{ duration: big ? 0.9 : 0.6, ease: EASE_OUT_EXPO }}
      />
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: big ? 2.1 : 1.7, opacity: 0 }}
        transition={{ duration: big ? 0.85 : 0.6, ease: EASE_OUT_EXPO }}
      />
    </>
  );
}
