'use client';

/**
 * PurchaseModal — Result modal for store purchases.
 *
 * - loading: cyan spheres orbit a ring around the product while the server
 *   works; the ring collapses when the answer arrives
 * - success: the check draws itself, sparks burst, the product pops in over
 *   slow rays and the price rolls up
 * - error: the icon shakes while its X is drawn
 *
 * Locked while loading; the action button takes focus once a result shows.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { AnimatedNumber, EASE_IN_OUT, EASE_OUT_EXPO, ParticleBurst, SPRINGS } from '../motion';

export type PurchaseState = 'loading' | 'success' | 'error' | null;

interface PurchaseModalProps {
  state: PurchaseState;
  productName?: string;
  productImage?: string;
  price?: number;
  errorMessage?: string;
  onClose: () => void;
}

/**
 * Each view bleeds to the panel edges (cancelling the Modal padding) and
 * clips there, so glows, rays and particles never make the panel scroll.
 * All views share the success view's height, so the sheet does not jump
 * when the answer replaces the loader.
 */
const VIEW =
  'relative -mx-6 -mb-6 -mt-7 flex min-h-[460px] flex-col items-center overflow-hidden rounded-t-3xl px-6 pb-6 pt-7 text-center sm:-mt-6 sm:min-h-[456px] sm:rounded-3xl sm:pt-6';

const viewMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.18 } },
  transition: { duration: 0.12 },
};

/** Thin ring mask for conic-gradient arcs. */
const RING_MASK = 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px))';
const ringStyle = (background: string): CSSProperties => ({
  background,
  mask: RING_MASK,
  WebkitMask: RING_MASK,
});

// Circle path that starts at 12 o'clock, so pathLength draws it clockwise from the top.
const CIRCLE_PATH = 'M26 3a23 23 0 1 1 0 46a23 23 0 1 1 0-46';

/** Entrance for the reveal's text and buttons; a press (scale) stays immediate. */
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { default: { ...SPRINGS.soft, delay }, scale: SPRINGS.snappy },
});

// ─── Loading ───────────────────────────────────────────────────────────

const ORBITS = [
  { inset: -14, size: 10, duration: 1.7, phase: 20, reverse: false },
  { inset: 0, size: 7, duration: 2.6, phase: 150, reverse: false },
  { inset: 18, size: 5, duration: 1.25, phase: 260, reverse: true },
];

function LoadingView({ productName, productImage }: { productName?: string; productImage?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={VIEW} {...viewMotion} exit={{ opacity: 0, transition: { duration: 0.18 } }}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_at_50%_0%,rgba(126,217,231,0.14),transparent_70%)]"
      />
      <motion.span
        aria-hidden="true"
        className="relative mb-8 mt-auto flex h-40 w-40 items-center justify-center"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        // Reduced motion applies the scale at once, so the ring would snap small before fading.
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.2 } }
            : { scale: 0.35, opacity: 0, transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] } }
        }
        transition={SPRINGS.soft}
      >
        <span className="absolute -inset-7 rounded-full border border-dashed border-white/[0.06]" />
        <span className="absolute inset-0 rounded-full border border-gold/20" />
        <motion.span
          className="absolute inset-0 rounded-full"
          style={ringStyle('conic-gradient(from 0deg, transparent 0 60%, rgba(201,170,113,0.85) 92%, #fff4d4 100%)')}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
        />
        {ORBITS.map((orbit) => (
          <motion.span
            key={orbit.phase}
            className="absolute rounded-full"
            style={{ inset: orbit.inset }}
            initial={{ rotate: orbit.phase }}
            animate={reduceMotion ? undefined : { rotate: orbit.phase + (orbit.reverse ? -360 : 360) }}
            transition={{ duration: orbit.duration, repeat: Infinity, ease: 'linear' }}
          >
            {/* Comet tail behind the sphere, along its orbit. */}
            <span
              className="absolute inset-0 rounded-full"
              style={ringStyle(
                orbit.reverse
                  ? 'conic-gradient(from 0deg, rgba(126,217,231,0.5) 0%, transparent 22% 100%)'
                  : 'conic-gradient(from 0deg, transparent 0 78%, rgba(126,217,231,0.5) 100%)'
              )}
            />
            <span
              className="absolute left-1/2 top-0 rounded-full bg-[#c9f5fb]"
              style={{
                width: orbit.size,
                height: orbit.size,
                marginLeft: -orbit.size / 2,
                marginTop: -orbit.size / 2 + 1,
                boxShadow: `0 0 ${orbit.size * 1.4}px #7ed9e7, 0 0 ${orbit.size * 3}px rgba(126,217,231,0.45)`,
              }}
            />
          </motion.span>
        ))}
        <motion.span
          className="relative flex h-22 w-22 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-[#14110e] shadow-[0_0_28px_-4px_rgba(201,170,113,0.5)]"
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {productImage ? (
            <img src={productImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="planet" size={34} color="#7ed9e7" />
          )}
        </motion.span>
      </motion.span>
      <h2 className="font-title text-lg text-white/95">Procesando compra...</h2>
      <p className="mt-1 text-sm text-white/50">Un momento por favor</p>
      <p className="mb-auto mt-3 min-h-4 max-w-full truncate text-[11px] font-bold uppercase tracking-[0.18em] text-gold/75">
        {productName}
      </p>
    </motion.div>
  );
}

// ─── Success ───────────────────────────────────────────────────────────

/**
 * Price that rolls up from 0 once the rest of the reveal has landed. The roll
 * is visual only: screen readers (the view sits in a live region) get the
 * final price once instead of every intermediate frame.
 */
function RollingPrice({ value, delay }: { value: number; delay: number }) {
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return (
    <>
      <span aria-hidden="true" className="flex items-center gap-1.5">
        <AnimatedNumber value={started || reduceMotion ? value : 0} from={0} duration={1.1} className="tabular-nums" />
        Esferas
      </span>
      <span className="sr-only">{value.toLocaleString('es')} Esferas</span>
    </>
  );
}

function SuccessView({
  productName,
  productImage,
  price,
  onClose,
}: Pick<PurchaseModalProps, 'productName' | 'productImage' | 'price' | 'onClose'>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={VIEW} {...viewMotion}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(ellipse_at_50%_0%,rgba(52,211,153,0.2),transparent_70%)]"
      />

      <span className="relative mb-4 flex h-20 w-20 items-center justify-center">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.3),transparent_70%)]"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRINGS.bouncy}
        />
        {!reduceMotion ? (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-emerald-300/80"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          />
        ) : null}
        <ParticleBurst burstKey={1} count={18} distance={[56, 140]} colors={['#6ee7b7', '#e2c68e', '#7ed9e7']} />
        <ParticleBurst burstKey={2} shape="spark" count={10} distance={[44, 120]} colors={['#fff4d4', '#6ee7b7']} />
        <svg viewBox="0 0 52 52" width="52" height="52" className="relative" aria-hidden="true">
          <motion.path
            d={CIRCLE_PATH}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: EASE_IN_OUT, opacity: { duration: 0.05 } }}
          />
          <motion.path
            d="M15.5 27l7.5 7.5 14-15"
            fill="none"
            stroke="#4ade80"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.36, ease: 'easeOut', opacity: { duration: 0.05, delay: 0.36 } }}
          />
        </svg>
      </span>

      <motion.h2 className="font-title text-lg text-white/95" {...rise(0.1)}>
        ¡Compra exitosa!
      </motion.h2>

      {productImage ? (
        <span className="relative mt-5 flex h-32 w-32 items-center justify-center">
          {!reduceMotion ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-12 rounded-full"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, rgba(226,198,142,0.18) 0deg 7deg, transparent 7deg 22.5deg)',
                maskImage: 'radial-gradient(closest-side, #000 30%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(closest-side, #000 30%, transparent 100%)',
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              transition={{
                opacity: { duration: 0.6, delay: 0.25 },
                scale: { ...SPRINGS.soft, delay: 0.25 },
                rotate: { duration: 26, repeat: Infinity, ease: 'linear' },
              }}
            />
          ) : null}
          <motion.span
            className="relative h-28 w-28 overflow-hidden rounded-2xl border border-gold/45 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9),0_0_32px_-6px_rgba(201,170,113,0.6)]"
            initial={{ scale: 0.2, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ ...SPRINGS.bouncy, delay: 0.22, opacity: { duration: 0.15, delay: 0.22 } }}
          >
            <img src={productImage} alt="" className="h-full w-full object-cover" />
            {!reduceMotion ? (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,244,214,0.45),transparent)]"
                style={{ skewX: -18 }}
                initial={{ x: '-150%' }}
                animate={{ x: '320%' }}
                transition={{ duration: 0.9, delay: 0.62, ease: EASE_IN_OUT }}
              />
            ) : null}
          </motion.span>
        </span>
      ) : null}

      <motion.p className="mt-4 text-base font-bold text-white/95" {...rise(0.34)}>
        {productName}
      </motion.p>
      {price != null ? (
        <motion.p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-gold" {...rise(0.4)}>
          <Icon name="planet" size={14} />
          <RollingPrice value={price} delay={0.45} />
        </motion.p>
      ) : null}
      <motion.button
        type="button"
        onClick={onClose}
        className="juego-sheen mt-6 min-h-12 w-full rounded-full bg-emerald-500 text-sm font-bold tracking-[0.15em] text-white shadow-[0_12px_30px_-12px_rgba(16,185,129,0.8)] transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        autoFocus
        whileTap={{ scale: 0.96 }}
        {...rise(0.5)}
      >
        CONTINUAR
      </motion.button>
    </motion.div>
  );
}

// ─── Error ─────────────────────────────────────────────────────────────

function ErrorView({ errorMessage, onClose }: Pick<PurchaseModalProps, 'errorMessage' | 'onClose'>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className={VIEW} {...viewMotion}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_at_50%_0%,rgba(239,68,68,0.18),transparent_70%)]"
      />
      <motion.span
        className="relative mb-4 mt-auto flex h-20 w-20 items-center justify-center"
        animate={reduceMotion ? undefined : { x: [0, -9, 9, -6, 6, -3, 0] }}
        transition={{ duration: 0.5, delay: 0.32, ease: 'easeInOut' }}
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.26),transparent_70%)]"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRINGS.bouncy}
        />
        <svg viewBox="0 0 52 52" width="52" height="52" className="relative" aria-hidden="true">
          <motion.path
            d={CIRCLE_PATH}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_IN_OUT, opacity: { duration: 0.05 } }}
          />
          {['M19 19l14 14', 'M33 19L19 33'].map((d, index) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              stroke="#f87171"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.16,
                delay: 0.3 + index * 0.12,
                ease: 'easeOut',
                opacity: { duration: 0.02, delay: 0.3 + index * 0.12 },
              }}
            />
          ))}
        </svg>
      </motion.span>
      <motion.h2 className="font-title text-lg text-white/95" {...rise(0.08)}>
        No se pudo completar
      </motion.h2>
      <motion.p className="mb-auto mt-2 text-sm text-white/60" role="alert" {...rise(0.14)}>
        {errorMessage || 'Ocurrió un error inesperado.'}
      </motion.p>
      <motion.button
        type="button"
        onClick={onClose}
        className="mt-6 min-h-12 w-full rounded-full border border-red-500/50 bg-red-500/10 text-sm font-bold tracking-[0.15em] text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
        autoFocus
        whileTap={{ scale: 0.96 }}
        {...rise(0.22)}
      >
        ENTENDIDO
      </motion.button>
    </motion.div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────

export function PurchaseModal({ state, productName, productImage, price, errorMessage, onClose }: PurchaseModalProps) {
  return (
    <Modal
      visible={state !== null}
      onClose={onClose}
      label="Resultado de la compra"
      locked={state === 'loading'}
      className="sm:max-w-[360px]"
    >
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {state === 'loading' ? (
            <LoadingView key="loading" productName={productName} productImage={productImage} />
          ) : state === 'success' ? (
            <SuccessView
              key="success"
              productName={productName}
              productImage={productImage}
              price={price}
              onClose={onClose}
            />
          ) : state === 'error' ? (
            <ErrorView key="error" errorMessage={errorMessage} onClose={onClose} />
          ) : null}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
