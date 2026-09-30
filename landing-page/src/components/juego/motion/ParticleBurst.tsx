'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { seeded } from './presets';

interface ParticleBurstProps {
  /** Change it (e.g. increment) to fire a new burst; null renders nothing. */
  burstKey: number | null;
  colors?: string[];
  count?: number;
  /** Travel distance range in px. */
  distance?: [number, number];
  /** Particle size range in px. */
  size?: [number, number];
  duration?: number;
  /** 'dot' glowing circles, 'spark' thin streaks aligned with their direction. */
  shape?: 'dot' | 'spark';
  className?: string;
}

/** One-shot radial burst from the center of its (relative) parent. */
export function ParticleBurst({
  burstKey,
  colors = ['#e2c68e', '#c9aa71'],
  count = 22,
  distance = [60, 150],
  size = [3, 7],
  duration = 0.9,
  shape = 'dot',
  className,
}: ParticleBurstProps) {
  const reduceMotion = useReducedMotion();
  if (burstKey === null || reduceMotion) return null;

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className={cn('pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0', className)}
    >
      {Array.from({ length: count }, (_, index) => {
        const seed = burstKey * 131 + index * 7;
        const angle = (index / count) * Math.PI * 2 + seeded(seed) * 0.6;
        const travel = distance[0] + seeded(seed + 1) * (distance[1] - distance[0]);
        const px = size[0] + seeded(seed + 2) * (size[1] - size[0]);
        const color = colors[index % colors.length];
        const spark = shape === 'spark';
        return (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{
              width: spark ? px * 4 : px,
              height: spark ? Math.max(1.5, px / 2.5) : px,
              marginLeft: spark ? -px * 2 : -px / 2,
              marginTop: spark ? -px / 5 : -px / 2,
              backgroundColor: color,
              boxShadow: `0 0 ${px * 2}px ${color}`,
              rotate: spark ? `${(angle * 180) / Math.PI}deg` : undefined,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * travel,
              y: Math.sin(angle) * travel,
              opacity: 0,
              scale: spark ? 0.6 : 0.3,
            }}
            transition={{ duration: duration * (0.75 + seeded(seed + 3) * 0.5), ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}
