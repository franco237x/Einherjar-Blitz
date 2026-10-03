'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Coins, Download, FlaskConical, Lock, Play, Swords } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PLANT_ALMANAC, ZOMBIE_ALMANAC } from '@/lib/jardin/almanac';
import {
  LEVELS,
  MAX_LOADOUT,
  PLANT_ORDER,
  PLANTS,
  ZOMBIE_ORDER,
  ZOMBIES,
  type LevelDef,
  type PlantKind,
  type ZombieKind,
} from '@/lib/jardin/engine';
import { BACKGROUND_URL, PLANT_CLIPS, ZOMBIE_CLIPS, spriteUrl } from '@/lib/jardin/sprites';
import { AnimatedSprite } from './AnimatedSprite';
import { BetaBadge, JardinGame, enterFullscreen, type LevelResult } from './JardinSandbox';
import { SeedPacket } from './SeedPacket';
import { fetchProgress, finishLevel, issueVoucher, startLevel, type JardinProgress } from './jardinApi';
import { VoucherView } from './VoucherView';
import type { AgroVoucher } from '@/lib/agroGame';

type Screen =
  | { name: 'menu' }
  | { name: 'levels' }
  | { name: 'loadout'; level: LevelDef }
  | { name: 'game'; level: LevelDef; loadout: PlantKind[]; runId: string; seed: string; round: number }
  | { name: 'sandbox'; round: number }
  | { name: 'almanac' }
  | { name: 'coins' };

const LOADOUT_KEY = 'jardin-loadout';
const coins = (value: number) => value.toLocaleString('es-AR');
const LOGIN_URL = '/juego/login?next=%2Fevento%2Fjardin';

function readSavedLoadout(): PlantKind[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LOADOUT_KEY) ?? '[]');
    if (Array.isArray(saved)) return saved.filter((kind) => kind in PLANTS).slice(0, MAX_LOADOUT);
  } catch {
    // Private mode or blocked storage: start empty.
  }
  return [];
}

function levelZombies(level: LevelDef): ZombieKind[] {
  const kinds = new Set(level.waves.flatMap((wave) => wave.zombies));
  return ZOMBIE_ORDER.filter((kind) => kinds.has(kind));
}

const fullscreenOnTouch = () => {
  if (window.matchMedia('(pointer: coarse)').matches) enterFullscreen();
};

// ─── Shared look ────────────────────────────────────────────────────────────
function Backdrop({ children }: { children: ReactNode }) {
  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#0b130d] text-white">
      <img src={BACKGROUND_URL} alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-60" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,20,8,0.15)_0%,rgba(6,12,6,0.82)_100%)]" />
      <div className="relative flex min-h-full flex-col">{children}</div>
    </main>
  );
}

function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-3 pt-3 short:pt-2" style={{ paddingLeft: 'max(12px, env(safe-area-inset-left))' }}>
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#f5d68a]/70 bg-gradient-to-b from-[#5b3b1d] to-[#2f1d0d] shadow-[0_3px_0_rgba(0,0,0,0.45)] active:translate-y-0.5"
        aria-label="Volver"
      >
        <ArrowLeft size={20} aria-hidden />
      </button>
      <h1 className="font-title text-2xl font-bold text-amber-100 [text-shadow:0_3px_0_#000] short:text-xl">{title}</h1>
      <div className="ml-auto">{right}</div>
    </header>
  );
}

function WoodButton({
  children,
  onClick,
  variant = 'wood',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'green' | 'wood';
  disabled?: boolean;
  className?: string;
}) {
  const look =
    variant === 'green'
      ? 'border-[#24480f] bg-gradient-to-b from-[#9be05a] to-[#3f8a1f] text-white'
      : 'border-[#2a1c0c] bg-gradient-to-b from-[#7a5230] to-[#3b2512] text-amber-50';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-2xl border-[3px] px-5 py-3 font-title text-lg font-bold shadow-[0_4px_0_rgba(0,0,0,0.5)] transition [text-shadow:0_2px_0_rgba(0,0,0,0.5)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 short:py-2 ${look} ${className}`}
    >
      {children}
    </button>
  );
}

function CoinPill({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#f5d68a]/70 bg-[#1e1408]/90 px-3 py-1 font-black tabular-nums text-amber-200">
      <span aria-hidden>🪙</span>
      {coins(value)}
    </span>
  );
}

// ─── Event shell ────────────────────────────────────────────────────────────
export function JardinEvent() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [progress, setProgress] = useState<JardinProgress | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchProgress(user)
      .then((value) => !cancelled && setProgress(value))
      .catch((error) => !cancelled && setProgressError(error instanceof Error ? error.message : 'No pudimos cargar tu progreso.'));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const launch = useCallback(
    async (level: LevelDef, loadout: PlantKind[], round: number) => {
      if (!user) return;
      setStarting(true);
      setStartError(null);
      try {
        const { runId, seed } = await startLevel(user, level.id, loadout);
        setScreen({ name: 'game', level, loadout, runId, seed, round });
      } catch (error) {
        setStartError(error instanceof Error ? error.message : 'No se pudo iniciar el nivel.');
      } finally {
        setStarting(false);
      }
    },
    [user],
  );

  switch (screen.name) {
    case 'game':
      return (
        <JardinGame
          key={`${screen.runId}-${screen.round}`}
          mode="waves"
          level={screen.level}
          loadout={screen.loadout}
          seed={screen.seed}
          onExit={() => setScreen({ name: 'levels' })}
          onRestart={() => void launch(screen.level, screen.loadout, screen.round + 1)}
          onLevelEnd={async (outcome, log): Promise<LevelResult> => {
            if (!user) throw new Error('Inicia sesión para guardar el resultado.');
            const result = await finishLevel(user, screen.runId, log);
            setProgress(result.progress);
            return { reward: result.reward, firstClear: result.firstClear, note: result.note };
          }}
        />
      );
    case 'sandbox':
      return (
        <JardinGame
          key={`sandbox-${screen.round}`}
          mode="sandbox"
          onExit={() => setScreen({ name: 'menu' })}
          onRestart={() => setScreen({ name: 'sandbox', round: screen.round + 1 })}
        />
      );
    case 'levels':
      return (
        <LevelSelect
          progress={progress}
          signedIn={!!user}
          onBack={() => setScreen({ name: 'menu' })}
          onPick={(level) => setScreen({ name: 'loadout', level })}
        />
      );
    case 'loadout':
      return (
        <LoadoutSelect
          level={screen.level}
          starting={starting}
          error={startError}
          onBack={() => {
            setStartError(null);
            setScreen({ name: 'levels' });
          }}
          onStart={(loadout) => {
            fullscreenOnTouch();
            void launch(screen.level, loadout, 0);
          }}
        />
      );
    case 'almanac':
      return <Almanac onBack={() => setScreen({ name: 'menu' })} />;
    case 'coins':
      return (
        <CoinsScreen
          progress={progress}
          onProgress={setProgress}
          signedIn={!!user}
          onBack={() => setScreen({ name: 'menu' })}
          issue={(name) => {
            if (!user) throw new Error('Inicia sesión.');
            return issueVoucher(user, name);
          }}
        />
      );
    default:
      return (
        <MainMenu
          loading={loading}
          signedIn={!!user}
          name={user?.displayName ?? user?.email ?? null}
          progress={progress}
          progressError={progressError}
          onPlay={() => setScreen({ name: 'levels' })}
          onAlmanac={() => setScreen({ name: 'almanac' })}
          onCoins={() => setScreen({ name: 'coins' })}
          onSandbox={() => {
            fullscreenOnTouch();
            setScreen({ name: 'sandbox', round: 0 });
          }}
        />
      );
  }
}

// ─── Main menu ──────────────────────────────────────────────────────────────
function MainMenu({
  loading,
  signedIn,
  name,
  progress,
  progressError,
  onPlay,
  onAlmanac,
  onCoins,
  onSandbox,
}: {
  loading: boolean;
  signedIn: boolean;
  name: string | null;
  progress: JardinProgress | null;
  progressError: string | null;
  onPlay: () => void;
  onAlmanac: () => void;
  onCoins: () => void;
  onSandbox: () => void;
}) {
  const cleared = progress ? Object.keys(progress.completed).length : 0;
  return (
    <Backdrop>
      <div className="m-auto grid w-full max-w-5xl items-center gap-4 p-4 md:grid-cols-[1fr_auto_1fr] short:grid-cols-[1fr_auto_1fr] short:gap-2 short:p-2">
        <div className="hidden justify-center md:flex short:flex" aria-hidden>
          <AnimatedSprite url={spriteUrl('nabu', 'idle')} frames={PLANT_CLIPS.nabu.idle!.frames} size={190} className="short:!h-32 short:!w-32" />
        </div>

        <section className="mx-auto w-full max-w-sm text-center">
          <p className="flex justify-center">
            <BetaBadge />
          </p>
          <h1 className="mt-2 font-title text-5xl font-bold leading-none text-amber-200 [text-shadow:0_4px_0_#3b2512,0_8px_18px_rgba(0,0,0,0.8)] short:text-4xl">
            Jardín de
            <br />
            Yggdrasil
          </h1>
          <p className="mt-2 text-sm text-white/80 [text-shadow:0_2px_4px_#000] short:hidden">
            Defiende el claro de los zombis, supera los niveles y gana monedas del evento.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 short:mt-3 short:gap-1.5">
            <WoodButton variant="green" onClick={onPlay} className="py-4 text-2xl short:py-2 short:text-xl">
              <Play size={24} aria-hidden /> Jugar
            </WoodButton>
            <div className="grid grid-cols-2 gap-2.5 short:gap-1.5">
              <WoodButton onClick={onAlmanac} className="text-base">
                <BookOpen size={18} aria-hidden /> Almanaque
              </WoodButton>
              <WoodButton onClick={onCoins} className="text-base">
                <Coins size={18} aria-hidden /> Monedas
              </WoodButton>
            </div>
            <WoodButton onClick={onSandbox} className="text-sm opacity-90">
              <FlaskConical size={16} aria-hidden /> Práctica libre (sandbox)
            </WoodButton>
          </div>

          <div className="mt-4 text-xs text-white/75 [text-shadow:0_1px_3px_#000] short:mt-2">
            {loading ? (
              <p>Cargando tu sesión…</p>
            ) : signedIn ? (
              <p className="flex flex-wrap items-center justify-center gap-2">
                <span>{name}</span>
                {progress && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      Niveles {cleared}/{LEVELS.length}
                    </span>
                    <CoinPill value={progress.coins} />
                  </>
                )}
                {progressError && <span className="text-red-300">{progressError}</span>}
              </p>
            ) : (
              <p>
                <Link href={LOGIN_URL} className="font-bold text-amber-200 underline">
                  Inicia sesión
                </Link>{' '}
                para jugar los niveles y ganar monedas.
              </p>
            )}
            <Link href="/juego" className="mt-2 inline-flex items-center gap-1 text-white/60 underline short:mt-1">
              <ArrowLeft size={12} aria-hidden /> Volver al portal
            </Link>
          </div>
        </section>

        <div className="hidden justify-center md:flex short:flex" aria-hidden>
          <AnimatedSprite url={spriteUrl('conero', 'walk')} frames={ZOMBIE_CLIPS.conero.walk!.frames} size={190} className="short:!h-32 short:!w-32" />
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Level select ───────────────────────────────────────────────────────────
function LevelSelect({
  progress,
  signedIn,
  onBack,
  onPick,
}: {
  progress: JardinProgress | null;
  signedIn: boolean;
  onBack: () => void;
  onPick: (level: LevelDef) => void;
}) {
  const unlocked = progress?.unlocked ?? 1;
  return (
    <Backdrop>
      <ScreenHeader title="Niveles" onBack={onBack} right={progress && <CoinPill value={progress.coins} />} />
      {!signedIn && (
        <p className="mx-3 mt-2 rounded-xl bg-black/60 px-3 py-2 text-center text-sm">
          <Link href={LOGIN_URL} className="font-bold text-amber-200 underline">
            Inicia sesión
          </Link>{' '}
          para jugar los niveles: tus victorias y monedas se guardan en tu cuenta.
        </p>
      )}
      <div className="m-auto flex w-full max-w-5xl snap-x justify-center-safe gap-4 overflow-x-auto p-4 md:flex-wrap short:flex-nowrap short:gap-3 short:p-3">
        {LEVELS.map((level) => {
          const done = !!progress?.completed[level.id];
          const locked = level.id > unlocked;
          return (
            <button
              key={level.id}
              type="button"
              disabled={locked || !signedIn}
              onClick={() => onPick(level)}
              className="relative flex w-[260px] shrink-0 snap-center flex-col rounded-3xl border-4 border-[#5b3b1d] bg-gradient-to-b from-[#f7eed2] to-[#e0cd9a] p-4 text-left text-[#3a2612] shadow-[0_6px_0_rgba(0,0,0,0.45)] transition enabled:hover:-translate-y-1 disabled:cursor-not-allowed short:w-[230px] short:p-3"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#5b3b1d] bg-gradient-to-b from-[#9be05a] to-[#3f8a1f] font-title text-xl font-bold text-white [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
                  {level.id}
                </span>
                <span className="font-title text-lg font-bold leading-tight">{level.name}</span>
              </span>
              <span className="mt-2 text-xs leading-snug text-[#5a4228] short:line-clamp-2">{level.description}</span>
              <span className="mt-3 flex items-center gap-1" aria-label="Zombis del nivel">
                {levelZombies(level).map((kind) => (
                  <img key={kind} src={spriteUrl(kind, 'portrait')} alt={ZOMBIES[kind].name} title={ZOMBIES[kind].name} className="h-9 w-9 object-contain" />
                ))}
                <span className="ml-auto text-[11px] font-bold">{level.waves.length} oleadas</span>
              </span>
              <span className="mt-3 flex items-center justify-between border-t border-[#5b3b1d]/30 pt-2 text-sm font-bold">
                <span>
                  🪙 {coins(level.reward)} {done && <span className="text-[11px] font-normal text-[#5a4228]">(cobrado)</span>}
                </span>
                <span className={done ? 'text-[#2f7a14]' : locked ? 'text-[#7a5a3a]' : 'text-[#3a2612]'}>
                  {done ? '✔ Superado' : locked ? 'Bloqueado' : 'Disponible'}
                </span>
              </span>
              {locked && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[20px] bg-[#1d1309]/70 text-amber-100 backdrop-blur-[3px]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#e8c873] bg-[#3a2612] shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                    <Lock size={26} aria-hidden />
                  </span>
                  <span className="rounded-full bg-[#3a2612] px-3 py-1 text-xs font-bold">Supera el nivel {level.id - 1}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Backdrop>
  );
}

// ─── Loadout ────────────────────────────────────────────────────────────────
function LoadoutSelect({
  level,
  starting,
  error,
  onBack,
  onStart,
}: {
  level: LevelDef;
  starting: boolean;
  error: string | null;
  onBack: () => void;
  onStart: (loadout: PlantKind[]) => void;
}) {
  const [chosen, setChosen] = useState<PlantKind[]>(readSavedLoadout);
  const [focus, setFocus] = useState<PlantKind>(chosen[0] ?? 'solmiel');
  const toggle = (kind: PlantKind) => {
    setFocus(kind);
    setChosen((current) =>
      current.includes(kind) ? current.filter((item) => item !== kind) : current.length < MAX_LOADOUT ? [...current, kind] : current,
    );
  };
  const start = () => {
    try {
      localStorage.setItem(LOADOUT_KEY, JSON.stringify(chosen));
    } catch {
      // Storage blocked: the choice simply is not remembered.
    }
    onStart(chosen);
  };
  return (
    <Backdrop>
      <ScreenHeader title={`Nivel ${level.id} · ${level.name}`} onBack={onBack} />
      <div className="m-auto grid w-full max-w-5xl gap-4 p-4 md:grid-cols-[1fr_260px] short:grid-cols-[1fr_220px] short:gap-3 short:p-3">
        <section className="rounded-3xl border-4 border-[#5b3b1d] bg-[#2a1c0c]/85 p-3">
          <p className="font-title text-lg text-amber-100">
            Elige hasta {MAX_LOADOUT} plantas{' '}
            <span className="text-sm text-white/70">
              ({chosen.length}/{MAX_LOADOUT})
            </span>
          </p>
          <div className="mt-2 grid grid-cols-6 gap-1.5" aria-label="Plantas elegidas">
            {Array.from({ length: MAX_LOADOUT }, (_, index) => {
              const kind = chosen[index];
              return kind ? (
                <SeedPacket
                  key={kind}
                  kind={kind}
                  label={`Quitar ${PLANTS[kind].name}`}
                  cost={PLANTS[kind].cost}
                  size="sm"
                  className="h-14 short:h-11"
                  onClick={() => toggle(kind)}
                />
              ) : (
                <span key={index} className="h-14 rounded-[6px] border-2 border-dashed border-amber-100/30 bg-black/30 short:h-11" />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5 border-t border-amber-100/15 pt-3" aria-label="Plantas disponibles">
            {PLANT_ORDER.map((kind) => (
              <SeedPacket
                key={kind}
                kind={kind}
                label={`${PLANTS[kind].name}, ${PLANTS[kind].cost} de sol`}
                cost={PLANTS[kind].cost}
                dimmed={chosen.includes(kind)}
                ariaPressed={chosen.includes(kind)}
                selected={focus === kind}
                size="sm"
                className="h-14 short:h-11"
                onClick={() => toggle(kind)}
              />
            ))}
          </div>
          <p className="mt-2 min-h-[2.5em] text-xs text-white/80 short:text-[11px]">
            <b className="text-amber-200">{PLANTS[focus].name}</b> · {PLANT_ALMANAC[focus].tagline}. {PLANTS[focus].role}.
          </p>
        </section>

        <aside className="flex flex-col gap-3 rounded-3xl border-4 border-[#5b3b1d] bg-gradient-to-b from-[#f7eed2] to-[#e0cd9a] p-3 text-[#3a2612]">
          <p className="font-title text-base font-bold">Zombis en este nivel</p>
          <div className="flex justify-around">
            {levelZombies(level).map((kind) => (
              <span key={kind} className="flex flex-col items-center text-[11px] font-bold">
                <img src={spriteUrl(kind, 'portrait')} alt="" className="h-14 w-14 object-contain short:h-10 short:w-10" />
                {ZOMBIES[kind].name}
              </span>
            ))}
          </div>
          <p className="text-xs">
            Sol inicial: <b>{level.startingSun}</b> · Recompensa: <b>🪙 {coins(level.reward)}</b>
          </p>
          {error && (
            <p className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-700" role="alert">
              {error}
            </p>
          )}
          <WoodButton variant="green" onClick={start} disabled={!chosen.length || starting} className="mt-auto whitespace-nowrap short:text-base">
            <Swords size={20} aria-hidden /> {starting ? 'Preparando…' : '¡A defender!'}
          </WoodButton>
        </aside>
      </div>
    </Backdrop>
  );
}

// ─── Almanac ────────────────────────────────────────────────────────────────
function Almanac({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'plants' | 'zombies'>('plants');
  const [plant, setPlant] = useState<PlantKind>('solmiel');
  const [zombie, setZombie] = useState<ZombieKind>('despistado');
  const entry = tab === 'plants' ? PLANT_ALMANAC[plant] : ZOMBIE_ALMANAC[zombie];
  const sprite =
    tab === 'plants'
      ? { url: spriteUrl(plant, 'idle'), frames: PLANT_CLIPS[plant].idle!.frames }
      : { url: spriteUrl(zombie, 'walk'), frames: ZOMBIE_CLIPS[zombie].walk!.frames };
  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 font-title text-sm font-bold ${active ? 'bg-amber-300 text-[#2a1c0c]' : 'bg-black/50 text-amber-100'}`;
  return (
    <Backdrop>
      <ScreenHeader
        title="Almanaque"
        onBack={onBack}
        right={
          <div className="flex gap-1.5" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'plants'} className={tabClass(tab === 'plants')} onClick={() => setTab('plants')}>
              Plantas
            </button>
            <button type="button" role="tab" aria-selected={tab === 'zombies'} className={tabClass(tab === 'zombies')} onClick={() => setTab('zombies')}>
              Zombis
            </button>
          </div>
        }
      />
      <div className="m-auto grid w-full max-w-5xl gap-4 p-4 md:grid-cols-[1fr_1.1fr] short:grid-cols-[1fr_1.1fr] short:gap-3 short:p-3">
        <section className="grid content-start grid-cols-4 gap-2 rounded-3xl border-4 border-[#5b3b1d] bg-[#2a1c0c]/85 p-3">
          {tab === 'plants'
            ? PLANT_ORDER.map((kind) => (
                <SeedPacket
                  key={kind}
                  kind={kind}
                  label={PLANTS[kind].name}
                  cost={PLANTS[kind].cost}
                  selected={plant === kind}
                  className="h-16 short:h-12"
                  onClick={() => setPlant(kind)}
                />
              ))
            : ZOMBIE_ORDER.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setZombie(kind)}
                  aria-pressed={zombie === kind}
                  className={`flex h-20 flex-col items-center justify-end rounded-xl border-2 bg-gradient-to-b from-[#6b7d5c] to-[#38432f] pb-1 text-[10px] font-bold short:h-16 ${
                    zombie === kind ? 'border-amber-300 ring-2 ring-amber-300' : 'border-[#2a1c0c]'
                  }`}
                >
                  <img src={spriteUrl(kind, 'portrait')} alt="" className="h-14 w-14 object-contain short:h-10 short:w-10" />
                  {ZOMBIES[kind].name}
                </button>
              ))}
        </section>
        <article className="flex gap-3 rounded-3xl border-4 border-[#5b3b1d] bg-gradient-to-b from-[#f7eed2] to-[#e0cd9a] p-4 text-[#3a2612] short:p-3">
          <div className="flex w-[150px] shrink-0 items-end justify-center rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#effcdc_0%,#b5df8a_55%,#6fa84b_100%)] short:w-[110px]">
            <AnimatedSprite url={sprite.url} frames={sprite.frames} size={150} className="short:!h-[110px] short:!w-[110px]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-title text-2xl font-bold leading-tight short:text-xl">{entry.title}</h2>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a5a3a]">{entry.tagline}</p>
            <p className="mt-2 text-sm leading-snug short:text-xs">{entry.description}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {entry.stats.map((stat) => (
                <div key={stat.label} className="contents">
                  <dt className="font-bold text-[#7a5a3a]">{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      </div>
    </Backdrop>
  );
}

// ─── Coins & vouchers ───────────────────────────────────────────────────────
function CoinsScreen({
  progress,
  onProgress,
  signedIn,
  onBack,
  issue,
}: {
  progress: JardinProgress | null;
  onProgress: (progress: JardinProgress) => void;
  signedIn: boolean;
  onBack: () => void;
  issue: (name: string) => Promise<{ voucher: AgroVoucher; progress: JardinProgress }>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openVoucher, setOpenVoucher] = useState<AgroVoucher | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await issue(name);
      onProgress(result.progress);
      setMessage('¡Vale emitido! Preséntalo en el grupo de Messenger.');
      setOpenVoucher(result.voucher);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo emitir el vale.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Backdrop>
      <ScreenHeader title="Monedas y vales" onBack={onBack} />
      <div className="m-auto grid w-full max-w-4xl gap-4 p-4 md:grid-cols-2 short:grid-cols-2 short:gap-3 short:p-3">
        {!signedIn ? (
          <p className="rounded-3xl bg-black/70 p-4 text-center text-sm md:col-span-2 short:col-span-2">
            <Link href={LOGIN_URL} className="font-bold text-amber-200 underline">
              Inicia sesión
            </Link>{' '}
            para ver tus monedas del evento.
          </p>
        ) : !progress ? (
          <p className="text-center text-sm md:col-span-2">Cargando tus monedas…</p>
        ) : (
          <>
            <section className="rounded-3xl border-4 border-[#5b3b1d] bg-gradient-to-b from-[#f7eed2] to-[#e0cd9a] p-4 text-[#3a2612]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a5a3a]">Saldo para retirar</p>
              <p className="font-title text-5xl font-bold short:text-4xl">🪙 {coins(progress.coins)}</p>
              <p className="mt-1 text-xs">
                Ganadas en total: <b>{coins(progress.totalEarned)}</b> de {coins(LEVELS.reduce((sum, level) => sum + level.reward, 0))}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {LEVELS.map((level) => (
                  <li key={level.id} className="flex justify-between border-b border-[#5b3b1d]/20 pb-1">
                    <span>
                      {level.id}. {level.name}
                    </span>
                    <span className="font-bold">{progress.completed[level.id] ? `✔ ${coins(level.reward)}` : `— / ${coins(level.reward)}`}</span>
                  </li>
                ))}
              </ul>
              <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-bold" htmlFor="jardin-name">
                  Tu nombre como aparece en el grupo
                </label>
                <input
                  id="jardin-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  className="rounded-lg border-2 border-[#5b3b1d] bg-white px-3 py-2 text-[#2a1c0c]"
                  placeholder="Nombre en Messenger"
                />
                <WoodButton variant="green" disabled={busy || progress.coins <= 0 || name.trim().length < 2} className="text-base">
                  {busy ? 'Emitiendo…' : `Retirar 🪙 ${coins(progress.coins)} en un vale`}
                </WoodButton>
                {message && <p className="text-xs">{message}</p>}
              </form>
            </section>
            <section className="rounded-3xl border-4 border-[#5b3b1d] bg-[#2a1c0c]/85 p-4">
              <p className="font-title text-lg text-amber-100">Mis vales</p>
              {progress.vouchers.length === 0 ? (
                <p className="mt-2 text-sm text-white/70">Todavía no emitiste vales. Gana niveles y retira tus monedas.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {[...progress.vouchers].reverse().map((voucher) => (
                    <li key={voucher.id} className="flex items-center gap-2 rounded-xl bg-black/40 p-2 text-xs">
                      <span className="min-w-0 flex-1">
                        <b className="text-amber-200">🪙 {coins(voucher.amount)}</b>{' '}
                        <span className={voucher.redeemedAt ? 'text-lime-300' : 'text-white/70'}>
                          {voucher.redeemedAt ? '· Canjeado' : '· Pendiente de canje'}
                        </span>
                        <span className="block truncate text-white/50">{voucher.id}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenVoucher(voucher)}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-300 px-2 py-1 font-bold text-[#2a1c0c]"
                      >
                        <Download size={14} aria-hidden /> Ver vale
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] leading-snug text-white/60">
                Presenta el PDF, una captura del vale o su folio en el grupo de Messenger. El administrador consulta el folio y
                acredita las monedas una sola vez.
              </p>
            </section>
          </>
        )}
      </div>
      {openVoucher && <VoucherView voucher={openVoucher} onClose={() => setOpenVoucher(null)} />}
    </Backdrop>
  );
}
