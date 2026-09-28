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
        'overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm',
        className
      )}
    >
      <div className={cn('p-6', contentClassName)}>{children}</div>
    </div>
  );
}
