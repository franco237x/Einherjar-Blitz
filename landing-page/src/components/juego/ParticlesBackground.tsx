'use client';

import { useState, type CSSProperties } from 'react';

const PARTICLE_COUNT = 16;

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  peak: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    left: Math.random() * 100,
    size: Math.random() * 2.5 + 1.5, // 1.5px to 4px
    duration: Math.random() * 5000 + 4000, // 4s to 9s
    delay: Math.random() * 5000,
    sway: (Math.random() - 0.5) * 100,
    peak: Math.random() * 0.35 + 0.2, // peak opacity 0.2-0.55
  }));
}

/**
 * Floating golden particles. Hidden when the user prefers reduced motion.
 * Only rendered behind the auth guard, which never renders on the server,
 * so the random layout can't cause a hydration mismatch.
 */
export function ParticlesBackground() {
  const [particles] = useState(createParticles);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="juego-particle"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
              '--juego-particle-sway': `${p.sway}px`,
              '--juego-particle-peak': p.peak,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
