'use client';

/**
 * PurchaseModal — Result modal for store purchases.
 *
 * Shows a loader while processing, then success or error with the product
 * name and price.
 */

import { Icon } from '../Icon';
import { Modal } from '../Modal';

export type PurchaseState = 'loading' | 'success' | 'error' | null;

interface PurchaseModalProps {
  state: PurchaseState;
  productName?: string;
  productImage?: string;
  price?: number;
  errorMessage?: string;
  onClose: () => void;
}

export function PurchaseModal({ state, productName, productImage, price, errorMessage, onClose }: PurchaseModalProps) {
  return (
    <Modal
      visible={state !== null}
      onClose={onClose}
      label="Resultado de la compra"
      locked={state === 'loading'}
      className="sm:max-w-[360px]"
    >
      <div key={state ?? 'none'} className="juego-pop-in flex flex-col items-center text-center" aria-live="polite">
        {state === 'loading' && (
          <>
            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
              <Icon name="sync" size={36} color="#c9aa71" className="juego-spin" />
            </span>
            <h2 className="font-title text-lg text-white/95">Procesando compra...</h2>
            <p className="mt-1 text-sm text-white/50">Un momento por favor</p>
          </>
        )}

        {state === 'success' && (
          <>
            <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.2),transparent_70%)]">
              <Icon name="checkmark-circle" size={48} color="#22c55e" />
            </span>
            <h2 className="font-title text-lg text-white/95">¡Compra exitosa!</h2>
            {productImage && (
              <img src={productImage} alt="" className="mt-4 h-28 w-28 rounded-xl border border-gold/30 object-cover" />
            )}
            <p className="mt-3 text-base font-bold text-white/95">{productName}</p>
            {price != null && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-gold">
                <Icon name="planet" size={14} />
                {price.toLocaleString()} Esferas
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-12 w-full rounded-full bg-emerald-500 text-sm font-bold tracking-[0.15em] text-white transition hover:bg-emerald-400"
              autoFocus
            >
              CONTINUAR
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <span className="mb-4 flex h-20 w-20 items-center justify-center">
              <Icon name="close-circle" size={48} color="#ef4444" />
            </span>
            <h2 className="font-title text-lg text-white/95">No se pudo completar</h2>
            <p className="mt-2 text-sm text-white/60" role="alert">
              {errorMessage || 'Ocurrió un error inesperado.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-12 w-full rounded-full border border-red-500/50 bg-red-500/10 text-sm font-bold tracking-[0.15em] text-red-300 transition hover:bg-red-500/20"
              autoFocus
            >
              ENTENDIDO
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
