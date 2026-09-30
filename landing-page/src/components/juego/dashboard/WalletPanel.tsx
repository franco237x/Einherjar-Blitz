'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Icon } from '@/components/juego/Icon';
import { EASE_OUT_EXPO, SPRINGS, Sheen } from '@/components/juego/motion';
import { CountUp } from './CountUp';
import { enterAt } from './reveal';
import styles from './dashboard.module.css';

interface WalletPanelProps {
  delay: number;
  keys: number;
  spheres: number;
  /** False while there is no profile yet, so the first real balance does not flash as a gain. */
  ready: boolean;
  disabled: boolean;
  onTransfer: () => void;
  onConvert: () => void;
}

/** Set once the treasury has counted up; later visits in the session start from the real balance. */
let countedUp = false;

export function WalletPanel({ delay: t, keys, spheres, ready, disabled, onTransfer, onConvert }: WalletPanelProps) {
  const [countFromZero] = useState(() => !countedUp);
  useEffect(() => {
    countedUp = true;
  }, []);
  const ref = useRef<HTMLElement>(null);
  // The Convertir sheen only loops while the panel is on screen.
  const inView = useInView(ref);

  return (
    <motion.section
      ref={ref}
      aria-labelledby="wallet-title"
      className="mt-3 rounded-3xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(201,170,113,0.10),rgba(255,255,255,0.02)_45%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      {...enterAt(t)}
    >
      <div className="flex items-center justify-between">
        <h2 id="wallet-title" className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">
          Tesorería
        </h2>
        <span className="text-[11px] text-white/40">1 llave = 50 esferas</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2.5">
        <BalanceTile
          label="Llaves"
          value={keys}
          icon="key"
          color="#c9aa71"
          ready={ready}
          countFromZero={countFromZero}
          delay={t + 0.1}
        />
        <BalanceTile
          label="Esferas"
          value={spheres}
          icon="planet"
          color="#7ed9e7"
          ready={ready}
          countFromZero={countFromZero}
          delay={t + 0.17}
          spin
        />
      </dl>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <motion.button
          type="button"
          onClick={onTransfer}
          disabled={disabled}
          whileTap={{ scale: 0.95 }}
          transition={SPRINGS.snappy}
          className="group flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white/90 transition-colors hover:bg-white/[0.07] active:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <Icon
            name="swap-horizontal"
            size={17}
            color="#c9aa71"
            className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:rotate-180"
          />
          Transferir
        </motion.button>
        <motion.button
          type="button"
          onClick={onConvert}
          disabled={disabled}
          whileTap={{ scale: 0.95 }}
          transition={SPRINGS.snappy}
          className="group relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold text-[#0b0a09] shadow-[0_8px_24px_-10px_rgba(201,170,113,0.7)] transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {!disabled && inView ? <Sheen every={5} delay={t + 1.6} color="rgba(255,255,255,0.45)" /> : null}
          <Icon
            name="sync"
            size={17}
            className="relative motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:rotate-180"
          />
          <span className="relative">Convertir</span>
        </motion.button>
      </div>
    </motion.section>
  );
}

interface BalanceTileProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  ready: boolean;
  /** First visit of the session: count up from 0. Otherwise show the balance right away. */
  countFromZero: boolean;
  delay: number;
  /** Slowly turn the icon (the sphere orbit). */
  spin?: boolean;
}

/** Balance that counts up on arrival, then re-rolls and flashes its change whenever it moves. */
function BalanceTile({ label, value, icon, color, ready, countFromZero, delay, spin }: BalanceTileProps) {
  const [seen, setSeen] = useState({ value, ready });
  const [change, setChange] = useState<{ id: number; delta: number } | null>(null);
  if (value !== seen.value || ready !== seen.ready) {
    if (ready && seen.ready && value !== seen.value) {
      setChange({ id: (change?.id ?? 0) + 1, delta: value - seen.value });
    }
    setSeen({ value, ready });
  }
  const tint = change && change.delta < 0 ? '#f87171' : color;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30 px-3.5 py-3"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRINGS.soft, delay, opacity: { duration: 0.4, delay } } }}
    >
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
        <motion.span
          key={change?.id ?? 0}
          className="flex"
          initial={change ? { scale: 1.45, rotate: change.delta > 0 ? -30 : 30 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={SPRINGS.bouncy}
        >
          <span className={spin ? styles.orbit : undefined} style={spin ? { animationDuration: '14s' } : undefined}>
            <Icon name={icon} size={14} color={color} />
          </span>
        </motion.span>
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
        <CountUp value={value} from={countFromZero ? 0 : value} delay={delay + 0.05} duration={1.3} />
        {/* Change flash and floating delta: positioned against the tile, kept inside <dd> for valid <dl> markup. */}
        <AnimatePresence>
          {change ? (
            <motion.span
              key={change.id}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl border"
              style={{ borderColor: tint, background: `radial-gradient(120% 90% at 20% 0%, ${tint}33, transparent 70%)` }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {change ? (
            <motion.span
              key={`delta-${change.id}`}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 text-[12px] font-bold tabular-nums"
              style={{ color: tint }}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [10, 0, -4, -14], scale: [0.8, 1.1, 1, 1] }}
              transition={{ duration: 1.7, times: [0, 0.15, 0.7, 1], ease: EASE_OUT_EXPO }}
            >
              {change.delta > 0 ? '+' : '−'}
              {Math.abs(change.delta).toLocaleString('es')}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </dd>
    </motion.div>
  );
}
