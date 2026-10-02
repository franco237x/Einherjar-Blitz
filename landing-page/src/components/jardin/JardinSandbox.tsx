'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Shovel } from 'lucide-react';
import {
  PLANT_ORDER,
  PLANTS,
  TICKS_PER_SECOND,
  canPlace,
  cooldownProgress,
  createGame,
  plantAt,
  step,
  type Command,
  type JardinState,
  type PlantKind,
  type SandboxOptions,
} from '@/lib/jardin/engine';
import { allSpriteUrls, spriteUrl } from '@/lib/jardin/sprites';
import { cellAt, computeViewport, drawScene, sunAt, type Hover, type Images, type Viewport } from './render';

type Tool = PlantKind | 'shovel' | null;
const TICK_SECONDS = 1 / TICKS_PER_SECOND;

function randomSeed() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function useSprites() {
  const [images, setImages] = useState<Images | null>(null);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const urls = allSpriteUrls();
    const map: Images = new Map();
    let done = 0;
    Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.decoding = 'async';
            image.onload = () => {
              map.set(url, image);
              done++;
              if (!cancelled) setProgress(done / urls.length);
              resolve();
            };
            image.onerror = () => reject(new Error(url));
            image.src = url;
          }),
      ),
    )
      .then(() => !cancelled && setImages(map))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);
  return { images, progress, failed };
}

interface Hud {
  sun: number;
  cooldowns: Record<PlantKind, number>;
  placeable: Record<PlantKind, boolean>;
  killed: number;
  breaches: number;
  zombies: number;
  seconds: number;
}

function readHud(state: JardinState): Hud {
  const cooldowns = {} as Record<PlantKind, number>;
  const placeable = {} as Record<PlantKind, boolean>;
  for (const kind of PLANT_ORDER) {
    cooldowns[kind] = cooldownProgress(state, kind);
    placeable[kind] = (state.options.infiniteSun || state.sun >= PLANTS[kind].cost) && cooldowns[kind] === 0;
  }
  return {
    sun: state.sun,
    cooldowns,
    placeable,
    killed: state.stats.killed,
    breaches: state.stats.breaches,
    zombies: state.zombies.filter((zombie) => zombie.clip !== 'fall').length,
    seconds: Math.floor(state.tick / TICKS_PER_SECOND),
  };
}

export function JardinSandbox() {
  const { images, progress, failed } = useSprites();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [initialGame] = useState(() => createGame(randomSeed()));
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
  const [portrait, setPortrait] = useState(false);
  const [playPortrait, setPlayPortrait] = useState(false);

  const setTool = useCallback((next: Tool) => {
    toolRef.current = next;
    setToolState(next);
  }, []);
  const send = useCallback((command: Command) => queueRef.current.push(command), []);

  const updateOptions = (patch: Partial<SandboxOptions>) => {
    send({ type: 'options', options: patch });
    setOptions((current) => ({ ...current, ...patch }));
  };
  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);
  const restart = () => {
    gameRef.current = createGame(randomSeed(), options);
    queueRef.current = [];
    setHud(readHud(gameRef.current));
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
    if (!images) return;
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
      drawScene(ctx, v, dpr, game, images, pausedRef.current ? 0 : accumulator / TICK_SECONDS, hover);
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
  }, [images]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < PLANT_ORDER.length) setTool(PLANT_ORDER[index]);
      else if (event.key === 'q' || event.key === 'Q') setTool('shovel');
      else if (event.key === 'z' || event.key === 'Z') send({ type: 'spawnZombie' });
      else if (event.key === 'p' || event.key === 'P' || event.key === ' ') {
        event.preventDefault();
        togglePause();
      } else if (event.key === 'Escape') setTool(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, setTool, togglePause]);

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

  const zombieRow = (row?: number) => send({ type: 'spawnZombie', row });

  return (
    <main className="fixed inset-0 flex select-none flex-col overflow-hidden bg-[#0b130d] text-white">
      <header className="relative z-10 flex items-stretch gap-2 border-b border-white/10 bg-black/45 px-2 py-1.5 backdrop-blur-md short:py-1">
        <div className="flex min-w-[72px] flex-col items-center justify-center rounded-xl bg-amber-300/15 px-2 ring-1 ring-amber-300/40">
          <img src={spriteUrl('solmiel', 'sun')} alt="" className="h-7 w-7 object-contain short:h-5 short:w-5" />
          <span className="text-sm font-bold tabular-nums text-amber-200">{options.infiniteSun ? '∞' : hud.sun}</span>
        </div>

        <div className="flex flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {PLANT_ORDER.map((kind, index) => {
            const def = PLANTS[kind];
            const selected = tool === kind;
            const ready = hud.placeable[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setTool(selected ? null : kind)}
                title={`${def.name} · ${def.role} (${index + 1})`}
                aria-pressed={selected}
                className={`relative flex w-[66px] shrink-0 flex-col short:w-[52px] items-center overflow-hidden rounded-xl border bg-[#1d2a1a] pb-0.5 transition active:scale-95 ${
                  selected ? 'border-amber-300 ring-2 ring-amber-300/70' : 'border-white/15'
                } ${ready ? '' : 'opacity-60'}`}
              >
                <img src={spriteUrl(kind, 'portrait')} alt="" className="h-11 w-11 object-contain short:h-8 short:w-8" />
                <span className="text-[10px] font-semibold leading-tight text-white/85 short:hidden">{def.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-amber-200">{options.infiniteSun ? '—' : def.cost}</span>
                {hud.cooldowns[kind] > 0 && (
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 bg-black/60"
                    style={{ height: `${hud.cooldowns[kind] * 100}%` }}
                  />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setTool(tool === 'shovel' ? null : 'shovel')}
            title="Pala (Q)"
            aria-pressed={tool === 'shovel'}
            className={`flex w-[56px] shrink-0 flex-col items-center justify-center rounded-xl border bg-[#2a2219] transition short:w-[44px] active:scale-95 ${
              tool === 'shovel' ? 'border-amber-300 ring-2 ring-amber-300/70' : 'border-white/15'
            }`}
          >
            <Shovel size={22} className="text-amber-100" aria-hidden />
            <span className="text-[10px] font-semibold text-white/80 short:hidden">Pala</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden flex-col text-right text-[11px] leading-tight text-white/70 sm:flex">
            <span>
              Eliminados <b className="text-white">{hud.killed}</b>
            </span>
            <span>
              Brechas <b className={hud.breaches ? 'text-red-300' : 'text-white'}>{hud.breaches}</b>
            </span>
          </div>
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
            Sandbox
          </button>
        </div>
      </header>

      {showPanel && (
        <aside className="absolute right-2 top-[78px] z-20 max-h-[calc(100%-86px)] overflow-y-auto short:top-[58px] short:max-h-[calc(100%-64px)] w-[min(92vw,300px)] rounded-2xl border border-white/15 bg-black/80 p-3 text-sm shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200/80">Modo sandbox</p>
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
            <p className="mb-1 text-xs text-white/60">Soltar zombi en carril (Z: al azar)</p>
            <div className="grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((row) => (
                <button key={row} type="button" onClick={() => zombieRow(row)} className="rounded-lg bg-white/10 py-1.5 font-bold">
                  {row + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => [0, 1, 2, 3, 4].forEach((row) => zombieRow(row))}
              className="mt-1.5 w-full rounded-lg bg-red-500/25 py-1.5 font-bold text-red-100"
            >
              Horda (uno por carril)
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
            <span>Velocidad</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    speedRef.current = value;
                    setSpeed(value);
                  }}
                  className={`rounded-lg px-2.5 py-1 font-bold ${speed === value ? 'bg-amber-300 text-black' : 'bg-white/10'}`}
                >
                  ×{value}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/60">
            <span>
              {hud.zombies} zombis · {hud.seconds}s · eliminados {hud.killed} · brechas {hud.breaches}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => send({ type: 'resetMowers' })}
              className="rounded-lg border border-white/20 py-1.5 text-xs"
            >
              Reponer podadoras
            </button>
            <button type="button" onClick={restart} className="rounded-lg border border-white/20 py-1.5 text-xs">
              Reiniciar jardín
            </button>
          </div>
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
        {!images && (
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
        {tool && (
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/85">
            {tool === 'shovel' ? 'Toca una planta para quitarla' : `Toca una casilla para plantar ${PLANTS[tool].name}`} · Esc o clic
            derecho para cancelar
          </p>
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
