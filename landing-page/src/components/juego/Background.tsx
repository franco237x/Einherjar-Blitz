import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lobby backdrop: warm near-black with a soft gold glow at the top, a cool
 * counter-light at the bottom, a vignette and film grain.
 */
export function Background({ children, className }: BackgroundProps) {
  return (
    <div className={cn('juego-grain relative min-h-dvh overflow-clip bg-[#0b0a09]', className)}>
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[72rem] max-w-[160vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,170,113,0.16),transparent)]" />
        <div className="absolute bottom-[-20rem] right-[-10rem] h-[34rem] w-[48rem] rounded-full bg-[radial-gradient(closest-side,rgba(103,217,231,0.06),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>
      {children}
    </div>
  );
}
