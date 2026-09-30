'use client';

/**
 * Presentational pieces of the inventory sheet: rarity filter chips with a
 * sliding highlight, and the reward grid whose tiles cascade in and reflow
 * smoothly when the filter changes.
 */

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ALL_REWARDS, RARITIES, type RarityKey } from '@/constants/gachaData';
import type { InventoryItem } from '@/services/inventory';
import { cn } from '@/lib/utils';
import { SPRINGS } from '../motion';
import { Icon } from '../Icon';
import { FOCUS_RING, HoloFoil } from './fx';

// Build a name → reward lookup so we can resolve the local image & fallback icon.
const REWARD_BY_NAME = new Map(ALL_REWARDS.map((reward) => [reward.name, reward]));

export const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

export type InventoryFilter = RarityKey | 'all';
export type GroupedInventoryItem = InventoryItem & { count: number };

export function InventoryFilters({
  filter,
  onChange,
  countsByRarity,
}: {
  filter: InventoryFilter;
  onChange: (next: InventoryFilter) => void;
  countsByRarity: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-x-2 px-6 pb-2" role="group" aria-label="Filtrar por rareza">
      <FilterChip label="Todos" active={filter === 'all'} onClick={() => onChange('all')} color="#c9aa71" />
      {RARITY_ORDER.map((r) => {
        const cfg = RARITIES[r];
        const c = countsByRarity[r] || 0;
        if (c === 0) return null;
        return (
          <FilterChip
            key={r}
            label={`${cfg.label} · ${c}`}
            active={filter === r}
            onClick={() => onChange(r)}
            color={cfg.color}
          />
        );
      })}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  // The button keeps a 44px tap target; the visible pill inside is smaller.
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.92 }}
      transition={SPRINGS.snappy}
      className={cn('group flex min-h-11 items-center rounded-full', FOCUS_RING)}
    >
      <span
        className={cn(
          'relative flex h-8 items-center rounded-full border px-3 text-xs font-bold tracking-wide transition-colors',
          active ? 'border-transparent text-ink-deep' : 'border-white/15 bg-white/5 text-white/70 group-hover:bg-white/10'
        )}
      >
        {active ? (
          <motion.span
            layoutId="gacha-inventory-filter"
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 4px 16px -4px ${color}` }}
            transition={SPRINGS.snappy}
          />
        ) : null}
        <span className="relative">{label}</span>
      </span>
    </motion.button>
  );
}

const grid: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
  gone: { opacity: 0, y: -8, transition: { duration: 0.13, ease: 'easeIn' } },
};

const tile: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.9 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { ...SPRINGS.soft, opacity: { duration: 0.25 } } },
};

/**
 * Reward grid. A filter change fades the current grid out and cascades the new
 * one in, rather than sliding tiles across a long scrolled list.
 */
export function InventoryGrid({ items, filterKey }: { items: GroupedInventoryItem[]; filterKey: string }) {
  return (
    <AnimatePresence mode="wait" initial>
      <motion.ul
        key={filterKey}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
        variants={grid}
        initial="hidden"
        animate="shown"
        exit="gone"
      >
        {items.map((item, index) => (
          <InventoryTile key={item.id} item={item} index={index} />
        ))}
      </motion.ul>
    </AnimatePresence>
  );
}

function InventoryTile({ item, index }: { item: GroupedInventoryItem; index: number }) {
  const rarity = RARITIES[item.rarity];
  const reward = REWARD_BY_NAME.get(item.name);
  const foil = item.rarity === 'mythic' || item.rarity === 'legendary';

  return (
    <motion.li
      variants={tile}
      whileHover={{ y: -4 }}
      transition={SPRINGS.soft}
      className="overflow-hidden rounded-xl border bg-ink/85"
      style={{
        borderColor: rarity.color,
        boxShadow: foil || item.rarity === 'epic' ? `0 10px 26px -14px ${rarity.color}` : undefined,
      }}
    >
      <div className="relative aspect-square overflow-hidden">
        {reward?.image ? (
          <img src={reward.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: rarity.glowColor }}>
            <Icon name={reward?.fallbackIcon || 'cube'} size={40} color={rarity.color} />
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 h-[30px] opacity-50" style={{ backgroundColor: rarity.glowColor }} />
        {foil ? <HoloFoil delay={1.2 + (index % 6) * 0.4} every={6.5} /> : null}
        {item.count > 1 && (
          <motion.span
            className="absolute right-2 top-2 z-[7] rounded-full border border-white/20 bg-black/75 px-2 py-0.5 text-xs font-bold text-white"
            variants={{
              hidden: { scale: 0.4, opacity: 0 },
              shown: { scale: 1, opacity: 1, transition: { ...SPRINGS.bouncy, delay: 0.18 } },
            }}
          >
            x{item.count}
          </motion.span>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 p-2 text-center">
        <span className="flex gap-0.5">
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Icon key={i} name="star" size={9} color={rarity.color} />
          ))}
        </span>
        <span className="line-clamp-2 text-[13px] font-bold leading-4" style={{ color: rarity.color }}>
          {item.name}
        </span>
      </div>
    </motion.li>
  );
}
