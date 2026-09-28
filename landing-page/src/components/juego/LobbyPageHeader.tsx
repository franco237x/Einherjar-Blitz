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
  action?: ReactNode;
}

export function LobbyPageHeader({ eyebrow, title, subtitle, badges = [], action }: LobbyPageHeaderProps) {
  return (
    <header className="juego-rise mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
            <span className="h-px w-6 bg-gold/60" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-title text-[28px] leading-tight text-white/95 sm:text-[34px]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">{subtitle}</p> : null}
      </div>

      {badges.length > 0 || action ? (
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5"
            >
              <Icon name={badge.icon} size={16} color={badge.color || '#c9aa71'} />
              <span className="text-[10px] font-bold tracking-[0.14em] text-white/45">{badge.label}</span>
              <span className="text-sm font-bold tabular-nums text-white/95">{badge.value}</span>
            </div>
          ))}
          {action}
        </div>
      ) : null}
    </header>
  );
}
