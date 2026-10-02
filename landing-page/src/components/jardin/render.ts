import {
  COLS,
  PLANTS,
  ROWS,
  TICKS_PER_SECOND,
  TIMING,
  type JardinState,
  type PlantKind,
} from '@/lib/jardin/engine';
import {
  ATLAS_COLUMNS,
  FRAME_PX_PER_CELL,
  FRAME_SIZE,
  PLANT_CLIPS,
  PLANT_PIVOT,
  ZOMBIE_CLIPS,
  ZOMBIE_PIVOT,
  ZOMBIE_WALK_FRAME_RATE,
  frameIndex,
  spriteUrl,
  type ClipInfo,
} from '@/lib/jardin/sprites';

// World layout in cell units: house strip, 9 lawn columns, zombie entry.
const LEFT = 0.9;
const RIGHT = 1.7;
const TOP = 0.95;
const BOTTOM = 0.25;
export const CELL_H = 1.15;
const WORLD_W = LEFT + COLS + RIGHT;
const WORLD_H = TOP + ROWS * CELL_H + BOTTOM;
const SPRITE_SCALE = FRAME_SIZE / FRAME_PX_PER_CELL;

export interface Viewport {
  width: number;
  height: number;
  scale: number;
  ox: number;
  oy: number;
}

export function computeViewport(width: number, height: number): Viewport {
  const scale = Math.min(width / WORLD_W, height / WORLD_H);
  return {
    width,
    height,
    scale,
    ox: (width - WORLD_W * scale) / 2,
    oy: (height - WORLD_H * scale) / 2,
  };
}

const screenX = (v: Viewport, x: number) => v.ox + (LEFT + x) * v.scale;
/** `y` in row units: row r spans [r, r+1). */
const screenY = (v: Viewport, y: number) => v.oy + (TOP + y * CELL_H) * v.scale;
const groundY = (v: Viewport, row: number) => screenY(v, row + 1) - 0.14 * v.scale;

/** Lawn cell under a screen point, or null outside the lawn. */
export function cellAt(v: Viewport, px: number, py: number) {
  const col = Math.floor((px - v.ox) / v.scale - LEFT);
  const row = Math.floor(((py - v.oy) / v.scale - TOP) / CELL_H);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  return { row, col };
}

/** Sun under a screen point (generous radius for touch). */
export function sunAt(v: Viewport, state: JardinState, px: number, py: number) {
  const radius = 0.5 * v.scale;
  for (let i = state.suns.length - 1; i >= 0; i--) {
    const sun = state.suns[i];
    const dx = screenX(v, sun.x) - px;
    const dy = screenY(v, sun.y) - py;
    if (dx * dx + dy * dy <= radius * radius) return sun;
  }
  return null;
}

export type Images = Map<string, HTMLImageElement>;

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  frame: number,
  x: number,
  y: number,
  size: number,
  pivot: { x: number; y: number },
) {
  if (!image) return;
  const sx = (frame % ATLAS_COLUMNS) * FRAME_SIZE;
  const sy = Math.floor(frame / ATLAS_COLUMNS) * FRAME_SIZE;
  ctx.drawImage(image, sx, sy, FRAME_SIZE, FRAME_SIZE, x - pivot.x * size, y - pivot.y * size, size, size);
}

let lawnCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function drawLawn(ctx: CanvasRenderingContext2D, v: Viewport, dpr: number) {
  const key = `${v.width}x${v.height}@${dpr}`;
  if (!lawnCache || lawnCache.key !== key) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.width * dpr);
    canvas.height = Math.round(v.height * dpr);
    const c = canvas.getContext('2d')!;
    c.scale(dpr, dpr);
    const sky = c.createLinearGradient(0, 0, 0, v.height);
    sky.addColorStop(0, '#16261a');
    sky.addColorStop(1, '#0b130d');
    c.fillStyle = sky;
    c.fillRect(0, 0, v.width, v.height);
    // House strip and entry path.
    c.fillStyle = '#3a2a1d';
    c.fillRect(v.ox, screenY(v, 0), LEFT * v.scale, ROWS * CELL_H * v.scale);
    c.fillStyle = '#4a4034';
    c.fillRect(screenX(v, COLS), screenY(v, 0), RIGHT * v.scale, ROWS * CELL_H * v.scale);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const light = (row + col) % 2 === 0;
        c.fillStyle = row % 2 === 0 ? (light ? '#5f9a3a' : '#548a33') : light ? '#6aa641' : '#5c9638';
        c.fillRect(screenX(v, col), screenY(v, row), v.scale + 0.5, CELL_H * v.scale + 0.5);
      }
    }
    // Soft vignette over the lawn edges.
    const shade = c.createLinearGradient(screenX(v, 0), 0, screenX(v, 0.6), 0);
    shade.addColorStop(0, 'rgba(0,0,0,0.25)');
    shade.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = shade;
    c.fillRect(screenX(v, 0), screenY(v, 0), 0.6 * v.scale, ROWS * CELL_H * v.scale);
    lawnCache = { key, canvas };
  }
  ctx.drawImage(lawnCache.canvas, 0, 0, v.width, v.height);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function withFlash(ctx: CanvasRenderingContext2D, active: boolean, draw: () => void) {
  if (!active) return draw();
  ctx.save();
  ctx.filter = 'brightness(1.7)';
  draw();
  ctx.restore();
}

export interface Hover {
  row: number;
  col: number;
  kind: PlantKind | 'shovel';
  valid: boolean;
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  dpr: number,
  state: JardinState,
  images: Images,
  alpha: number,
  hover: Hover | null,
) {
  const t = state.tick + alpha;
  const spriteSize = SPRITE_SCALE * v.scale;
  ctx.clearRect(0, 0, v.width, v.height);
  drawLawn(ctx, v, dpr);

  if (hover) {
    ctx.fillStyle = hover.valid ? 'rgba(255,255,255,0.18)' : 'rgba(255,60,60,0.22)';
    ctx.fillRect(screenX(v, hover.col), screenY(v, hover.row), v.scale, CELL_H * v.scale);
  }

  for (let row = 0; row < ROWS; row++) {
    for (const plant of state.plants) {
      if (plant.row !== row) continue;
      const x = screenX(v, plant.col + 0.5);
      const y = groundY(v, row);
      shadow(ctx, x, y, 0.34 * v.scale);
      const clip = (PLANT_CLIPS[plant.kind][plant.clip] ?? PLANT_CLIPS[plant.kind].idle) as ClipInfo;
      const image = images.get(spriteUrl(plant.kind, PLANT_CLIPS[plant.kind][plant.clip] ? plant.clip : 'idle'));
      withFlash(ctx, t - plant.lastHit < 4, () =>
        drawFrame(ctx, image, frameIndex(clip, t - plant.clipStart), x, y, spriteSize, PLANT_PIVOT),
      );
    }

    if (hover && hover.kind !== 'shovel' && hover.valid && hover.row === row) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      drawFrame(
        ctx,
        images.get(spriteUrl(hover.kind, 'idle')),
        0,
        screenX(v, hover.col + 0.5),
        groundY(v, row),
        spriteSize,
        PLANT_PIVOT,
      );
      ctx.restore();
    }

    const seed = images.get(spriteUrl('nabu', 'seed'));
    for (const projectile of state.projectiles) {
      if (projectile.row !== row || !seed) continue;
      const x = screenX(v, projectile.prevX + (projectile.x - projectile.prevX) * alpha);
      const w = 0.42 * v.scale;
      const h = (w * seed.height) / seed.width;
      ctx.drawImage(seed, x - w / 2, screenY(v, row + 0.42) - h / 2, w, h);
    }

    const zombies = state.zombies.filter((zombie) => zombie.row === row).sort((a, b) => b.x - a.x);
    for (const zombie of zombies) {
      const x = screenX(v, zombie.prevX + (zombie.x - zombie.prevX) * alpha);
      const y = groundY(v, row);
      const clip = ZOMBIE_CLIPS[zombie.clip];
      const rate = zombie.clip === 'walk' ? ZOMBIE_WALK_FRAME_RATE : 1;
      const elapsed = (t - zombie.clipStart) * rate;
      ctx.save();
      if (zombie.clip === 'fall') {
        const fade = (t - zombie.clipStart - TIMING.zombieFall) / TIMING.corpseLinger;
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - fade));
      } else {
        shadow(ctx, x, y, 0.3 * v.scale);
      }
      withFlash(ctx, t - zombie.lastHit < 4 && zombie.clip !== 'fall', () =>
        drawFrame(ctx, images.get(spriteUrl('despistado', zombie.clip)), frameIndex(clip, elapsed), x, y, spriteSize, ZOMBIE_PIVOT),
      );
      ctx.restore();
    }
  }

  const burst = images.get(spriteUrl('granadin', 'burst'));
  for (const blast of state.blasts) {
    const p = (t - blast.tick) / TICKS_PER_SECOND;
    const x = screenX(v, blast.col + 0.5);
    const y = screenY(v, blast.row + 0.5);
    const r = (0.6 + p * 1.6) * v.scale;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, 'rgba(255,240,180,0.95)');
    glow.addColorStop(0.45, 'rgba(255,140,40,0.75)');
    glow.addColorStop(1, 'rgba(160,30,10,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (burst) ctx.drawImage(burst, x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
    ctx.restore();
  }

  const sunImage = images.get(spriteUrl('solmiel', 'sun'));
  for (const sun of state.suns) {
    if (!sunImage) break;
    const age = t - sun.bornAt;
    const fadeOut = Math.max(0, (age - (TIMING.sunLifetime - TICKS_PER_SECOND * 2)) / (TICKS_PER_SECOND * 2));
    const pulse = 1 + Math.sin(age / 6) * 0.05;
    const size = 0.7 * v.scale * pulse;
    const x = screenX(v, sun.x);
    const y = screenY(v, sun.prevY + (sun.y - sun.prevY) * alpha);
    ctx.save();
    ctx.globalAlpha = 1 - fadeOut * 0.7;
    ctx.drawImage(sunImage, x - size / 2, y - size / 2, size, (size * sunImage.height) / sunImage.width);
    ctx.restore();
  }
}

export const PLANT_COST = (kind: PlantKind) => PLANTS[kind].cost;
