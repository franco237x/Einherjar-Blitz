import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundProps {
  children: ReactNode;
  className?: string;
}

export function Background({ children, className }: BackgroundProps) {
  return (
    <div
      className={cn(
        'relative min-h-dvh overflow-hidden bg-ink bg-[linear-gradient(135deg,#0a0a0a_0%,#1a1a1a_50%,#0a0a0a_100%)] bg-fixed',
        className
      )}
    >
      {children}
    </div>
  );
}
