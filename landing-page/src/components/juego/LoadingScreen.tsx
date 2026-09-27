'use client';

import { useEffect, useState } from 'react';

const BG_IMAGES = [
  '/juego/loading_screen/argos.jpg',
  '/juego/loading_screen/manhattan.jpg',
  '/juego/loading_screen/nathan.jpg',
  '/juego/loading_screen/orfevre.jpg',
];

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'CARGANDO EL REINO...' }: LoadingScreenProps) {
  // Starts at 0 because this screen is server-rendered (hydration must match).
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % BG_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink" role="status" aria-live="polite">
      {BG_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${
            i === index ? 'juego-ken-burns opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(10,10,10,0.4)_50%,rgba(10,10,10,0.9)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center pb-10">
        <img
          src="/juego/logo.jpg"
          alt="Einherjar Blitz"
          className="mb-7 h-[150px] w-[150px] rounded-full border-2 border-gold/30 object-contain sm:mb-10 sm:h-[200px] sm:w-[200px]"
        />
        <div className="flex w-[70%] max-w-md flex-col items-center">
          <p className="mb-2.5 text-xs font-bold tracking-[0.2em] text-white/70">{message}</p>
          <div className="h-1 w-full overflow-hidden rounded-sm bg-white/10">
            <div className="juego-loading-bar h-full w-[38%] bg-gold shadow-[0_0_10px_rgba(201,170,113,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
