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
    <header className="mb-6 flex min-h-[72px] flex-col gap-4 min-[620px]:flex-row min-[620px]:items-center min-[620px]:justify-between min-[620px]:gap-6">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="font-title text-[25px] tracking-wide text-white/95">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] leading-[18px] text-white/50">{subtitle}</p> : null}
      </div>

      {badges.length > 0 || action ? (
        <div className="flex flex-col items-stretch gap-2 min-[620px]:flex-row min-[620px]:items-center">
          {badges.length > 0 ? (
            <div className="flex flex-1 gap-2" aria-label="Recursos disponibles">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex min-h-[46px] min-w-[104px] flex-1 items-center gap-2 rounded-xl border border-gold/20 bg-ink/90 px-2"
                >
                  <Icon name={badge.icon} size={18} color={badge.color || '#c9aa71'} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold tracking-[0.08em] text-white/50">{badge.label}</p>
                    <p className="truncate text-base font-bold leading-[18px] text-white/95">{badge.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {action ? <div className="flex min-h-11 items-center">{action}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
