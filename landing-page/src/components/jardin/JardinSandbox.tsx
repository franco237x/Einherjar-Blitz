'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Maximize, Minimize, Pause, Play, Shovel, SlidersHorizontal } from 'lucide-react';
import {
  PLANT_ORDER,
  PLANTS,
  TICKS_PER_SECOND,
  ZOMBIE_ORDER,
  ZOMBIES,
  canPlace,
  cooldownProgress,
  createGame,
  isAlive,
  plantAt,
  step,
  waveProgress,
  type Command,
  type GameMode,
  type LevelDef,
  type LoggedCommand,
  type JardinState,
  type PlantKind,
  type SandboxOptions,
  type ZombieKind,
} from '@/lib/jardin/engine';
import { criticalUrls, deferredUrls, plantSpriteUrls, spriteUrl } from '@/lib/jardin/sprites';
import { cellAt, computeViewport, drawScene, sunAt, type Hover, type Images, type Viewport } from './render';

type Tool = PlantKind | 'shovel' | null;
const TICK_SECONDS = 1 / TICKS_PER_SECOND;
const PLANT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function randomSeed() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Loads sprites into a shared map. The critical set gates the board; the rest
 * streams in the background (and on demand when a seed packet is picked), with
 * portraits drawn in place of any atlas that has not arrived yet.
 */
function useSprites() {
  const imagesRef = useRef<Images>(new Map());
  const requested = useRef(new Set<string>());
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback((url: string) => {
    if (requested.current.has(url)) return Promise.resolve();
    requested.current.add(url);
    return new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        imagesRef.current.set(url, image);
        resolve();
      };
      image.onerror = () => {
        requested.current.delete(url);
        reject(new Error(url));
      };
      image.src = url;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const critical = criticalUrls();
    let done = 0;
    Promise.all(
      critical.map((url) =>
        load(url).then(() => {
          done++;
          if (!cancelled) setProgress(done / critical.length);
        }),
      ),
    )
      .then(async () => {
        if (cancelled) return;
        setReady(true);
        // Stream the rest a few at a time so the first plays stay smooth.
        const rest = deferredUrls();
        for (let i = 0; i < rest.length && !cancelled; i += 4)
          await Promise.allSettled(rest.slice(i, i + 4).map(load));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { imagesRef, load, progress, ready, failed };
}

interface Hud {
  sun: number;
  cooldowns: Record<PlantKind, number>;
  placeable: Record<PlantKind, boolean>;
  killed: number;
  breaches: number;
  mowersUsed: number;
  zombies: number;
  seconds: number;
  progress: number;
  wave: number;
  announcement: string | null;
  outcome: JardinState['outcome'];
}

function readHud(state: JardinState): Hud {
  const cooldowns = {} as Record<PlantKind, number>;
  const placeable = {} as Record<PlantKind, boolean>;
  for (const kind of PLANT_ORDER) {
    cooldowns[kind] = cooldownProgress(state, kind);
    placeable[kind] = (state.options.infiniteSun || state.sun >= PLANTS[kind].cost) && cooldowns[kind] === 0;
  }
  const announcement =
    state.announcement && state.tick - state.announcement.tick < 3 * TICKS_PER_SECOND ? state.announcement.text : null;
  return {
    sun: state.sun,
    cooldowns,
    placeable,
    killed: state.stats.killed,
    breaches: state.stats.breaches,
    mowersUsed: state.stats.mowersUsed,
    zombies: state.zombies.filter(isAlive).length,
    seconds: Math.floor(state.tick / TICKS_PER_SECOND),
    progress: waveProgress(state),
    wave: state.waves.index,
    announcement,
    outcome: state.outcome,
  };
}

const COMPACT_QUERY = '(max-height: 520px) and (orientation: landscape)';

/** Phones in landscape: too short for a top bar of seed packets. */
function useCompactLayout() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(COMPACT_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
}

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

/** Fullscreen hides the browser bars; on Android it also lets us lock landscape. */
export function enterFullscreen() {
  if (typeof document === 'undefined' || !document.fullscreenEnabled || document.fullscreenElement) return;
  document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    .then(() => (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape'))
    .catch(() => undefined);
}

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
}

function useFullscreen() {
  const active = useSyncExternalStore(subscribeFullscreen, () => !!document.fullscreenElement, () => false);
  const supported = useSyncExternalStore(subscribeFullscreen, () => !!document.fullscreenEnabled, () => false);
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else enterFullscreen();
  };
  return { active, supported, toggle };
}

export function BetaBadge() {
  return (
    <span className="rounded-full border border-amber-300/50 bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
      Beta · pre-evento
    </span>
  );
}

export interface LevelResult {
  reward: number;
  firstClear: boolean;
  /** Why a victory paid nothing, when it is not because it was already paid. */
  note?: string;
}

interface JardinGameProps {
  mode: GameMode;
  /** Level and seed packets for waves mode; the seed comes from the server. */
  level?: LevelDef;
  loadout?: PlantKind[];
  seed?: string;
  onExit: () => void;
  onRestart: () => void;
  /** Reports a finished level; resolves with the reward granted by the server. */
  onLevelEnd?: (outcome: 'victory' | 'defeat', log: LoggedCommand[]) => Promise<LevelResult>;
}

type Report = { status: 'idle' | 'saving' } | { status: 'saved'; result: LevelResult } | { status: 'error'; message: string };

export function JardinGame({ mode, level, loadout, seed, onExit, onRestart, onLevelEnd }: JardinGameProps) {
  const { imagesRef, load, progress, ready, failed } = useSprites();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const [initialGame] = useState(() =>
    createGame(seed ?? randomSeed(), {}, mode, { level: level?.id, loadout: loadout ?? null }),
  );
  const logRef = useRef<LoggedCommand[]>([]);
  const [report, setReport] = useState<Report>({ status: 'idle' });
  const seedPackets = initialGame.loadout ?? PLANT_ORDER;
  // A level brings at most 6 packets; the sandbox has every plant.
  const twoColumns = seedPackets.length > 8;
  const levelWaves = initialGame.level.waves;
  const gameRef = useRef<JardinState>(initialGame);
  const queueRef = useRef<Command[]>([]);
  const viewportRef = useRef<Viewport | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const toolRef = useRef<Tool>(null);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);

  const [tool, setToolState] = useState<Tool>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [options, setOptions] = useState<SandboxOptions>(initialGame.options);
  const [hud, setHud] = useState<Hud>(() => readHud(initialGame));
  const [showPanel, setShowPanel] = useState(false);
  const [zombieKind, setZombieKind] = useState<ZombieKind>('despistado');
  const [portrait, setPortrait] = useState(false);
  const compact = useCompactLayout();
  const fullscreen = useFullscreen();
  const [playPortrait, setPlayPortrait] = useState(false);
  const sandbox = mode === 'sandbox';

  const reportOutcome = useCallback(
    (outcome: 'victory' | 'defeat') => {
      if (!onLevelEnd) return;
      setReport({ status: 'saving' });
      onLevelEnd(outcome, logRef.current)
        .then((result) => setReport({ status: 'saved', result }))
        .catch((error) =>
          setReport({ status: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar el resultado.' }),
        );
    },
    [onLevelEnd],
  );
  const reported = useRef(false);
  useEffect(() => {
    if (!hud.outcome || reported.current || sandbox) return;
    reported.current = true;
    reportOutcome(hud.outcome);
  }, [hud.outcome, reportOutcome, sandbox]);

  const setTool = useCallback(
    (next: Tool) => {
      toolRef.current = next;
      setToolState(next);
      if (next && next !== 'shovel') plantSpriteUrls(next).forEach((url) => void load(url).catch(() => undefined));
    },
    [load],
  );
  const send = useCallback((command: Command) => queueRef.current.push(command), []);

  const updateOptions = (patch: Partial<SandboxOptions>) => {
    send({ type: 'options', options: patch });
    setOptions((current) => ({ ...current, ...patch }));
  };
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);
  const setGameSpeed = (value: number) => {
    speedRef.current = value;
    setSpeed(value);
  };

  // Orientation hint for phones held upright.
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Main loop: fixed 30 Hz simulation, rendering at display rate.
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current!;
    const board = boardRef.current!;
    const ctx = canvas.getContext('2d')!;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = board.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // The seed column sits over the scenery; keep the lawn clear of it.
      const rail = railRef.current?.getBoundingClientRect().width ?? 0;
      viewportRef.current = computeViewport(width, height, rail + 4);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    if (railRef.current) observer.observe(railRef.current);

    // Every command of a level is logged with its tick so the server can
    // replay the match and verify the result.
    const advance = (game: JardinState) => {
      const commands = queueRef.current.splice(0);
      if (game.mode === 'waves' && !game.outcome)
        for (const command of commands)
          if (command.type === 'place' || command.type === 'shovel' || command.type === 'collect')
            logRef.current.push([game.tick, command]);
      step(game, commands);
    };
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let hudTimer = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const game = gameRef.current;
      if (!pausedRef.current) {
        accumulator += dt * speedRef.current;
        let steps = 0;
        while (accumulator >= TICK_SECONDS && steps < 12) {
          advance(game);
          accumulator -= TICK_SECONDS;
          steps++;
        }
      } else if (queueRef.current.length) {
        // Let the player plant and collect while paused.
        advance(game);
      }
      const v = viewportRef.current!;
      let hover: Hover | null = null;
      const pointer = pointerRef.current;
      const currentTool = toolRef.current;
      if (pointer && currentTool) {
        const cell = cellAt(v, pointer.x, pointer.y);
        if (cell)
          hover = {
            ...cell,
            kind: currentTool,
            valid:
              currentTool === 'shovel'
                ? !!plantAt(game, cell.row, cell.col)
                : canPlace(game, currentTool, cell.row, cell.col) === 'ok',
          };
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(ctx, v, dpr, game, imagesRef.current, pausedRef.current || game.outcome ? 0 : accumulator / TICK_SECONDS, hover);
      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        setHud(readHud(game));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [ready, imagesRef]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = PLANT_KEYS.indexOf(event.key);
      if (index >= 0 && index < seedPackets.length) setTool(seedPackets[index]);
      else if (event.key === 'q' || event.key === 'Q') setTool('shovel');
      else if (sandbox && (event.key === 'z' || event.key === 'Z')) send({ type: 'spawnZombie', kind: zombieKind });
      else if (event.key === 'p' || event.key === 'P' || event.key === ' ') {
        event.preventDefault();
        togglePause();
      } else if (event.key === 'Escape') setTool(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, setTool, togglePause, sandbox, zombieKind, seedPackets]);

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerRef.current = { x, y };
    const v = viewportRef.current;
    if (!v) return;
    if (event.button === 2) return setTool(null);
    const game = gameRef.current;
    const sun = sunAt(v, game, x, y);
    if (sun) return send({ type: 'collect', sunId: sun.id });
    const cell = cellAt(v, x, y);
    const current = toolRef.current;
    if (!cell || !current) return;
    if (current === 'shovel') {
      send({ type: 'shovel', ...cell });
      setTool(null);
    } else if (canPlace(game, current, cell.row, cell.col) === 'ok') {
      send({ type: 'place', kind: current, ...cell });
      setTool(null);
    }
  };

  const spawn = (row?: number) => send({ type: 'spawnZombie', row, kind: zombieKind });

  // Flags on the progress bar for the big and final waves.
  const lastWave = levelWaves[levelWaves.length - 1].at;
  const flags = levelWaves.filter((wave) => wave.flag).map((wave) => wave.at / lastWave);

  const roundButton = `flex shrink-0 items-center justify-center rounded-full border-2 border-[#f5d68a]/70 bg-gradient-to-b from-[#5b3b1d] to-[#2f1d0d] text-amber-50 shadow-[0_3px_0_rgba(0,0,0,0.45)] transition active:translate-y-0.5 ${
    compact ? 'h-10 w-10' : 'h-12 w-12'
  }`;

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-[#0b130d] text-white">
      <div ref={boardRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 touch-none ${tool ? 'cursor-crosshair' : 'cursor-pointer'}`}
          onPointerDown={onPointerDown}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          }}
          onPointerLeave={() => (pointerRef.current = null)}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Jardín: toca una casilla para plantar o un sol para recogerlo"
        />
      </div>

      {/* Seed packets, PvZ 2 style: sun counter on top, one column below. */}
      <nav
        ref={railRef}
        className={`absolute bottom-0 left-0 top-0 z-10 flex flex-col gap-1 ${
          twoColumns ? (compact ? 'w-[156px] py-1' : 'w-[204px] py-2') : compact ? 'w-[86px] py-1' : 'w-[112px] py-2'
        }`}
        style={{ paddingLeft: 'max(6px, env(safe-area-inset-left))' }}
        aria-label="Plantas"
      >
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full border-2 border-[#f5d68a]/70 bg-gradient-to-b from-[#3d2a14]/95 to-[#1e1408]/95 pr-3 shadow-[0_3px_0_rgba(0,0,0,0.45)] ${
            compact ? 'h-9' : 'h-12'
          }`}
          aria-label={`Sol: ${options.infiniteSun ? 'infinito' : hud.sun}`}
        >
          <img
            src={spriteUrl('solmiel', 'sun')}
            alt=""
            className={`-ml-1 object-contain drop-shadow-[0_0_6px_rgba(255,220,90,0.9)] ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}
          />
          <span className={`font-black tabular-nums text-white [text-shadow:0_2px_0_#000] ${compact ? 'text-base' : 'text-xl'}`}>
            {options.infiniteSun ? '∞' : hud.sun}
          </span>
        </div>
        <div
          className={`min-h-0 flex-1 gap-1 ${
            twoColumns ? `grid grid-cols-2 content-start ${compact ? 'auto-rows-[46px]' : 'auto-rows-[62px]'}` : 'flex flex-col'
          }`}
        >
          {seedPackets.map((kind, index) => {
            const def = PLANTS[kind];
            const selected = tool === kind;
            const ready = hud.placeable[kind];
            const affordable = options.infiniteSun || hud.sun >= def.cost;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTool(selected ? null : kind)}
                title={PLANT_KEYS[index] ? `${def.name} · ${def.role} (${PLANT_KEYS[index]})` : `${def.name} · ${def.role}`}
                aria-label={`${def.name}, ${def.cost} de sol`}
                aria-pressed={selected}
                className={`relative min-h-0 flex-1 overflow-hidden rounded-[6px] border-2 border-[#2a1c0c] bg-gradient-to-b from-[#fbf3d6] to-[#dccb94] shadow-[0_3px_0_rgba(0,0,0,0.5)] transition active:translate-y-0.5 ${
                  compact ? 'max-h-[52px]' : 'max-h-[66px]'
                } ${selected ? 'translate-x-2 ring-2 ring-amber-300 shadow-[0_0_12px_rgba(255,214,90,0.8)]' : ''} ${
                  ready ? '' : '[filter:grayscale(0.55)_brightness(0.85)]'
                }`}
              >
                {/* Seed packet: perforated paper flap and a green window. */}
                <span className="pointer-events-none absolute inset-x-[5px] top-[3px] border-t-2 border-dashed border-[#a2824a]/70" />
                <span className="pointer-events-none absolute inset-x-[4px] bottom-[4px] top-[8px] rounded-[3px] border border-[#4f7a2e]/70 bg-[radial-gradient(circle_at_32%_38%,#effcdc_0%,#b5df8a_50%,#6fa84b_100%)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
                <img
                  src={spriteUrl(kind, 'portrait')}
                  alt=""
                  className="pointer-events-none absolute -bottom-[10%] left-0 h-[128%] w-auto object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,0.55)]"
                />
                <span
                  className={`absolute bottom-[3px] right-[3px] rounded-[3px] border border-[#2a1c0c] bg-[#fbf6e1] px-1 font-black leading-[1.15] tabular-nums shadow-[0_1px_0_rgba(0,0,0,0.4)] ${
                    compact ? 'text-[11px]' : 'text-sm'
                  } ${affordable ? 'text-[#2a1c0c]' : 'text-red-600'}`}
                >
                  {options.infiniteSun ? '—' : def.cost}
                </span>
                {hud.cooldowns[kind] > 0 && (
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 bg-[#1b130a]/60"
                    style={{ height: `${hud.cooldowns[kind] * 100}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Level progress, top centre. */}
      {ready && (
        <div
          className="pointer-events-none absolute top-4 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `calc(50% + ${compact ? 43 : 56}px)` }}
        >
          {!sandbox ? (
            <>
              <div
                className={`relative rounded-full border-2 border-[#f5d68a]/70 bg-[#1e1408]/90 p-[3px] shadow-[0_3px_0_rgba(0,0,0,0.45)] ${
                  compact ? 'h-4 w-44' : 'h-5 w-64'
                }`}
                role="progressbar"
                aria-label="Progreso del nivel"
                aria-valuenow={Math.round(hud.progress * 100)}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full bg-black/50">
                  {/* Zombies advance from the right, like in PvZ 2. */}
                  <div
                    className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-lime-300 to-lime-600"
                    style={{ width: `${hud.progress * 100}%` }}
                  />
                </div>
                {flags.map((at) => (
                  <span
                    key={at}
                    className={`absolute top-1/2 -translate-y-[80%] leading-none ${compact ? 'text-sm' : 'text-base'}`}
                    style={{ right: `calc(${at * 100}% - 6px)` }}
                    aria-hidden
                  >
                    🚩
                  </span>
                ))}
                <img
                  src={spriteUrl('despistado', 'portrait')}
                  alt=""
                  className={`absolute top-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
                    compact ? 'h-7 w-7' : 'h-9 w-9'
                  }`}
                  style={{ right: `calc(${hud.progress * 100}% - ${compact ? 14 : 18}px)` }}
                />
              </div>
              <p className={`mt-0.5 font-title font-bold text-amber-100 [text-shadow:0_2px_0_#000] ${compact ? 'text-[11px]' : 'text-sm'}`}>
                {initialGame.level.name} · Oleada {Math.min(hud.wave, levelWaves.length)}/{levelWaves.length}
              </p>
            </>
          ) : (
            <p className={`font-title font-bold text-amber-100 [text-shadow:0_2px_0_#000] ${compact ? 'text-xs' : 'text-base'}`}>
              Sandbox · Beta
            </p>
          )}
        </div>
      )}

      {/* Pause, options and fullscreen, top right. */}
      <div
        className="absolute right-0 top-0 z-10 flex gap-1.5 p-1.5"
        style={{ paddingRight: 'max(6px, env(safe-area-inset-right))' }}
      >
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className={roundButton}
            aria-label={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
            title={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen.active ? <Minimize size={18} aria-hidden /> : <Maximize size={18} aria-hidden />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPanel((open) => !open)}
          className={`${roundButton} ${showPanel ? 'ring-2 ring-amber-200' : ''}`}
          aria-expanded={showPanel}
          aria-label={sandbox ? 'Opciones del sandbox' : 'Menú'}
          title={sandbox ? 'Opciones del sandbox' : 'Menú'}
        >
          <SlidersHorizontal size={18} aria-hidden />
        </button>
        <button type="button" onClick={togglePause} className={roundButton} aria-label={paused ? 'Reanudar' : 'Pausar'}>
          {paused ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
        </button>
      </div>

      {/* Shovel, bottom right. */}
      <button
        type="button"
        onClick={() => setTool(tool === 'shovel' ? null : 'shovel')}
        title="Pala (Q)"
        aria-label="Pala"
        aria-pressed={tool === 'shovel'}
        className={`absolute bottom-2 z-10 flex items-center justify-center rounded-full border-[3px] bg-gradient-to-b from-[#6a4a25] to-[#2f1d0d] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition active:translate-y-0.5 ${
          compact ? 'h-12 w-12' : 'h-16 w-16'
        } ${tool === 'shovel' ? 'border-amber-200 ring-2 ring-amber-200' : 'border-[#f5d68a]/70'}`}
        style={{ right: 'max(8px, env(safe-area-inset-right))' }}
      >
        <Shovel size={compact ? 22 : 28} className="text-amber-50" aria-hidden />
      </button>

      {showPanel && (
        <aside
          className={`absolute right-2 z-20 w-[min(92vw,300px)] overflow-y-auto rounded-2xl border border-white/15 bg-black/85 p-3 text-sm shadow-2xl backdrop-blur-md ${
            compact ? 'top-[52px] max-h-[calc(100%-60px)]' : 'top-[64px] max-h-[calc(100%-72px)]'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200/80">{sandbox ? 'Modo sandbox' : 'Oleadas'}</p>
            <BetaBadge />
          </div>
          {sandbox && (
            <>
              {(
                [
                  ['infiniteSun', 'Sol infinito'],
                  ['noCooldown', 'Sin recarga'],
                  ['autoWaves', 'Zombis automáticos'],
                  ['skySun', 'Sol del cielo'],
                  ['autoCollect', 'Recoger sol solo'],
                ] as [keyof SandboxOptions, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between py-1">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(event) => updateOptions({ [key]: event.target.checked })}
                    className="h-4 w-4 accent-amber-300"
                  />
                </label>
              ))}
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="mb-1 text-xs text-white/60">Zombi a soltar (Z: carril al azar)</p>
                <div className="mb-1.5 grid grid-cols-5 gap-1">
                  {ZOMBIE_ORDER.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setZombieKind(kind)}
                      aria-pressed={zombieKind === kind}
                      className={`flex flex-col items-center rounded-lg py-1 text-[11px] font-semibold ${
                        zombieKind === kind ? 'bg-amber-300 text-black' : 'bg-white/10'
                      }`}
                    >
                      <img src={spriteUrl(kind, 'portrait')} alt="" className="h-8 w-8 object-contain" />
                      {ZOMBIES[kind].name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 1, 2, 3, 4].map((row) => (
                    <button key={row} type="button" onClick={() => spawn(row)} className="rounded-lg bg-white/10 py-1.5 font-bold" aria-label={`Carril ${row + 1}`}>
                      {row + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => [0, 1, 2, 3, 4].forEach((row) => spawn(row))}
                  className="mt-1.5 w-full rounded-lg bg-red-500/25 py-1.5 font-bold text-red-100"
                >
                  Horda (uno por carril)
                </button>
              </div>
            </>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span>Velocidad</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGameSpeed(value)}
                  className={`rounded-lg px-2.5 py-1 font-bold ${speed === value ? 'bg-amber-300 text-black' : 'bg-white/10'}`}
                >
                  ×{value}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-white/60">
            {hud.zombies} zombis · {hud.seconds}s · eliminados {hud.killed} · podadoras usadas {hud.mowersUsed}
            {sandbox && ` · brechas ${hud.breaches}`}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {sandbox ? (
              <button type="button" onClick={() => send({ type: 'resetMowers' })} className="rounded-lg border border-white/20 py-1.5 text-xs">
                Reponer podadoras
              </button>
            ) : (
              <button type="button" onClick={onRestart} className="rounded-lg border border-white/20 py-1.5 text-xs">
                Reiniciar nivel
              </button>
            )}
            <button type="button" onClick={sandbox ? onRestart : onExit} className="rounded-lg border border-white/20 py-1.5 text-xs">
              {sandbox ? 'Reiniciar jardín' : 'Salir al menú'}
            </button>
          </div>
          {sandbox && (
            <button type="button" onClick={onExit} className="mt-1.5 w-full rounded-lg border border-white/10 py-1.5 text-xs text-white/70">
              Salir al menú
            </button>
          )}
        </aside>
      )}

      {hud.announcement && (
        <p className="pointer-events-none absolute left-1/2 top-1/3 z-10 -translate-x-1/2 animate-pulse whitespace-nowrap font-title text-3xl font-bold text-red-200 [text-shadow:0_3px_0_#000,0_0_12px_#000] short:text-2xl">
          {hud.announcement}
        </p>
      )}

      {!ready && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#0b130d]">
          {failed ? (
            <p className="text-sm text-red-300">No se pudieron cargar los sprites. Recarga la página.</p>
          ) : (
            <>
              <p className="font-title text-lg text-amber-100">Preparando el jardín…</p>
              <div className="h-2 w-56 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-amber-300 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </>
          )}
        </div>
      )}

      {tool && !hud.outcome && (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/85 short:hidden">
          {tool === 'shovel' ? 'Toca una planta para quitarla' : `Toca una casilla para plantar ${PLANTS[tool].name}`} · Esc o clic derecho
          para cancelar
        </p>
      )}

      {hud.outcome && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-black/85 p-6 text-center shadow-2xl short:p-4">
            <p className={`font-title text-3xl ${hud.outcome === 'victory' ? 'text-amber-200' : 'text-red-300'}`}>
              {hud.outcome === 'victory' ? '¡Jardín a salvo!' : 'Los zombis entraron'}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {hud.outcome === 'victory'
                ? `Resististe las ${levelWaves.length} oleadas de ${initialGame.level.name}.`
                : `Llegaste a la oleada ${Math.min(hud.wave, levelWaves.length)} de ${levelWaves.length}.`}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {hud.killed} zombis eliminados · {hud.mowersUsed} podadoras usadas · {Math.floor(hud.seconds / 60)}:
              {String(hud.seconds % 60).padStart(2, '0')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={onRestart} className="rounded-full bg-amber-300 py-2 text-sm font-bold text-black">
                Jugar otra vez
              </button>
              <button type="button" onClick={onExit} className="rounded-full border border-white/25 py-2 text-sm">
                Menú
              </button>
            </div>
            {sandbox ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/40">Sandbox · sin premios</p>
            ) : (
              <LevelReport report={report} outcome={hud.outcome} onRetry={() => reportOutcome(hud.outcome!)} />
            )}
          </div>
        </div>
      )}

      {portrait && !playPortrait && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 text-center">
          <p className="text-4xl">📱↻</p>
          <p className="font-title text-xl text-amber-100">Gira el teléfono</p>
          <p className="max-w-xs text-sm text-white/70">El jardín se juega en horizontal, con los zombis llegando por la derecha.</p>
          <button type="button" onClick={() => setPlayPortrait(true)} className="rounded-full border border-white/25 px-4 py-2 text-sm">
            Jugar igual
          </button>
        </div>
      )}
    </main>
  );
}

function LevelReport({
  report,
  outcome,
  onRetry,
}: {
  report: Report;
  outcome: JardinState['outcome'];
  onRetry: () => void;
}) {
  if (report.status === 'error')
    return (
      <div className="mt-3 text-xs text-red-300" role="alert">
        <p>{report.message}</p>
        <button type="button" onClick={onRetry} className="mt-1 underline">
          Reintentar
        </button>
      </div>
    );
  if (report.status !== 'saved')
    return (
      <p className="mt-3 text-xs text-white/60" role="status">
        Verificando la partida…
      </p>
    );
  const { reward, note } = report.result;
  if (outcome !== 'victory') return <p className="mt-3 text-xs text-white/55">Sin recompensa. ¡Prueba con otras plantas!</p>;
  return reward > 0 ? (
    <p className="mt-3 flex items-center justify-center gap-2 font-title text-xl text-amber-200">
      <span aria-hidden>🪙</span> +{reward.toLocaleString('es-AR')} monedas
    </p>
  ) : (
    <p className="mt-3 text-xs text-white/60">{note ?? 'Ya cobraste este nivel: esta victoria no suma monedas.'}</p>
  );
}
