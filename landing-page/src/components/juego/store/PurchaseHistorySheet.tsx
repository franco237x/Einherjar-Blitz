'use client';

/**
 * PurchaseHistorySheet — Bottom sheet listing the player's purchases with a
 * claim (certificate) action per item and for all pending ones.
 *
 * Items rise in one after another when the sheet opens; when an item turns
 * claimed its badge flips to RECLAMADA with a small burst.
 */

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import type { PurchaseRecord } from '@/constants/storeData';
import { cn } from '@/lib/utils';
import { EmptyState } from '../EmptyState';
import { Icon } from '../Icon';
import { Modal } from '../Modal';
import { Spinner } from '../Spinner';
import { ParticleBurst, SPRINGS } from '../motion';

interface PurchaseHistorySheetProps {
  visible: boolean;
  onClose: () => void;
  purchases: PurchaseRecord[];
  /** Purchases not yet claimed. */
  pendingCount: number;
  claimingId: string | null;
  claimingAll: boolean;
  onClaimOne: (purchase: PurchaseRecord) => void;
  onClaimAll: () => void;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SPRINGS.soft, delay: 0.12 + Math.min(index, 10) * 0.045 },
  }),
};

type ClaimView = 'claimed' | 'claiming' | 'idle';

function HistoryItem({
  item,
  index,
  claiming,
  onClaim,
}: {
  item: PurchaseRecord;
  index: number;
  claiming: boolean;
  onClaim: (purchase: PurchaseRecord) => void;
}) {
  const reduceMotion = useReducedMotion();
  const claimed = item.status === 'claimed';
  // Celebrate only a live change to claimed, not items that load claimed.
  const [seenStatus, setSeenStatus] = useState(item.status);
  const [justClaimed, setJustClaimed] = useState(false);
  if (item.status !== seenStatus) {
    setSeenStatus(item.status);
    setJustClaimed(item.status === 'claimed');
  }
  const view: ClaimView = claimed ? 'claimed' : claiming ? 'claiming' : 'idle';

  return (
    <motion.li
      custom={index}
      variants={itemVariants}
      className={cn(
        'relative rounded-xl border p-3 transition-colors duration-700',
        claimed ? 'border-white/[0.07] bg-white/[0.02]' : 'border-gold/15 bg-white/[0.035]'
      )}
    >
      {/* Only the sweep is clipped to the row; the claim burst may spill past it. */}
      {justClaimed && !reduceMotion ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(52,211,153,0.18),transparent)]"
            style={{ skewX: -18 }}
            initial={{ x: '-120%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          />
        </span>
      ) : null}
      <p className={cn('text-sm font-bold transition-colors duration-700', claimed ? 'text-white/70' : 'text-white/95')}>
        {item.productName}
      </p>
      <p className="mt-0.5 text-xs text-white/50">
        {item.purchasedAt
          ? item.purchasedAt.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—'}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-bold text-gold">
          <Icon name="planet" size={12} />
          {item.price.toLocaleString('es')}
        </span>
        <span className="relative flex">
          <ParticleBurst
            burstKey={justClaimed ? 1 : null}
            count={14}
            distance={[34, 76]}
            size={[2, 4.5]}
            duration={0.7}
            colors={['#6ee7b7', '#e2c68e']}
          />
          {/*
            The button keeps the width of its widest label (the hidden sizer), so the
            labels can roll through it without resizing it or leaving its clip.
          */}
          <motion.button
            type="button"
            onClick={() => onClaim(item)}
            disabled={claiming || claimed}
            whileTap={view === 'idle' ? { scale: 0.93 } : undefined}
            transition={SPRINGS.snappy}
            className={cn(
              'relative flex min-h-11 items-center justify-center overflow-hidden rounded-full border px-3.5 text-[11px] font-bold tracking-[0.1em] transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              claimed ? 'border-emerald-400/25 text-emerald-300/80' : 'border-gold/40 text-gold hover:bg-gold/10'
            )}
          >
            <span aria-hidden="true" className="invisible flex items-center gap-1.5">
              <Icon name="checkmark-circle" size={12} />
              RECLAMADA
            </span>
            <AnimatePresence initial={false}>
              <motion.span
                key={view}
                className="absolute inset-0 flex items-center justify-center gap-1.5"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={SPRINGS.snappy}
              >
                {view === 'claimed' ? (
                  <>
                    <motion.span
                      className="flex"
                      initial={justClaimed ? { scale: 0, rotate: -90 } : false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ ...SPRINGS.bouncy, delay: 0.08 }}
                    >
                      <Icon name="checkmark-circle" size={12} />
                    </motion.span>
                    RECLAMADA
                  </>
                ) : view === 'claiming' ? (
                  <Spinner size={12} />
                ) : (
                  <>
                    <Icon name="download" size={12} />
                    RECLAMAR
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </span>
      </div>
    </motion.li>
  );
}

export function PurchaseHistorySheet({
  visible,
  onClose,
  purchases,
  pendingCount,
  claimingId,
  claimingAll,
  onClaimOne,
  onClaimAll,
}: PurchaseHistorySheetProps) {
  return (
    <Modal visible={visible} onClose={onClose} label="Historial de compras" variant="sheet" className="sm:max-w-xl">
      <div className="flex items-center justify-between gap-3 border-b border-gold/20 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-title text-lg tracking-wide text-gold">Historial de Compras</h2>
          <AnimatePresence initial={false}>
            {pendingCount > 0 ? (
              <motion.button
                key="claim-all"
                type="button"
                onClick={onClaimAll}
                disabled={claimingAll}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileTap={{ scale: 0.93 }}
                transition={SPRINGS.bouncy}
                className="juego-sheen flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 text-xs font-bold text-gold disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {claimingAll ? (
                  <Spinner size={14} />
                ) : (
                  <>
                    <Icon name="document-text" size={14} />
                    Reclamar Todo
                  </>
                )}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label="Cerrar historial"
        >
          <Icon name="close" size={24} />
        </button>
      </div>

      <div className="juego-scroll flex-1 overflow-y-auto p-5">
        {purchases.length === 0 ? (
          <EmptyState icon="receipt-outline" title="Aún no has comprado nada." compact />
        ) : (
          <motion.ul className="flex flex-col gap-2" initial="hidden" animate="show">
            {purchases.map((item, index) => (
              <HistoryItem
                key={item.id}
                item={item}
                index={index}
                claiming={claimingId === item.id}
                onClaim={onClaimOne}
              />
            ))}
          </motion.ul>
        )}
      </div>
    </Modal>
  );
}
