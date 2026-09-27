'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Film,
  Heart,
  ImageIcon,
  Shield,
  Sparkles,
  Sword,
} from 'lucide-react';
import { GAME_CHARACTERS } from '@/constants/battleData';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

const ARGOS_SPLASH = '/juego/game/argos/argos-splash.jpg';
const ARGOS_VIDEO = '/juego/game/argos/argos-splash.mp4';
const VIDEO_PREFERENCE_KEY = '@einherjar/game-character-video';

// The carousel is already data-driven, but only Argos is released for now.
const AVAILABLE_CHARACTER_IDS = ['argos'] as const;

/** Client-only (rendered behind the auth guard), so window is available. */
function readVideoPreference(): boolean {
  if (typeof window === 'undefined') return false;
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(VIDEO_PREFERENCE_KEY);
  } catch {
    // Storage unavailable — fall back to the motion preference.
  }
  if (saved === 'video') return true;
  if (saved === 'image') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface CharacterSelectProps {
  onSelectCharacter: (charId: string) => void;
  onCancel?: () => void;
}

export function CharacterSelect({ onSelectCharacter, onCancel }: CharacterSelectProps) {
  const { width, height } = useViewport();
  const compact = height < 410 || width < 760;
  const carouselRef = useRef<HTMLDivElement>(null);
  const characters = AVAILABLE_CHARACTER_IDS.map((id) => GAME_CHARACTERS[id]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(readVideoPreference);
  const selected = characters[selectedIndex];

  const toggleVideo = useCallback(() => {
    setVideoEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(VIDEO_PREFERENCE_KEY, next ? 'video' : 'image');
      } catch {
        // Preference just won't persist.
      }
      return next;
    });
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(index, characters.length - 1));
      setSelectedIndex(bounded);
      const el = carouselRef.current;
      el?.scrollTo({ left: bounded * el.clientWidth, behavior: 'smooth' });
    },
    [characters.length]
  );

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    setSelectedIndex(Math.max(0, Math.min(index, characters.length - 1)));
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#03070d] text-white">
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {characters.map((character, index) => (
          <ChampionSlide key={character.id} videoEnabled={videoEnabled && index === selectedIndex} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 px-3 py-2">
        <div className="pointer-events-auto flex min-h-[52px] items-center justify-between border-b border-gold/25">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-10 items-center gap-2 px-2 text-xs font-bold tracking-[0.2em] text-white/90 hover:text-white"
            aria-label="Salir de selección de personaje"
          >
            <ArrowLeft size={18} />
            SALIR
          </button>

          <div className="text-center">
            <p className="text-[9px] font-bold tracking-[0.25em] text-white/50">PREPARACIÓN DE MISIÓN</p>
            <p className="font-title text-base tracking-[0.15em] text-gold sm:text-lg">ELIGE TU EINHERJAR</p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={videoEnabled}
            onClick={toggleVideo}
            aria-label={videoEnabled ? 'Desactivar splash animado' : 'Activar splash animado'}
            className={cn(
              'flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold tracking-[0.15em] transition',
              videoEnabled ? 'border-gold bg-gold text-ink-deep' : 'border-gold/40 bg-black/50 text-gold'
            )}
          >
            {videoEnabled ? <Film size={16} /> : <ImageIcon size={16} />}
            <span className="hidden sm:inline">{videoEnabled ? 'ANIMACIÓN ON' : 'IMAGEN FIJA'}</span>
          </button>
        </div>

        <div className="absolute right-[18px] top-[70px] flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-[rgba(12,4,6,0.68)] px-3 py-2">
          <Crosshair size={16} color="#ef4444" />
          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] text-red-400">MISIÓN ACTUAL</p>
            <p className="text-xs font-bold text-white/95">Matar al Rey Escarlata</p>
          </div>
        </div>

        <ArrowButton side="left" disabled={selectedIndex === 0} onClick={() => selectIndex(selectedIndex - 1)} />
        <ArrowButton
          side="right"
          disabled={selectedIndex === characters.length - 1}
          onClick={() => selectIndex(selectedIndex + 1)}
        />

        <div
          className={cn(
            'absolute left-[34px] w-[min(500px,calc(100%-68px))] md:w-[42%]',
            compact ? 'bottom-[150px] md:bottom-[90px]' : 'bottom-[90px]'
          )}
        >
          <p className="text-[10px] font-bold tracking-[0.25em] text-gold/80">
            CAMPEÓN {String(selectedIndex + 1).padStart(2, '0')} / {String(characters.length).padStart(2, '0')}
          </p>
          <h1 className={cn('font-title tracking-wide text-white/95', compact ? 'text-4xl' : 'text-6xl')}>
            {selected.name}
          </h1>
          <p className="text-sm font-medium text-gold">{selected.title}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Stat icon={<Heart size={14} color="#c9aa71" />} label="VIDA" value={`${selected.maxHealth}`} />
            <Stat
              icon={<Sword size={14} color="#c9aa71" />}
              label="ATAQUE"
              value={`${selected.attack.minDamage}–${selected.attack.maxDamage}`}
            />
            <Stat icon={<Shield size={14} color="#c9aa71" />} label="DEFENSA" value={`${selected.defense.reduction}`} />
          </div>

          {!compact && (
            <div className="mt-3 flex gap-2.5 border-l-2 border-gold/60 bg-black/40 px-3 py-2">
              <Sparkles size={15} color="#c9aa71" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-white/50">HABILIDAD ESPECIAL</p>
                <p className="text-sm font-bold text-white/95">{selected.specialAbility.name}</p>
                <p className="line-clamp-2 text-xs text-white/60">{selected.specialAbility.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-auto absolute bottom-2.5 left-[34px] flex flex-col items-start md:left-1/2 md:-translate-x-[92px] md:items-center">
          <p className="mb-1 text-[9px] font-bold tracking-[0.25em] text-white/50">ROSTER DISPONIBLE</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Campeones">
            {characters.map((character, index) => (
              <button
                key={character.id}
                type="button"
                role="radio"
                aria-checked={index === selectedIndex}
                onClick={() => selectIndex(index)}
                aria-label={`Seleccionar a ${character.name}`}
                className={cn(
                  'relative h-14 w-20 overflow-hidden rounded-lg border-2 transition',
                  index === selectedIndex ? 'border-gold' : 'border-white/20 opacity-70 hover:opacity-100'
                )}
              >
                <img src={ARGOS_SPLASH} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-0.5 left-1 text-[10px] font-bold text-white">{character.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectCharacter(selected.id)}
          aria-label={`Entrar al trono con ${selected.name}`}
          className="pointer-events-auto absolute bottom-3.5 right-7 flex min-h-[54px] min-w-[196px] items-center justify-between gap-4 rounded-xl bg-gold px-[18px] text-left text-ink-deep transition hover:brightness-110"
          autoFocus
        >
          <span>
            <span className="block text-[9px] font-bold tracking-[0.2em] opacity-70">CAMPEÓN CONFIRMADO</span>
            <span className="block font-title text-base font-bold tracking-[0.12em]">ENTRAR AL TRONO</span>
          </span>
          <ChevronRight size={23} />
        </button>
      </div>
    </div>
  );
}

function ChampionSlide({ videoEnabled }: { videoEnabled: boolean }) {
  return (
    <div className="relative h-full w-full shrink-0 snap-center">
      <div className="absolute inset-y-0 right-0 w-full overflow-hidden md:w-[75%]">
        <img src={ARGOS_SPLASH} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {videoEnabled && <SplashVideo />}
        <span className="absolute inset-y-0 left-0 hidden w-[180px] bg-[linear-gradient(90deg,#03070d,rgba(3,7,13,0))] md:block" />
      </div>
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,8,14,0.92)_0%,rgba(3,8,14,0.2)_28%,rgba(3,8,14,0.08)_62%,rgba(3,8,14,0.82)_100%)]" />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,5,9,0.72)_0%,transparent_47%,rgba(2,5,9,0.9)_100%)]" />
    </div>
  );
}

/** Fades in once the first frame plays so the still image never flashes. */
function SplashVideo() {
  const [ready, setReady] = useState(false);
  return (
    <video
      src={ARGOS_VIDEO}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0')}
      autoPlay
      loop
      muted
      playsInline
      onPlaying={() => setReady(true)}
    />
  );
}

function ArrowButton({ side, disabled, onClick }: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Personaje anterior' : 'Personaje siguiente'}
      className={cn(
        'pointer-events-auto absolute top-[43%] flex h-[58px] w-11 items-center justify-center rounded-xl border border-gold/30 bg-[rgba(3,7,13,0.66)] transition hover:border-gold/60 disabled:opacity-30',
        side === 'left' ? 'left-3' : 'right-3'
      )}
    >
      {side === 'left' ? <ChevronLeft size={25} color="#c9aa71" /> : <ChevronRight size={25} color="#c9aa71" />}
    </button>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gold/20 bg-black/50 px-3 py-1.5">
      {icon}
      <div>
        <p className="text-[8px] font-bold tracking-[0.2em] text-white/50">{label}</p>
        <p className="text-sm font-bold text-white/95">{value}</p>
      </div>
    </div>
  );
}
