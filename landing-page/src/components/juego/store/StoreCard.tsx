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
  const lowStock = !soldOut && product.stock <= 3;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,#151311,#0e0c0b)] transition duration-300',
        product.isExclusive
          ? 'border-[#d4af37]/70 shadow-[0_0_0_1px_rgba(212,175,55,0.25),0_20px_50px_-20px_rgba(212,175,55,0.45)]'
          : 'border-white/[0.08] hover:border-white/20',
        !soldOut && 'hover:-translate-y-1'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={`Imagen de ${product.name}`}
          className={cn(
            'h-full w-full object-cover transition-transform duration-700 ease-out',
            soldOut ? 'grayscale' : 'group-hover:scale-105'
          )}
          loading="lazy"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(14,12,11,0.9)_100%)]" />
        <span className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md">
          {product.category}
        </span>
        {product.isExclusive && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#f5d77a,#d4af37)] px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-[#1b1305]">
            <Icon name="trophy" size={10} />
            EXCLUSIVO
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="flex items-center gap-1.5 rounded-full border border-[#ffb4b4]/30 bg-black/70 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#ffb4b4]">
              <Icon name="ban" size={12} />
              AGOTADO
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5em] text-[15px] font-bold leading-tight text-white/95">{product.name}</h3>
        <p
          className={cn(
            'mt-1.5 flex items-center gap-1 text-[11px]',
            soldOut ? 'text-[#ffb4b4]' : lowStock ? 'text-amber-300/90' : 'text-white/45'
          )}
        >
          <Icon name={soldOut ? 'ban' : 'cube'} size={11} />
          {soldOut ? 'Sin existencias' : lowStock ? `¡Solo quedan ${product.stock}!` : `${product.stock} disponibles`}
        </p>

        <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between">
          <span className="flex items-center gap-1.5 text-base font-bold tabular-nums text-white">
            <Icon name="planet" size={15} color="#7ed9e7" />
            {product.price.toLocaleString('es')}
          </span>
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
              'flex min-h-9 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[11px] font-bold tracking-[0.1em] transition',
              canAfford
                ? product.isExclusive
                  ? 'juego-sheen bg-[linear-gradient(135deg,#f5d77a,#d4af37)] text-[#111] hover:brightness-110'
                  : 'juego-sheen bg-gold text-[#111] hover:brightness-110'
                : 'cursor-not-allowed border border-white/10 text-white/40'
            )}
          >
            {buying ? '...' : soldOut ? 'AGOTADO' : canAfford ? 'COMPRAR' : 'SIN SALDO'}
          </button>
        </div>
      </div>
    </article>
  );
}
