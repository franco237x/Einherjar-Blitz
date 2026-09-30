'use client';

import { useEffect, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import { GAME_CHARACTERS } from '@/constants/battleData';
import { CHAMPION_PORTRAITS } from './portraits';
import { EASE_OUT } from './primitives';

const DECK = Object.keys(CHAMPION_PORTRAITS).map((id) => GAME_CHARACTERS[id]);
const CYCLE_MS = 3800;

// Resting place of a card by its position in the deck: front, right, left.
const SLOTS = [
  { x: '0%', y: '0%', rotate: 0, scale: 1, zIndex: 3, dim: 0 },
  { x: '27%', y: '6%', rotate: 8, scale: 0.84, zIndex: 2, dim: 0.6 },
  { x: '-27%', y: '6%', rotate: -8, scale: 0.84, zIndex: 1, dim: 0.6 },
];

// The front card is tossed out to the left before it settles at the back.
const TO_BACK = { x: ['0%', '-52%', '-27%'], y: ['0%', '2%', '6%'], rotate: [0, -16, -8], scale: [1, 0.9, 0.84] };

const SPRING = { type: 'spring', stiffness: 140, damping: 20, mass: 0.9 } as const;

/** Hero artwork: the champions' portraits fanned like a hand of cards that reshuffles itself. */
export function ChampionDeck({ parallaxY }: { parallaxY?: MotionValue<number> }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);

  const tiltX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  useEffect(() => {
    if (reduceMotion || paused) return;
    const timer = window.setInterval(() => setFront((current) => (current + 1) % DECK.length), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 14);
    tiltX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
  };

  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    setPaused(false);
  };

  const champion = DECK[front];

  return (
    <>
      <motion.div style={{ y: parallaxY }} className="relative aspect-[8/9] [perspective:1400px]">
        <motion.div
          className="pointer-events-none absolute inset-[12%] rounded-full opacity-40 blur-[80px]"
          animate={{ backgroundColor: champion.accentColor }}
          transition={{ duration: 1.2, ease: EASE_OUT }}
          aria-hidden="true"
        />

        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          style={{ rotateX: tiltX, rotateY: tiltY }}
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          onPointerEnter={() => setPaused(true)}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          {DECK.map((character, index) => {
            const slot = (index - front + DECK.length) % DECK.length;
            const rest = SLOTS[slot];
            const portrait = CHAMPION_PORTRAITS[character.id];
            const toBack = slot === DECK.length - 1 && !reduceMotion;
            return (
              <motion.button
                key={character.id}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setFront(index)}
                className="absolute left-[18%] top-[10%] aspect-[3/4] w-[64%] cursor-pointer overflow-hidden border border-white/[0.12] bg-[#151311] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
                style={{ zIndex: rest.zIndex, originY: 0.9 }}
                initial={false}
                animate={toBack ? TO_BACK : { x: rest.x, y: rest.y, rotate: rest.rotate, scale: rest.scale }}
                transition={toBack ? { duration: 0.9, times: [0, 0.45, 1], ease: EASE_OUT } : SPRING}
              >
                <Image
                  src={portrait.src}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="(min-width: 768px) 290px, 60vw"
                  className="object-cover"
                  style={{ objectPosition: portrait.focus }}
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,10,9,0.92)_100%)]" />
                <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: character.accentColor }} />
                <span className="absolute inset-x-0 bottom-0 px-4 pb-4 text-left">
                  <span className="block font-title text-lg tracking-[0.08em] text-white">{character.name}</span>
                  <span className="block text-[12px] text-white/60">{character.title}</span>
                </span>

                {/* Light sweep when the card reaches the front. */}
                <motion.span
                  className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.28),transparent)]"
                  initial={{ x: '-120%' }}
                  animate={{ x: slot === 0 && !reduceMotion ? ['-120%', '320%'] : '-120%' }}
                  transition={slot === 0 ? { duration: 1.1, delay: 0.35, ease: EASE_OUT } : { duration: 0 }}
                />
                <motion.span
                  className="pointer-events-none absolute inset-0 bg-[#0b0a09]"
                  initial={false}
                  animate={{ opacity: rest.dim }}
                  transition={{ duration: 0.6, ease: EASE_OUT }}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      <figcaption className="mt-6 flex items-center justify-between gap-4 text-sm">
        <span className="relative h-5 min-w-0 flex-1 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={champion.id}
              className="absolute inset-0 truncate font-title tracking-[0.15em] text-white/85"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              {champion.name.toUpperCase()} <span className="text-white/40">· {champion.title}</span>
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {DECK.map((character, index) => (
            <button
              key={character.id}
              type="button"
              onClick={() => setFront(index)}
              aria-label={`Ver a ${character.name}`}
              aria-pressed={index === front}
              className="flex h-8 items-center px-1"
            >
              <motion.span
                className="block h-1 rounded-full"
                animate={{
                  width: index === front ? 22 : 8,
                  backgroundColor: index === front ? character.accentColor : 'rgba(255,255,255,0.25)',
                }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              />
            </button>
          ))}
        </span>
      </figcaption>
    </>
  );
}
