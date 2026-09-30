'use client';

/**
 * StoreCard — Product card for the store grid.
 *
 * - Image with category tag overlay; it settles from a slight zoom as the
 *   card lands, gets one light pass, and drifts in slowly on hover
 * - Exclusive items (isExclusive): running gold aura, looping sheen, sparkles
 * - Low stock: pulsing badge. Sold out: desaturated with a stamped "AGOTADO"
 * - Buy button whose label flips between COMPRAR / SIN SALDO / AGOTADO / busy
 *
 * The grid wrapper owns the card's entrance; `delay` keeps the inner
 * choreography (image settle, light pass, stamp) in sync with it. The loops
 * (aura, sheen, sparkles, low-stock pulse) only run while the card is on or
 * near the screen.
 */

import { useRef, type CSSProperties } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import type { StoreProduct } from '@/constants/storeData';
import { cn } from '@/lib/utils';
import { Icon } from '../Icon';
import { AnimatedNumber, EASE_IN_OUT, EASE_OUT_EXPO, SPRINGS, Sheen, TiltCard } from '../motion';

interface StoreCardProps {
  product: StoreProduct;
  spheres: number;
  onBuy: (product: StoreProduct) => void;
  buying: boolean;
  /** Full-width layout, used when the catalog shows a single product. */
  featured?: boolean;
  /** Seconds until the card lands, to time its inner choreography. */
  delay?: number;
}

type BuyState = 'buy' | 'poor' | 'soldOut' | 'buying';

const BUY_LABEL: Record<Exclude<BuyState, 'buying'>, string> = {
  buy: 'COMPRAR',
  poor: 'SIN SALDO',
  soldOut: 'AGOTADO',
};

const SPARKLE_PATH = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';

/** Four-point glint that twinkles on a loop (exclusive items). */
function Sparkle({ className, delay, size = 11 }: { className: string; delay: number; size?: number }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('pointer-events-none absolute z-[7] text-[#fff4d4]', className)}
      style={{ filter: 'drop-shadow(0 0 3px rgba(255,214,120,0.95))' }}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 120] }}
      transition={{ duration: 1.3, delay, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
    >
      <path fill="currentColor" d={SPARKLE_PATH} />
    </motion.svg>
  );
}

/** Three dots hopping in turn while the purchase is processed. */
function BusyDots({ still }: { still: boolean }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={still ? undefined : { y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 0.66, repeat: Infinity, delay: dot * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

export function StoreCard({ product, spheres, onBuy, buying, featured = false, delay = 0 }: StoreCardProps) {
  const reduceMotion = useReducedMotion();
  const articleRef = useRef<HTMLElement>(null);
  const inView = useInView(articleRef, { margin: '120px' });
  const loops = inView && !reduceMotion;
  const soldOut = product.stock <= 0;
  const canAfford = spheres >= product.price && !soldOut;
  const lowStock = !soldOut && product.stock <= 3;
  const buyState: BuyState = buying ? 'buying' : soldOut ? 'soldOut' : canAfford ? 'buy' : 'poor';
  const lit = buyState === 'buy' || buyState === 'buying';

  return (
    // A light press only: most scroll gestures start on a card, and sold-out cards are not tappable.
    <TiltCard
      max={soldOut ? 4 : 7}
      press={soldOut ? 1 : 0.985}
      className={cn('group h-full', featured ? 'rounded-3xl' : 'rounded-2xl')}
    >
      <article
        ref={articleRef}
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[inherit] border bg-[linear-gradient(180deg,#151311,#0e0c0b)]',
          product.isExclusive
            ? cn(
                'border-[#d4af37]/55 shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_20px_50px_-20px_rgba(212,175,55,0.5)]',
                // The aura's arc repaints the card every frame; pause it off-screen.
                inView && 'juego-aura'
              )
            : soldOut
              ? 'border-white/[0.05]'
              : 'border-white/[0.08]'
        )}
        style={product.isExclusive ? ({ '--juego-aura-color': '#ebc766' } as CSSProperties) : undefined}
      >
        <div className={cn('relative overflow-hidden', featured ? 'aspect-[16/11]' : 'aspect-[4/3]')}>
          <div
            className={cn(
              'h-full w-full',
              !reduceMotion && 'transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]'
            )}
          >
            <motion.img
              src={product.imageUrl}
              alt={`Imagen de ${product.name}`}
              className={cn('h-full w-full object-cover', soldOut && 'grayscale')}
              loading="lazy"
              initial={{ scale: 1.22 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, delay, ease: EASE_OUT_EXPO }}
            />
          </div>
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0',
              product.isExclusive
                ? 'bg-[linear-gradient(180deg,transparent_45%,rgba(14,12,11,0.92)_100%),radial-gradient(ellipse_at_50%_115%,rgba(212,175,55,0.35),transparent_60%)]'
                : 'bg-[linear-gradient(180deg,transparent_55%,rgba(14,12,11,0.9)_100%)]'
            )}
          />

          {/* One light pass as the card lands. */}
          {!reduceMotion && !soldOut ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,243,214,0.32),transparent)]"
              style={{ skewX: -18 }}
              initial={{ x: '-170%' }}
              animate={{ x: '330%' }}
              transition={{ duration: 1.05, delay: delay + 0.22, ease: EASE_IN_OUT }}
            />
          ) : null}

          <span className="absolute left-2.5 top-2.5 z-[6] max-w-[70%] truncate rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md">
            {product.category}
          </span>

          {product.isExclusive ? (
            <>
              {inView ? <Sheen every={5.2} delay={delay + 1.6} duration={1.4} color="rgba(255,231,168,0.26)" /> : null}
              <span className="absolute bottom-2.5 left-2.5 z-[6] flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#f5d77a,#d4af37)] px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-[#1b1305] shadow-[0_4px_14px_-4px_rgba(212,175,55,0.85)]">
                <Icon name="trophy" size={10} />
                EXCLUSIVO
              </span>
              {loops ? (
                <>
                  <Sparkle className="bottom-[26px] left-[80px]" delay={delay + 0.9} />
                  <Sparkle className="right-3 top-[38%]" size={8} delay={delay + 2.4} />
                </>
              ) : null}
            </>
          ) : null}

          {soldOut ? (
            <div className="absolute inset-0 z-[6] flex items-center justify-center">
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45, delay: delay + 0.12 }}
              />
              <motion.span
                className="relative rounded-md border-2 border-[#ff8f8f]/85 bg-black/45 px-3 py-1 font-title text-[13px] font-bold tracking-[0.22em] text-[#ffb4b4] shadow-[0_0_24px_-6px_rgba(255,120,120,0.6)] outline outline-1 outline-offset-2 outline-[#ff8f8f]/35"
                initial={{ opacity: 0, scale: 2.3, rotate: -26 }}
                animate={{ opacity: 1, scale: 1, rotate: -9 }}
                transition={{ ...SPRINGS.bouncy, delay: delay + 0.34, opacity: { duration: 0.1, delay: delay + 0.34 } }}
              >
                AGOTADO
                {!reduceMotion ? (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-1 rounded-lg border border-[#ff8f8f]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: [0, 0.85, 0], scale: [0.9, 1, 1.55] }}
                    transition={{ duration: 0.6, delay: delay + 0.46, times: [0, 0.2, 1], ease: 'easeOut' }}
                  />
                ) : null}
              </motion.span>
            </div>
          ) : null}
        </div>

        <div className={cn('flex flex-1 flex-col', featured ? 'p-4' : 'p-3')}>
          <h3
            className={cn(
              'font-bold leading-tight',
              soldOut ? 'text-white/70' : 'text-white/95',
              featured ? 'font-title text-[22px]' : 'line-clamp-2 min-h-[2.5em] text-[14px]'
            )}
          >
            {product.name}
          </h3>
          {featured && product.description ? (
            <p className="mt-1.5 text-[13px] leading-5 text-white/60">{product.description}</p>
          ) : null}

          {lowStock ? (
            <motion.p
              className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-[3px] text-[10.5px] font-bold text-amber-200 shadow-[0_0_14px_-4px_rgba(252,211,77,0.55)]"
              animate={
                loops
                  ? {
                      scale: [1, 1.07, 1],
                      transition: { duration: 0.8, delay: delay + 0.8, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' },
                    }
                  : { scale: 1, transition: { duration: 0.2 } }
              }
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                {loops ? <span className="absolute inset-0 animate-ping rounded-full bg-amber-300 motion-reduce:hidden" /> : null}
                <span className="relative h-1.5 w-1.5 rounded-full bg-amber-300" />
              </span>
              <span>
                ¡Solo queda{product.stock === 1 ? '' : 'n'} <AnimatedNumber value={product.stock} />!
              </span>
            </motion.p>
          ) : (
            <p className={cn('mt-1.5 flex items-center gap-1 text-[11px]', soldOut ? 'text-[#ffb4b4]/80' : 'text-white/45')}>
              <Icon name={soldOut ? 'ban' : 'cube'} size={11} />
              {soldOut ? (
                'Sin existencias'
              ) : (
                <span>
                  <AnimatedNumber value={product.stock} /> disponibles
                </span>
              )}
            </p>
          )}

          <div
            className={cn(
              'mt-auto flex gap-2 border-t border-white/[0.06] pt-3',
              featured ? 'mt-4 items-center justify-between' : 'flex-col'
            )}
          >
            <span
              className={cn(
                'flex items-center gap-1.5 font-bold tabular-nums transition-colors duration-500',
                featured ? 'text-xl' : 'text-base',
                buyState === 'poor' ? 'text-white/55' : soldOut ? 'text-white/45' : 'text-white'
              )}
            >
              <Icon
                name="planet"
                size={featured ? 18 : 15}
                color="#7ed9e7"
                className={cn('transition-opacity duration-500', lit ? 'opacity-100' : 'opacity-60')}
              />
              {product.price.toLocaleString('es')}
            </span>
            <motion.button
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
              whileTap={buyState === 'buy' ? { scale: 0.94 } : undefined}
              transition={SPRINGS.snappy}
              className={cn(
                'relative isolate flex min-h-11 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border text-[11px] font-bold tracking-[0.1em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
                featured ? 'min-w-[136px] px-6 text-xs' : 'w-full',
                lit ? 'border-transparent text-[#111]' : 'cursor-not-allowed border-white/10 text-white/40',
                buyState === 'buy' && 'juego-sheen'
              )}
            >
              <motion.span
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 -z-10',
                  product.isExclusive ? 'bg-[linear-gradient(135deg,#f5d77a,#d4af37)]' : 'bg-gold'
                )}
                initial={false}
                animate={{ opacity: lit ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={buyState}
                  className="flex items-center gap-1.5"
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -18, opacity: 0 }}
                  transition={SPRINGS.snappy}
                >
                  {buyState === 'buying' ? (
                    <BusyDots still={Boolean(reduceMotion)} />
                  ) : (
                    <>
                      {buyState === 'poor' ? <Icon name="planet" size={12} /> : null}
                      {BUY_LABEL[buyState]}
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
