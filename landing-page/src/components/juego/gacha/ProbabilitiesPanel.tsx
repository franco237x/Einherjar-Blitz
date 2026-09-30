'use client';

/**
 * ProbabilitiesPanel — Shows the drop-rate breakdown per rarity for the
 * active banner. Probabilities are computed from the banner's reward weights
 * (see getRarityOdds), so they stay accurate if the data changes.
 *
 * Rows slide in one after another and each bar fills from the left, ending
 * with a glint.
 */

import { memo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { RARITIES, getRarityOdds, type RewardItem } from '@/constants/gachaData';
import { EASE_OUT_EXPO, SPRINGS } from '../motion';
import { Icon } from '../Icon';

interface ProbabilitiesPanelProps {
  rewards: RewardItem[];
}

function formatPercent(p: number): string {
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

const rows: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const row: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: SPRINGS.soft },
};

const fill: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.1 } },
};

const glint: Variants = {
  hidden: { x: '-120%', opacity: 0 },
  show: { x: '320%', opacity: [0, 1, 0], transition: { duration: 0.9, ease: 'easeInOut', delay: 0.55 } },
};

const readout: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { ...SPRINGS.soft, delay: 0.3 } },
};

export const ProbabilitiesPanel = memo(function ProbabilitiesPanel({ rewards }: ProbabilitiesPanelProps) {
  const odds = getRarityOdds(rewards);

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] px-5 pb-3 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-7">
      <div className="mb-2 flex items-center gap-1.5 text-white/70">
        <Icon name="stats-chart" size={14} />
        <span className="text-xs font-bold uppercase tracking-[0.15em]">Por rareza</span>
      </div>

      <motion.ul className="flex flex-col gap-3.5 pb-2 pt-1" variants={rows} initial="hidden" animate="show">
        {odds.map(({ rarity, percent }) => {
          const cfg = RARITIES[rarity];
          return (
            <motion.li key={rarity} className="flex items-center gap-2" variants={row}>
              <div className="w-[28%] min-w-[90px]">
                <div className="mb-0.5 flex gap-px">
                  {Array.from({ length: cfg.stars }).map((_, i) => (
                    <Icon key={i} name="star" size={9} color={cfg.color} />
                  ))}
                </div>
                <span className="text-[11px] font-bold tracking-wide" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="relative h-full origin-left overflow-hidden rounded-full"
                  // Boost very small values so they remain visible.
                  style={{
                    width: `${Math.max(percent, 1.5)}%`,
                    backgroundColor: cfg.color,
                    boxShadow: `0 0 10px ${cfg.glowColor}`,
                  }}
                  variants={fill}
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)]"
                    variants={glint}
                  />
                </motion.div>
              </div>

              <motion.span
                className="w-[14%] min-w-11 text-right text-xs font-bold tabular-nums text-white/95"
                variants={readout}
              >
                {formatPercent(percent)}
              </motion.span>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
});
