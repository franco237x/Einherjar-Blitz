'use client';

/**
 * StoreHeaderActions — Refresh and purchase-history buttons for the store
 * header. Each time `bumpKey` changes (the page bumps it when the player
 * closes a successful purchase) the receipt icon jolts and a ring pulses off
 * the button, pointing at where the purchase went.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '../Icon';
import { SPRINGS } from '../motion';

interface StoreHeaderActionsProps {
  refreshing: boolean;
  /** Blocks the refresh button without spinning it (e.g. first load). */
  refreshDisabled?: boolean;
  onRefresh: () => void;
  pendingCount: number;
  onOpenHistory: () => void;
  /** Change it to play the "purchase landed" cue; 0 plays nothing. */
  bumpKey?: number;
}

export function StoreHeaderActions({
  refreshing,
  refreshDisabled = false,
  onRefresh,
  pendingCount,
  onOpenHistory,
  bumpKey: bump = 0,
}: StoreHeaderActionsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        onClick={onRefresh}
        disabled={refreshing || refreshDisabled}
        whileTap={{ scale: 0.88 }}
        transition={SPRINGS.snappy}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label="Actualizar catálogo"
      >
        <Icon name="refresh" size={17} className={refreshing ? 'juego-spin' : undefined} />
      </motion.button>
      <motion.button
        type="button"
        onClick={onOpenHistory}
        whileTap={{ scale: 0.88 }}
        transition={SPRINGS.snappy}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-gold transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label={`Abrir historial, ${pendingCount} compras pendientes`}
      >
        <motion.span
          key={bump}
          className="flex"
          initial={bump ? { rotate: -22, scale: 1.35, y: -3 } : false}
          animate={{ rotate: 0, scale: 1, y: 0 }}
          transition={SPRINGS.bouncy}
        >
          <Icon name="receipt" size={18} />
        </motion.span>
        {bump && !reduceMotion ? (
          <motion.span
            key={`ring-${bump}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-gold"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
        <AnimatePresence>
          {pendingCount > 0 ? (
            <motion.span
              key="badge"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-full border-2 border-[#0b0a09] bg-red-500 px-1 text-[10px] font-bold text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRINGS.bouncy}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={Math.min(pendingCount, 99)}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={SPRINGS.snappy}
                >
                  {Math.min(pendingCount, 99)}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
