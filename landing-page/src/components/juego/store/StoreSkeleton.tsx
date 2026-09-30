import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * StoreSkeleton — Placeholder catalog while products load: chip row, section
 * title and a 2x2 card grid. One soft light crosses the grid diagonally, card
 * by card, instead of every block blinking on its own.
 */

const SHIMMER =
  'pointer-events-none absolute inset-y-0 left-0 w-2/3 animate-[juego-loading-bar_1.9s_cubic-bezier(0.65,0,0.35,1)_infinite_both] bg-[linear-gradient(100deg,transparent,rgba(255,236,200,0.06)_35%,rgba(255,236,200,0.13)_50%,rgba(255,236,200,0.06)_65%,transparent)] motion-reduce:hidden';

function Shimmer({ wave }: { wave: number }) {
  return <span aria-hidden="true" className={SHIMMER} style={{ animationDelay: `${wave}s` }} />;
}

function Bone({ className, style, wave }: { className: string; style?: CSSProperties; wave: number }) {
  return (
    <span className={cn('relative block overflow-hidden bg-white/[0.05]', className)} style={style}>
      <Shimmer wave={wave} />
    </span>
  );
}

function SkeletonCard({ wave }: { wave: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[linear-gradient(180deg,#151311,#0e0c0b)]">
      <div className="aspect-[4/3] bg-white/[0.035]" />
      <div className="flex flex-col p-3">
        <span className="h-3.5 w-4/5 rounded bg-white/[0.07]" />
        <span className="mt-2 h-3.5 w-1/2 rounded bg-white/[0.07]" />
        <span className="mt-3 h-2.5 w-2/5 rounded bg-white/[0.045]" />
        <span className="mt-3 h-px bg-white/[0.06]" />
        <span className="mt-3 h-4 w-16 rounded bg-white/[0.07]" />
        <span className="mt-2 h-11 rounded-full bg-white/[0.045]" />
      </div>
      <Shimmer wave={wave} />
    </div>
  );
}

export function StoreSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Cargando tienda...</span>
      <div className="-mx-4 mb-6 flex gap-2 overflow-hidden px-4 pb-1" aria-hidden="true">
        {[76, 124, 104].map((width, index) => (
          <Bone key={width} className="h-11 shrink-0 rounded-full" style={{ width }} wave={index * 0.09} />
        ))}
      </div>
      <div className="mb-4 flex items-end justify-between gap-3" aria-hidden="true">
        <Bone className="h-6 w-44 rounded-md" wave={0.12} />
        <Bone className="h-6 w-24 rounded-full" wave={0.3} />
      </div>
      <div className="grid grid-cols-2 gap-3" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} wave={0.2 + (index % 2) * 0.14 + Math.floor(index / 2) * 0.22} />
        ))}
      </div>
    </div>
  );
}
