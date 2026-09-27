'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SHOWCASE_HEROES } from '@/constants/showcase';

const ROTATE_MS = 7000;

/** Slow crossfade through the illustrated heroes. */
function HeroArt() {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SHOWCASE_HEROES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const hero = SHOWCASE_HEROES[index];

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={hero.portrait}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.04 }}
            animate={{ scale: 1 }}
            transition={{ duration: ROTATE_MS / 1000 + 1.4, ease: 'linear' }}
          >
            <Image
              src={hero.portrait}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: hero.focus }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a09] via-[#0b0a09]/30 to-[#0b0a09]/50 lg:bg-gradient-to-r lg:from-transparent lg:via-[#0b0a09]/10 lg:to-[#0b0a09]" />
      <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0b0a09]/90 via-transparent to-transparent lg:block" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={hero.character.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-10 left-10 hidden items-baseline gap-4 lg:flex"
        >
          <span className="font-title text-sm tracking-[0.25em] text-white/85">{hero.character.name.toUpperCase()}</span>
          <span className="text-sm text-white/45">{hero.character.title}</span>
        </motion.p>
      </AnimatePresence>
    </>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh bg-[#0b0a09] text-white">
      <aside className="absolute inset-x-0 top-0 h-56 overflow-hidden sm:h-72 lg:sticky lg:inset-auto lg:top-0 lg:h-dvh lg:self-start lg:w-[52%] lg:shrink-0" aria-hidden="true">
        <HeroArt />
      </aside>

      <main className="relative z-10 flex flex-1 flex-col px-6 pb-10 pt-6 sm:px-10">
        <Link href="/" className="flex w-fit items-center gap-3 text-white/80 transition-colors hover:text-white">
          <Image src="/assets/einherjer-logo.jpg" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-title text-[13px] tracking-[0.22em]">EINHERJAR BLITZ</span>
        </Link>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center pt-28 sm:pt-40 lg:pt-10">
          {children}
        </div>

        <p className="mx-auto mt-10 text-center text-xs text-white/35">
          <Link href="/" className="transition-colors hover:text-white/70">
            ← Volver a la página principal
          </Link>
        </p>
      </main>
    </div>
  );
}
