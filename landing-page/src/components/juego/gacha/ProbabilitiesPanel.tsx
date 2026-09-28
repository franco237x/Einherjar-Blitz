/**
 * ProbabilitiesPanel — Shows the drop-rate breakdown per rarity for the
 * active banner. Probabilities are computed from the banner's reward weights
 * (see getRarityOdds), so they stay accurate if the data changes.
 */

import { RARITIES, getRarityOdds, type RewardItem } from '@/constants/gachaData';
import { Icon } from '../Icon';

interface ProbabilitiesPanelProps {
  rewards: RewardItem[];
}

function formatPercent(p: number): string {
  if (p >= 10) return `${p.toFixed(0)}%`;
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(2)}%`;
}

export function ProbabilitiesPanel({ rewards }: ProbabilitiesPanelProps) {
  const odds = getRarityOdds(rewards);

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] px-5 pb-3 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-7">
      <div className="mb-2 flex items-center gap-1.5 text-white/70">
        <Icon name="stats-chart" size={14} />
        <span className="text-xs font-bold uppercase tracking-[0.15em]">Probabilidades</span>
      </div>

      <ul className="flex flex-col gap-3.5 pb-2 pt-1">
        {odds.map(({ rarity, percent }) => {
          const cfg = RARITIES[rarity];
          return (
            <li key={rarity} className="flex items-center gap-2">
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
                <div
                  className="h-full rounded-full"
                  // Boost very small values so they remain visible.
                  style={{ width: `${Math.max(percent, 1.5)}%`, backgroundColor: cfg.color }}
                />
              </div>

              <span className="w-[14%] min-w-11 text-right text-xs font-bold text-white/95">
                {formatPercent(percent)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
