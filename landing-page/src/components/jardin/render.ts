import {
  COLS,
  ROWS,
  TICKS_PER_SECOND,
  TIMING,
  hasArmor,
  isFrozen,
  isSlowed,
  type JardinState,
  type PlantKind,
} from '@/lib/jardin/engine';
import {
  ATLAS_COLUMNS,
  BACKGROUND_URL,
  FRAME_PX_PER_CELL,
  FRAME_SIZE,
  MOWER_CLIPS,
  MOWER_PIVOT,
  PLANT_CLIPS,
  PLANT_PIVOT,
  PROJECTILE_IMAGES,
  ZOMBIE_CLIPS,
  ZOMBIE_SCALE,
  ZOMBIE_PIVOT,
  frameIndex,
  spriteUrl,
  zombieSpriteName,
  type ClipInfo,
} from '@/lib/jardin/sprites';

// World layout in cell units: house strip, 9 lawn columns, zombie entry.
// One cell unit is 200 px of the 2320×1390 garden background.
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

/**
 * Fits the garden inside the canvas minus `insetLeft` (the seed packet
 * column, drawn over the scenery as in PvZ 2). The rest of the canvas shows
 * the background extended to the edges.
 */
export function computeViewport(width: number, height: number, insetLeft = 0): Viewport {
  const room = Math.max(1, width - insetLeft);
  const scale = Math.min(room / WORLD_W, height / WORLD_H);
  return {
    width,
    height,
    scale,
    ox: insetLeft + (room - WORLD_W * scale) / 2,
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
  const radius = 0.6 * v.scale;
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
  if (!image) return false;
  const sx = (frame % ATLAS_COLUMNS) * FRAME_SIZE;
  const sy = Math.floor(frame / ATLAS_COLUMNS) * FRAME_SIZE;
  ctx.drawImage(image, sx, sy, FRAME_SIZE, FRAME_SIZE, x - pivot.x * size, y - pivot.y * size, size, size);
  return true;
}

/** Placeholder while a character's atlas is still downloading. */
function drawPortrait(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined, x: number, y: number, size: number) {
  if (!image) return;
  const w = size * 0.6;
  ctx.drawImage(image, x - w / 2, y - w * 0.95, w, w);
}

let lawnCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function drawLawn(ctx: CanvasRenderingContext2D, v: Viewport, dpr: number, background?: HTMLImageElement) {
  const key = `${v.width}x${v.height}@${dpr}:${background ? 'art' : 'flat'}`;
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
    if (background) {
      c.imageSmoothingQuality = 'high';
      // Extend the scenery to the screen edges: the same art, scaled to
      // cover and darkened, behind the exact garden.
      const cover = Math.max(v.width / background.width, v.height / background.height);
      const cw = background.width * cover;
      const ch = background.height * cover;
      c.save();
      c.filter = 'blur(6px) brightness(0.55)';
      c.drawImage(background, (v.width - cw) / 2, (v.height - ch) / 2, cw, ch);
      c.restore();
      c.save();
      c.shadowColor = 'rgba(0,0,0,0.6)';
      c.shadowBlur = 24;
      c.drawImage(background, v.ox, v.oy, WORLD_W * v.scale, WORLD_H * v.scale);
      c.restore();
    } else {
      c.fillStyle = '#3a2a1d';
      c.fillRect(v.ox, screenY(v, 0), LEFT * v.scale, ROWS * CELL_H * v.scale);
      c.fillStyle = '#4a4034';
      c.fillRect(screenX(v, COLS), screenY(v, 0), RIGHT * v.scale, ROWS * CELL_H * v.scale);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const light = (row + col) % 2 === 0;
          c.fillStyle = light ? '#6aa641' : '#5c9638';
          c.fillRect(screenX(v, col), screenY(v, row), v.scale + 0.5, CELL_H * v.scale + 0.5);
        }
      }
    }
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

function withFilter(ctx: CanvasRenderingContext2D, filter: string | null, draw: () => void) {
  if (!filter) return draw();
  ctx.save();
  ctx.filter = filter;
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
  drawLawn(ctx, v, dpr, images.get(BACKGROUND_URL));

  if (hover) {
    ctx.fillStyle = hover.valid ? 'rgba(255,255,255,0.2)' : 'rgba(255,60,60,0.25)';
    ctx.fillRect(screenX(v, hover.col), screenY(v, hover.row), v.scale, CELL_H * v.scale);
  }

  for (let row = 0; row < ROWS; row++) {
    const mower = state.mowers[row];
    if (mower && !mower.gone) {
      const x = screenX(v, mower.prevX + (mower.x - mower.prevX) * alpha);
      drawFrame(
        ctx,
        images.get(spriteUrl('podadora', mower.clip)),
        frameIndex(MOWER_CLIPS[mower.clip], t - mower.clipStart),
        x,
        groundY(v, row),
        spriteSize,
        MOWER_PIVOT,
      );
    }

    for (const plant of state.plants) {
      if (plant.row !== row) continue;
      const x = screenX(v, plant.col + 0.5);
      const y = groundY(v, row);
      shadow(ctx, x, y, 0.34 * v.scale);
      const clips = PLANT_CLIPS[plant.kind];
      const clipName = clips[plant.clip] ? plant.clip : 'idle';
      const clip = clips[clipName] as ClipInfo;
      const digesting = state.tick < plant.digestUntil;
      const filter = t - plant.lastHit < 4 ? 'brightness(1.7)' : digesting ? 'saturate(0.6) brightness(0.92)' : null;
      withFilter(ctx, filter, () => {
        const drawn = drawFrame(
          ctx,
          images.get(spriteUrl(plant.kind, clipName)),
          frameIndex(clip, t - plant.clipStart),
          x,
          y,
          spriteSize,
          PLANT_PIVOT,
        );
        if (!drawn) drawPortrait(ctx, images.get(spriteUrl(plant.kind, 'portrait')), x, y, spriteSize);
      });
      if (digesting) {
        const left = (plant.digestUntil - t) / TIMING.zarzinaDigest;
        const w = 0.6 * v.scale;
        const bx = x - w / 2;
        const by = screenY(v, row + 0.08);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(bx, by, w, 0.07 * v.scale);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(bx, by, w * (1 - left), 0.07 * v.scale);
      }
    }

    if (hover && hover.kind !== 'shovel' && hover.valid && hover.row === row) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      const x = screenX(v, hover.col + 0.5);
      const y = groundY(v, row);
      const idle = images.get(spriteUrl(hover.kind, 'idle'));
      if (!drawFrame(ctx, idle, 0, x, y, spriteSize, PLANT_PIVOT))
        drawPortrait(ctx, images.get(spriteUrl(hover.kind, 'portrait')), x, y, spriteSize);
      ctx.restore();
    }

    for (const projectile of state.projectiles) {
      if (projectile.row !== row) continue;
      const art = PROJECTILE_IMAGES[projectile.kind];
      const image = images.get(art.url);
      const x = screenX(v, projectile.prevX + (projectile.x - projectile.prevX) * alpha);
      const y = screenY(v, row + art.y);
      const w = art.size * v.scale;
      if (image) {
        const h = (w * image.height) / image.width;
        ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
      } else {
        ctx.fillStyle = projectile.kind === 'frost' ? '#bae6fd' : '#a16207';
        ctx.beginPath();
        ctx.arc(x, y, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const zombies = state.zombies.filter((zombie) => zombie.row === row).sort((a, b) => b.x - a.x);
    for (const zombie of zombies) {
      const x = screenX(v, zombie.prevX + (zombie.x - zombie.prevX) * alpha);
      const y = groundY(v, row);
      const clip = ZOMBIE_CLIPS[zombie.kind][zombie.clip] ?? ZOMBIE_CLIPS[zombie.kind].walk!;
      const size = spriteSize * (ZOMBIE_SCALE[zombie.kind] ?? 1);
      const name = zombieSpriteName(zombie.kind, zombie.clip, hasArmor(zombie));
      ctx.save();
      if (zombie.clip === 'fall') {
        const fade = (t - zombie.clipStart - TIMING.zombieFall) / TIMING.corpseLinger;
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - fade));
      } else {
        shadow(ctx, x, y, 0.3 * v.scale);
      }
      const frozen = isFrozen(state, zombie);
      const filter =
        zombie.clip === 'fall'
          ? null
          : frozen
            ? 'saturate(0.3) hue-rotate(170deg) brightness(1.25)'
            : isSlowed(state, zombie)
              ? 'saturate(0.6) hue-rotate(150deg) brightness(1.1)'
              : t < zombie.dazedUntil
                ? 'sepia(0.4) hue-rotate(50deg) saturate(1.4)'
                : t - zombie.lastHit < 4
                ? 'brightness(1.7)'
                : null;
      withFilter(ctx, filter, () => {
        const drawn = drawFrame(
          ctx,
          images.get(spriteUrl(zombie.kind, name)),
          frameIndex(clip, zombie.anim),
          x,
          y,
          size,
          ZOMBIE_PIVOT,
        );
        if (!drawn) drawPortrait(ctx, images.get(spriteUrl(zombie.kind, 'portrait')), x, y, size);
      });
      ctx.restore();
    }
  }

  const burst = images.get(spriteUrl('granadin', 'burst'));
  const impact = images.get(spriteUrl('jengibron', 'impact'));
  for (const effect of state.effects) {
    const p = (t - effect.tick) / TICKS_PER_SECOND;
    const x = screenX(v, effect.col + 0.5);
    const y = screenY(v, effect.row + 0.5);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p);
    if (effect.type === 'blast') {
      const r = (0.6 + p * 1.6) * v.scale;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, 'rgba(255,240,180,0.95)');
      glow.addColorStop(0.45, 'rgba(255,140,40,0.75)');
      glow.addColorStop(1, 'rgba(160,30,10,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (burst) ctx.drawImage(burst, x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
    } else if (effect.type === 'punch') {
      const r = (0.32 + p * 0.5) * v.scale;
      const px = screenX(v, effect.col + 0.15);
      const py = screenY(v, effect.row + 0.45);
      if (impact) ctx.drawImage(impact, px - r, py - r, r * 2, r * 2);
    } else if (effect.type === 'chomp') {
      ctx.fillStyle = 'rgba(244,114,182,0.85)';
      ctx.font = `bold ${Math.round(0.32 * v.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('¡ÑAM!', x + 0.6 * v.scale, y - 0.5 * v.scale - p * 0.4 * v.scale);
    }
    ctx.restore();
  }

  const sunImage = images.get(spriteUrl('solmiel', 'sun'));
  for (const sun of state.suns) {
    if (!sunImage) break;
    const age = t - sun.bornAt;
    const fadeOut = Math.max(0, (age - (TIMING.sunLifetime - TICKS_PER_SECOND * 2)) / (TICKS_PER_SECOND * 2));
    const pulse = 1 + Math.sin(age / 6) * 0.06;
    const size = 0.88 * v.scale * pulse;
    const x = screenX(v, sun.x);
    const y = screenY(v, sun.prevY + (sun.y - sun.prevY) * alpha);
    ctx.save();
    ctx.globalAlpha = 1 - fadeOut * 0.7;
    // Bright halo so the sun reads against yellow flowers and light grass.
    const halo = ctx.createRadialGradient(x, y, size * 0.15, x, y, size * 0.85);
    halo.addColorStop(0, 'rgba(255,255,220,0.95)');
    halo.addColorStop(0.45, 'rgba(255,214,80,0.55)');
    halo.addColorStop(1, 'rgba(255,170,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(120,60,0,0.65)';
    ctx.shadowBlur = size * 0.12;
    ctx.drawImage(sunImage, x - size / 2, y - size / 2, size, (size * sunImage.height) / sunImage.width);
    ctx.restore();
  }
}
