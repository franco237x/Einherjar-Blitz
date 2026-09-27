import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function GlassCard({ children, className, contentClassName }: GlassCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gold/20 bg-ink-card',
        className
      )}
    >
      <div className={cn('p-6', contentClassName)}>{children}</div>
    </div>
  );
}
