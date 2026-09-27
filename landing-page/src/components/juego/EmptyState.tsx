/**
 * EmptyState — Shared empty / placeholder state used across tabs
 * (empty store, empty history, empty inventory, etc.) for a
 * consistent look: icon + title + description.
 */

import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  /** Compact variant for use inside modals / small lists. */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        compact ? 'px-6 py-8' : 'px-8 py-12'
      )}
    >
      <Icon name={icon} size={compact ? 40 : 64} color="rgba(201,170,113,0.35)" strokeWidth={1.5} />
      <p
        className={cn(
          'font-title tracking-wider text-white/95',
          compact ? 'mt-1 text-sm' : 'mt-2 text-[17px]'
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="max-w-[280px] text-[13px] leading-5 text-white/50">{description}</p>
      ) : null}
    </div>
  );
}
