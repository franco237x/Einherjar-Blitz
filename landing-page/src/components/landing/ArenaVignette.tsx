'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { SpriteActor } from '@/components/juego/game/SpriteActor';
import { getCharacterAnimation, type CharacterAnimationName } from '@/constants/characterAssets';

// A short scripted exchange, looped: who acts on each beat. Galileo's special
// and heal frames are left out because their crops still need cleaning.
const BEATS: { hero: CharacterAnimationName; boss: CharacterAnimationName }[] = [
  { hero: 'attack', boss: 'idle' },
  { hero: 'idle', boss: 'defend' },
  { hero: 'idle', boss: 'attack' },
  { hero: 'defend', boss: 'idle' },
];
const BEAT_MS = 1600;

/** Hero artwork: the real battle sprites trading blows over the arena. */
export function ArenaVignette() {
  const reduceMotion = useReducedMotion();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setBeat((current) => (current + 1) % BEATS.length), BEAT_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const { hero, boss } = reduceMotion ? { hero: 'idle' as const, boss: 'idle' as const } : BEATS[beat];
  const heroClip = getCharacterAnimation('galileo', hero);
  const bossClip = getCharacterAnimation('rey_escarlata', boss);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-[#121110]">
      <Image
        src="/juego/game/arena-scarlet-forge.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 768px) 440px, 90vw"
        className="object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,10,9,0.55)_0%,rgba(11,10,9,0.05)_35%,rgba(11,10,9,0.2)_70%,#0b0a09_100%)]" />

      <span className="absolute left-1/2 top-6 -translate-x-1/2 border border-primary/40 bg-black/50 px-3 py-1 font-title text-xs tracking-[0.3em] text-primary backdrop-blur-sm">
        VS
      </span>

      {/* Both sheets carry slicing leftovers under the feet: each frame is cropped
          just below the feet so they stay hidden. */}
      <div className="absolute bottom-[12%] left-[-4%] w-[58%] overflow-hidden" style={{ aspectRatio: '196 / 200' }}>
        {heroClip ? <SpriteActor animation={hero} clip={heroClip} className="h-auto w-full" /> : null}
      </div>
      <div className="absolute bottom-[12%] right-[-4%] w-[56%] overflow-hidden" style={{ aspectRatio: '212 / 188' }}>
        {bossClip ? <SpriteActor animation={boss} clip={bossClip} className="h-auto w-full" /> : null}
      </div>
    </div>
  );
}
