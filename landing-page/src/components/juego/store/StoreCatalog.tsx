'use client';

/**
 * StoreCatalog — Presentational store catalog: category filter, available
 * grid, sold-out grid, empty and loading states. It owns no data: the page
 * passes the products, the balance, the filter and the buy handler.
 *
 * Motion: the skeleton cross-fades into cards dealt in one after another;
 * the active category pill slides between chips and filtering reflows the
 * grid (cards leaving pop out of the flow while the rest glide into place).
 */

import { useMemo, useState, type MouseEvent } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type { StoreProduct } from '@/constants/storeData';
import { cn } from '@/lib/utils';
import { EmptyState } from '../EmptyState';
import { Icon } from '../Icon';
import { AnimatedNumber, EASE_OUT_EXPO, SPRINGS } from '../motion';
import { StoreCard } from './StoreCard';
import { StoreSkeleton } from './StoreSkeleton';

export interface StoreCatalogProps {
  products: StoreProduct[];
  spheres: number;
  loading: boolean;
  /** Product whose purchase is being processed. */
  buyingId: string | null;
  onBuy: (product: StoreProduct) => void;
  /** Lower-cased category key; '' shows every category. */
  filter: string;
  onFilterChange: (filter: string) => void;
}

/** Seconds between dealt cards; later cards share the last slot. */
const CARD_STEP = 0.055;
const CARD_STEP_CAP = 8;
const FIRST_CARD_DELAY = 0.08;
/** After a filter change, new cards wait for the leaving ones (0.15s exit) so the two never overlap. */
const REFILTER_CARD_DELAY = 0.17;

// ─── Category chips ────────────────────────────────────────────────────

function CategoryChips({
  categories,
  filter,
  onChange,
}: {
  categories: [string, string][];
  filter: string;
  onChange: (filter: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const chips: [string, string][] = [['', 'Todos'], ...categories];

  const select = (key: string) => (event: MouseEvent<HTMLButtonElement>) => {
    onChange(key);
    // Keep the chosen chip centered in the scrolling row.
    const chip = event.currentTarget;
    const row = chip.parentElement;
    row?.scrollTo({
      left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <motion.div
      layoutScroll
      className="relative -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Categorías"
    >
      {chips.map(([key, label], index) => {
        const active = filter === key;
        return (
          <motion.button
            key={key ? `cat:${key}` : 'all'}
            type="button"
            onClick={select(key)}
            aria-pressed={active}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.93 }}
            transition={{ default: { ...SPRINGS.soft, delay: 0.04 + index * 0.05 }, scale: SPRINGS.snappy }}
            className={cn(
              'relative flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold tracking-[0.08em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              // The dark label waits for the sliding pill, so it never sits dark on dark.
              active
                ? 'border-gold/60 text-[#0b0a09] delay-150'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/85'
            )}
          >
            {active ? (
              <motion.span
                layoutId="store-category-pill"
                aria-hidden="true"
                className="absolute inset-[-1px] rounded-full bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#b39158)] shadow-[0_8px_22px_-8px_rgba(201,170,113,0.75)]"
                transition={SPRINGS.snappy}
              />
            ) : null}
            <motion.span
              className="relative flex"
              animate={{ scale: active ? 1.14 : 1, rotate: active ? -8 : 0 }}
              transition={SPRINGS.bouncy}
            >
              <Icon name={key ? 'pricetag' : 'grid'} size={15} />
            </motion.span>
            <span className="relative max-w-[140px] truncate">{label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ─── Section heading ───────────────────────────────────────────────────

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="relative min-w-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h2
            key={title}
            className="truncate font-title text-xl text-white/95"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0, transition: { duration: 0.16 } }}
            transition={SPRINGS.soft}
          >
            {title}
          </motion.h2>
        </AnimatePresence>
        <motion.span
          key={`rule-${title}`}
          aria-hidden="true"
          className="mt-1.5 block h-px w-16 origin-left bg-[linear-gradient(90deg,#c9aa71,transparent)]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: EASE_OUT_EXPO }}
        />
      </div>
      {count != null ? (
        <span className="shrink-0 rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] tabular-nums text-white/55">
          <AnimatedNumber value={count} duration={0.6} /> disponible{count === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  );
}

// ─── Card grid ─────────────────────────────────────────────────────────

interface CardGridProps extends Pick<StoreCatalogProps, 'spheres' | 'buyingId' | 'onBuy'> {
  list: StoreProduct[];
  /** Seconds before the first card of this grid lands. */
  baseDelay: number;
}

function CardGrid({ list, baseDelay, spheres, buyingId, onBuy }: CardGridProps) {
  const featured = list.length === 1;
  return (
    <div className="relative grid grid-cols-2 gap-3">
      <AnimatePresence mode="popLayout">
        {list.map((product, index) => {
          const delay = baseDelay + Math.min(index, CARD_STEP_CAP) * CARD_STEP;
          return (
            <motion.div
              // A card switching to/from the featured layout re-enters instead of stretching.
              key={`${product.id}${featured ? ':featured' : ''}`}
              layout="position"
              className={cn('h-full', featured && 'col-span-2')}
              style={{ transformPerspective: 1000 }}
              initial={{ opacity: 0, y: 44, scale: 0.9, rotateX: 26 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{
                default: { ...SPRINGS.soft, delay },
                opacity: { duration: 0.3, delay },
                layout: SPRINGS.soft,
              }}
            >
              <StoreCard
                featured={featured}
                product={product}
                spheres={spheres}
                onBuy={onBuy}
                buying={buyingId === product.id}
                delay={delay}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Catalog ───────────────────────────────────────────────────────────

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.18 } },
  transition: { ...SPRINGS.soft, layout: SPRINGS.soft },
};

export function StoreCatalog({ products, spheres, loading, buyingId, onBuy, filter, onFilterChange }: StoreCatalogProps) {
  const reduceMotion = useReducedMotion();
  // Once the player has filtered, cards entering the grid wait for the leaving ones.
  const [shownFilter, setShownFilter] = useState(filter);
  const [refiltered, setRefiltered] = useState(false);
  if (filter !== shownFilter) {
    setShownFilter(filter);
    setRefiltered(true);
  }
  const firstCardDelay = refiltered ? REFILTER_CARD_DELAY : FIRST_CARD_DELAY;

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      const key = (p.category || 'General').toLowerCase();
      map.set(key, p.category || 'General');
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const { available, soldOut } = useMemo(() => {
    const filtered = filter
      ? products.filter((p) => (p.category || 'General').toLowerCase() === filter)
      : products;
    return {
      available: filtered.filter((p) => p.stock > 0),
      soldOut: filtered.filter((p) => p.stock <= 0),
    };
  }, [products, filter]);

  const title = filter
    ? (categories.find(([key]) => key === filter)?.[1] ?? '')
    : available.length === 1
      ? 'Disponible ahora'
      : 'Todos los artículos';
  const soldOutDelay = firstCardDelay + 0.12 + Math.min(available.length, CARD_STEP_CAP) * CARD_STEP;
  // A filter left over from an older catalog can match nothing (and hide the chips).
  const staleFilter = products.length > 0 && available.length === 0 && soldOut.length === 0;

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.div key="loading" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
            <StoreSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <LayoutGroup id="store-catalog">
              {categories.length > 1 ? (
                <CategoryChips categories={categories} filter={filter} onChange={onFilterChange} />
              ) : null}

              <AnimatePresence mode="popLayout">
                {available.length > 0 ? (
                  <motion.section key="available" layout="position" className="mb-10" {...sectionMotion}>
                    <SectionHeading title={title} count={available.length} />
                    <CardGrid
                      list={available}
                      baseDelay={firstCardDelay}
                      spheres={spheres}
                      buyingId={buyingId}
                      onBuy={onBuy}
                    />
                  </motion.section>
                ) : null}

                {soldOut.length > 0 ? (
                  <motion.section key="sold-out" layout="position" className="mb-8" {...sectionMotion}>
                    <h2 className="font-title text-xl text-white/70">Agotados</h2>
                    <p className="mb-4 mt-1 text-xs text-white/45">Vuelve más tarde para su reposición</p>
                    <CardGrid
                      list={soldOut}
                      baseDelay={soldOutDelay}
                      spheres={spheres}
                      buyingId={buyingId}
                      onBuy={onBuy}
                    />
                  </motion.section>
                ) : null}

                {staleFilter ? (
                  <motion.div key="stale" layout="position" className="flex flex-col items-center" {...sectionMotion}>
                    <EmptyState icon="pricetag" title="No hay artículos en esta categoría" compact />
                    <button
                      type="button"
                      onClick={() => onFilterChange('')}
                      className="flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 text-xs font-bold tracking-[0.1em] text-gold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      <Icon name="grid" size={14} />
                      VER TODOS
                    </button>
                  </motion.div>
                ) : null}

                {products.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="relative"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SPRINGS.soft}
                  >
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-4 -ml-28 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(201,170,113,0.2),transparent)]"
                      animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.94, 1.04, 0.94] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <EmptyState
                      icon="storefront"
                      title="La tienda está en mantenimiento"
                      description="Pronto llegarán nuevos artículos. Mientras tanto, sigue acumulando Esferas."
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
