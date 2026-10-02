'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Shovel } from 'lucide-react';
import {
  LEVEL_WAVES,
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

function BetaBadge() {
  return (
    <span className="rounded-full border border-amber-300/50 bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
      Beta · pre-evento
    </span>
  );
}

export function JardinSandbox() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [round, setRound] = useState(0);
  if (!mode)
    return (
      <StartScreen
        onPick={(picked) => {
          setMode(picked);
          setRound((value) => value + 1);
        }}
      />
    );
  return <JardinGame key={`${mode}-${round}`} mode={mode} onExit={() => setMode(null)} onRestart={() => setRound((value) => value + 1)} />;
}

function StartScreen({ onPick }: { onPick: (mode: GameMode) => void }) {
  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#0b130d] p-4 text-white">
      <img
        src="/jardin/escenario/jardin.webp"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 blur-[2px]"
      />
      <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-black/70 p-6 text-center shadow-2xl backdrop-blur-md short:p-4">
        <BetaBadge />
        <h1 className="mt-3 font-title text-3xl text-amber-100 short:mt-1 short:text-2xl">Jardín de Yggdrasil</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
          Defiende el claro de los zombis con las plantas vivas del próximo evento. Esta beta es una prueba abierta: no da premios y su
          equilibrio puede cambiar.
        </p>
        <div className="mt-4 flex justify-center gap-1 short:hidden">
          {PLANT_ORDER.map((kind) => (
            <img key={kind} src={spriteUrl(kind, 'portrait')} alt={PLANTS[kind].name} title={PLANTS[kind].name} className="h-10 w-10 object-contain" />
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 short:mt-3">
          <button
            type="button"
            onClick={() => onPick('waves')}
            className="rounded-2xl border border-amber-300/60 bg-amber-300/15 p-4 text-left transition hover:bg-amber-300/25 active:scale-[0.98]"
          >
            <span className="block font-title text-lg text-amber-100">Oleadas</span>
            <span className="mt-1 block text-xs text-white/70">
              {LEVEL_WAVES.length} oleadas, con una gran oleada a mitad de camino y una final. Si un zombi llega a la casa sin podadora, pierdes.
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPick('sandbox')}
            className="rounded-2xl border border-white/20 bg-white/5 p-4 text-left transition hover:bg-white/10 active:scale-[0.98]"
          >
            <span className="block font-title text-lg">Sandbox</span>
            <span className="mt-1 block text-xs text-white/70">
              Prueba libre: sol infinito, sin recarga, suelta el zombi que quieras en el carril que quieras.
            </span>
          </button>
        </div>
        <p className="mt-4 text-[11px] text-white/45 short:hidden">
          Atajos: 1–0 plantas · Q pala · P pausa · Esc cancela. Mejor en horizontal.
        </p>
      </section>
    </main>
  );
}

function JardinGame({ mode, onExit, onRestart }: { mode: GameMode; onExit: () => void; onRestart: () => void }) {
  const { imagesRef, load, progress, ready, failed } = useSprites();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [initialGame] = useState(() => createGame(randomSeed(), {}, mode));
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
  const [playPortrait, setPlayPortrait] = useState(false);
  const sandbox = mode === 'sandbox';

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
      viewportRef.current = computeViewport(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(board);

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
          step(game, queueRef.current.splice(0));
          accumulator -= TICK_SECONDS;
          steps++;
        }
      } else if (queueRef.current.length) {
        // Let the player plant and collect while paused.
        step(game, queueRef.current.splice(0));
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
      if (index >= 0 && index < PLANT_ORDER.length) setTool(PLANT_ORDER[index]);
      else if (event.key === 'q' || event.key === 'Q') setTool('shovel');
      else if (sandbox && (event.key === 'z' || event.key === 'Z')) send({ type: 'spawnZombie', kind: zombieKind });
      else if (event.key === 'p' || event.key === 'P' || event.key === ' ') {
        event.preventDefault();
        togglePause();
      } else if (event.key === 'Escape') setTool(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, setTool, togglePause, sandbox, zombieKind]);

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

  return (
    <main className="fixed inset-0 flex select-none flex-col overflow-hidden bg-[#0b130d] text-white">
      <header className="relative z-10 flex items-stretch gap-2 border-b border-white/10 bg-black/45 px-2 py-1.5 backdrop-blur-md short:py-1">
        <div className="flex min-w-[64px] flex-col items-center justify-center rounded-xl bg-amber-300/15 px-2 ring-1 ring-amber-300/40">
          <img src={spriteUrl('solmiel', 'sun')} alt="" className="h-7 w-7 object-contain short:h-5 short:w-5" />
          <span className="text-sm font-bold tabular-nums text-amber-200">{options.infiniteSun ? '∞' : hud.sun}</span>
        </div>

        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {PLANT_ORDER.map((kind, index) => {
            const def = PLANTS[kind];
            const selected = tool === kind;
            const ready = hud.placeable[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTool(selected ? null : kind)}
                title={`${def.name} · ${def.role} (${PLANT_KEYS[index]})`}
                aria-pressed={selected}
                className={`relative flex w-[62px] shrink-0 flex-col items-center overflow-hidden rounded-xl border bg-[#1d2a1a] pb-0.5 transition active:scale-95 short:w-[50px] ${
                  selected ? 'border-amber-300 ring-2 ring-amber-300/70' : 'border-white/15'
                } ${ready ? '' : 'opacity-60'}`}
              >
                <img src={spriteUrl(kind, 'portrait')} alt="" className="h-10 w-10 object-contain short:h-8 short:w-8" />
                <span className="w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight text-white/85 short:hidden">
                  {def.name}
                </span>
                <span className="text-[11px] font-bold tabular-nums text-amber-200">{options.infiniteSun ? '—' : def.cost}</span>
                {hud.cooldowns[kind] > 0 && (
                  <span className="pointer-events-none absolute inset-x-0 top-0 bg-black/60" style={{ height: `${hud.cooldowns[kind] * 100}%` }} />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setTool(tool === 'shovel' ? null : 'shovel')}
            title="Pala (Q)"
            aria-pressed={tool === 'shovel'}
            className={`flex w-[52px] shrink-0 flex-col items-center justify-center rounded-xl border bg-[#2a2219] transition active:scale-95 short:w-[44px] ${
              tool === 'shovel' ? 'border-amber-300 ring-2 ring-amber-300/70' : 'border-white/15'
            }`}
          >
            <Shovel size={22} className="text-amber-100" aria-hidden />
            <span className="text-[10px] font-semibold text-white/80 short:hidden">Pala</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={togglePause}
            className="h-10 w-10 rounded-full border border-white/20 bg-white/10 text-lg"
            aria-label={paused ? 'Reanudar' : 'Pausar'}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <button
            type="button"
            onClick={() => setShowPanel((open) => !open)}
            className={`h-10 rounded-full border px-3 text-xs font-bold ${
              showPanel ? 'border-amber-300 bg-amber-300/20 text-amber-100' : 'border-white/20 bg-white/10'
            }`}
            aria-expanded={showPanel}
          >
            {sandbox ? 'Sandbox' : 'Menú'}
          </button>
        </div>
      </header>

      {showPanel && (
        <aside className="absolute right-2 top-[78px] z-20 max-h-[calc(100%-86px)] w-[min(92vw,300px)] overflow-y-auto rounded-2xl border border-white/15 bg-black/85 p-3 text-sm shadow-2xl backdrop-blur-md short:top-[58px] short:max-h-[calc(100%-64px)]">
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
                <div className="mb-1.5 grid grid-cols-3 gap-1">
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

      <div ref={boardRef} className="relative min-h-0 flex-1">
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

        {!sandbox && ready && (
          <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs">
            <span className="text-white/75">
              Oleada {Math.min(hud.wave, LEVEL_WAVES.length)}/{LEVEL_WAVES.length}
            </span>
            <span className="relative h-2 w-28 overflow-hidden rounded-full bg-white/15 short:w-20">
              <span className="absolute inset-y-0 left-0 bg-gradient-to-r from-lime-400 to-red-500" style={{ width: `${hud.progress * 100}%` }} />
            </span>
          </div>
        )}

        {hud.announcement && (
          <p className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 animate-pulse whitespace-nowrap font-title text-3xl text-red-200 drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)] short:text-2xl">
            {hud.announcement}
          </p>
        )}

        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
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
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/85 short:hidden">
            {tool === 'shovel' ? 'Toca una planta para quitarla' : `Toca una casilla para plantar ${PLANTS[tool].name}`} · Esc o clic
            derecho para cancelar
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
                  ? `Resististe las ${LEVEL_WAVES.length} oleadas.`
                  : `Llegaste a la oleada ${Math.min(hud.wave, LEVEL_WAVES.length)} de ${LEVEL_WAVES.length}.`}
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
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/40">Beta · sin premios</p>
            </div>
          </div>
        )}
      </div>

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
