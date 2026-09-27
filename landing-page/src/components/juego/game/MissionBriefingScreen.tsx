'use client';

import { useEffect, useRef } from 'react';
import { Crown, Crosshair, ShieldAlert } from 'lucide-react';
import { getCharacterVisual } from '@/constants/characterAssets';

const ARENA = '/juego/game/arena-nordica.png';
const ARGOS_SPLASH = '/juego/game/argos/argos-splash.jpg';
const MINIMUM_BRIEFING_MS = 2600;

interface MissionBriefingScreenProps {
  onComplete: () => void;
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

export function MissionBriefingScreen({ onComplete }: MissionBriefingScreenProps) {
  const bossPortrait = getCharacterVisual('rey_escarlata')?.portrait;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    void Promise.all([preloadImage(ARGOS_SPLASH), preloadImage(ARENA)]).finally(() => {
      if (!active) return;
      const remaining = Math.max(0, MINIMUM_BRIEFING_MS - (Date.now() - startedAt));
      timer = setTimeout(() => onCompleteRef.current(), remaining);
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${ARENA})` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,8,0.72),rgba(5,5,5,0.94))]" />

      <div className="relative mx-auto flex h-full max-w-[1200px] flex-col px-5 py-3 sm:px-8">
        <div className="flex items-center justify-between border-b border-gold/25 pb-3">
          <div className="flex items-center gap-2">
            <Crown size={17} color="#c9aa71" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-gold">SENDA DEL EINHERJAR</span>
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/50">CAPÍTULO I · EL TRONO</span>
        </div>

        <div className="flex flex-1 items-center justify-between gap-6">
          <div className="juego-fade-up max-w-[520px]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/40 bg-red-950/50">
                <ShieldAlert size={17} color="#ef4444" />
              </span>
              <span className="text-[11px] font-bold tracking-[0.25em] text-red-400">MISIÓN ACTUAL</span>
            </div>
            <h1 className="font-title text-4xl leading-tight text-white/95 sm:text-5xl">
              Matar al
              <br />
              Rey Escarlata
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
              El monarca ha levantado el Trono Escarlata. Atravesá su guardia y derrotalo antes de que su segunda
              fase consuma la arena.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 border border-gold/30 bg-black/50 px-4 py-2.5">
              <Crosshair size={17} color="#c9aa71" />
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-white/50">OBJETIVO PRINCIPAL</p>
                <p className="text-sm font-bold text-white/95">Derrotar al Rey Escarlata · 0 / 1</p>
              </div>
            </div>
          </div>

          <div className="relative hidden flex-col items-center sm:flex">
            <span className="absolute top-8 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />
            {bossPortrait ? (
              <img src={bossPortrait} alt="" className="juego-float relative h-[min(46vh,300px)] w-[min(46vh,300px)] object-contain" />
            ) : (
              <Crown size={110} color="#ef4444" />
            )}
            <p className="relative text-[10px] font-bold tracking-[0.3em] text-red-400">OBJETIVO</p>
            <p className="relative font-title text-xl tracking-[0.15em] text-white/95">REY ESCARLATA</p>
          </div>
        </div>

        <div className="pb-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.25em] text-white/60">PREPARANDO CAMPO DE BATALLA</span>
            <button
              type="button"
              onClick={() => onCompleteRef.current()}
              className="px-2 py-1 text-[11px] font-bold tracking-[0.2em] text-gold hover:underline"
              aria-label="Omitir briefing de misión"
            >
              CONTINUAR
            </button>
          </div>
          <div className="h-1 overflow-hidden bg-white/10">
            <div
              className="h-full bg-gold"
              style={{ animation: `juego-briefing-progress ${MINIMUM_BRIEFING_MS}ms linear both` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
