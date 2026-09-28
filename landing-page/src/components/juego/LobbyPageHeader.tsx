import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface LobbyHeaderBadge {
  icon: IconName;
  label: string;
  value: string | number;
  color?: string;
}

interface LobbyPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: LobbyHeaderBadge[];
  /** Compact controls shown to the right of the title (icon buttons, pills). */
  action?: ReactNode;
}

export function LobbyPageHeader({ eyebrow, title, subtitle, badges = [], action }: LobbyPageHeaderProps) {
  return (
    <header className="juego-rise mb-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-5 bg-gold/60" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 truncate font-title text-[27px] leading-tight text-white/95">{title}</h1>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      {subtitle ? <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{subtitle}</p> : null}

      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex min-h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5"
            >
              <Icon name={badge.icon} size={16} color={badge.color || '#c9aa71'} />
              <span className="text-[10px] font-bold tracking-[0.14em] text-white/45">{badge.label}</span>
              <span className="text-sm font-bold tabular-nums text-white/95">{badge.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
