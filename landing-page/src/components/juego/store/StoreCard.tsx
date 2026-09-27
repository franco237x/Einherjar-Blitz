/**
 * StoreCard — Product card for the store grid.
 *
 * - Image with category tag overlay
 * - "Exclusive" golden border for premium items (isExclusive)
 * - Sold-out overlay when stock === 0
 * - Title, stock count, price (spheres) and buy button
 */

import type { StoreProduct } from '@/constants/storeData';
import { cn } from '@/lib/utils';
import { Icon } from '../Icon';

interface StoreCardProps {
  product: StoreProduct;
  spheres: number;
  onBuy: (product: StoreProduct) => void;
  buying: boolean;
}

export function StoreCard({ product, spheres, onBuy, buying }: StoreCardProps) {
  const soldOut = product.stock <= 0;
  const canAfford = spheres >= product.price && !soldOut;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-[#101010]',
        product.isExclusive
          ? 'border-2 border-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.25)]'
          : 'border-white/10'
      )}
    >
      <div className="relative h-32 min-[390px]:h-[150px] md:h-40 lg:h-[150px]">
        <img
          src={product.imageUrl}
          alt={`Imagen de ${product.name}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 max-w-[70%] truncate rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">
          {product.category}
        </span>
        {product.isExclusive && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-[#d4af37] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#1b1305]">
            <Icon name="trophy" size={10} />
            EXCLUSIVO
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70">
            <Icon name="ban" size={20} color="#ffb4b4" />
            <span className="text-xs font-bold tracking-[0.15em] text-[#ffb4b4]">AGOTADO</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-bold leading-tight text-white/95">{product.name}</h3>
        <p className={cn('flex items-center gap-1 text-[11px]', soldOut ? 'text-[#ffb4b4]' : 'text-white/50')}>
          <Icon name={soldOut ? 'ban-outline' : 'cube-outline'} size={11} />
          {soldOut ? 'Agotado' : `${product.stock} disponibles`}
        </p>

        <button
          type="button"
          onClick={() => canAfford && onBuy(product)}
          disabled={!canAfford || buying}
          aria-busy={buying || undefined}
          aria-label={
            soldOut
              ? `${product.name}, agotado`
              : canAfford
                ? `Comprar ${product.name} por ${product.price} esferas`
                : `Saldo insuficiente para comprar ${product.name}`
          }
          className={cn(
            'mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition',
            canAfford
              ? product.isExclusive
                ? 'bg-[linear-gradient(135deg,#f5d77a,#d4af37)] text-[#111] hover:brightness-110'
                : 'bg-gold text-[#111] hover:brightness-110'
              : 'cursor-not-allowed bg-white/[0.06] text-white/50'
          )}
        >
          <Icon name="planet" size={14} />
          <span>{product.price.toLocaleString()}</span>
          <span className="tracking-wider">
            {buying ? '...' : soldOut ? 'AGOTADO' : canAfford ? 'COMPRAR' : 'SIN SALDO'}
          </span>
        </button>
      </div>
    </article>
  );
}
