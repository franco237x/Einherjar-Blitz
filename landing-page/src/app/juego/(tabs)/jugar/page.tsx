'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Background } from '@/components/juego/Background';
import { Icon } from '@/components/juego/Icon';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Play tab — launcher for the game module. The battle experience lives in
 * /juego/combate, which hides the tab bar and uses the whole viewport.
 */
export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
    if (!FEATURE_FLAGS.game) router.replace('/juego');
  }, [router]);

  if (!FEATURE_FLAGS.game) return null;

  return (
    <Background>
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pb-28 text-center">
        <span className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-gold/40 bg-gold/10 shadow-[0_0_40px_rgba(201,170,113,0.2)]">
          <Icon name="game-controller" size={64} color="#c9aa71" />
        </span>
        <h1 className="font-title text-3xl tracking-[0.15em] text-gold">MODO COMBATE</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
          Enfrenta al Rey Escarlata con tu campeón.
          <br />
          Se juega mejor con la pantalla en horizontal.
        </p>
        <Link
          href="/juego/combate"
          className="mt-8 flex min-h-[52px] items-center gap-3 rounded-full bg-gold px-8 text-sm font-bold tracking-[0.15em] text-ink-deep transition hover:brightness-110"
        >
          <Icon name="game-controller" size={22} />
          ENTRAR AL COMBATE
        </Link>
      </main>
    </Background>
  );
}
