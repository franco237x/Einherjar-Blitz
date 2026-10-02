import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHARACTERS, ACTIVE_CHARACTERS, clipsFor, renderPlant, clipLabel } from '../public/plantas-vivas/runtime/plant-rig.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const out = path.join(root, 'preview'); await mkdir(out, { recursive: true });
const cast = [];
const newOnly = process.argv.includes('--new-only');
const defenseIce = process.argv.includes('--defense-ice');
const nocturne = process.argv.includes('--nocturne');
const fresh = process.argv.includes('--fresh');
const focus = defenseIce || newOnly || nocturne || fresh;
const focusIds = fresh ? ['cilantro', 'limon', 'jengibron'] : nocturne ? ['velaria'] : defenseIce ? ['cortezon', 'frigora'] : ['solmiel', 'granadin', 'aurelia'];
const selection = focus ? CHARACTERS.filter(character => focusIds.includes(character.id)) : ACTIVE_CHARACTERS;
for (const character of selection) {
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
    [name, await loadImage(path.join(root, 'characters', character.id, 'parts', `${name}.png`))])));
  cast.push({ character, parts });
}

const CELL = focus ? 320 : 256, ROW = focus ? 350 : 292, COLUMNS = Math.min(focus ? 4 : 5, cast.length);
const WIDTH = COLUMNS * CELL, HEIGHT = Math.ceil(cast.length / COLUMNS) * ROW, FPS = 30;
const suffix = fresh ? '-cilantro-limon-jengibron' : nocturne ? '-velaria' : defenseIce ? '-defensa-hielo' : newOnly ? '-nuevas' : '-v6';
function scene(clip, time, backdrop = false) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  if (backdrop) {
    ctx.fillStyle = '#e8efda'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#315345'; ctx.font = 'bold 18px Trebuchet MS';
    ctx.font = `bold ${focus ? 18 : 16}px Trebuchet MS`;
    ctx.fillText(nocturne ? `Velaria · ${clipLabel(cast[0].character, clip)}` : clip === 'attack' ? defenseIce ? 'Defensa y control del frío' : 'Cada planta, una acción' : clip === 'damaged' || clip === 'critical' ? 'Corteza y desgaste' : clip === 'spawn' ? 'Volver a brotar' : clip === 'celebrate' ? 'Celebración' : 'Un jardín con carácter', 18, 25);
  }
  cast.forEach(({ character, parts }, index) => {
    const x = index % COLUMNS * CELL, y = Math.floor(index / COLUMNS) * ROW;
    const scale = (CELL - 8) / 320;
    ctx.save(); ctx.translate(x + 4, y + 29); ctx.scale(scale, scale);
    const available = clipsFor(character);
    const localClip = clip === 'attack' ? character.primaryClip ?? 'attack' : available[clip] ? clip : 'idle';
    const idleTime = (time + index * 0.45) % 2.4;
    renderPlant(ctx, character, parts, localClip, localClip === 'idle' ? idleTime : Math.min(time, available[localClip].duration - 1 / FPS), { includeEmittedObjects: true });
    if (localClip === 'attack' && ['seed', 'thorn', 'spore', 'aroma', 'acid'].includes(character.attackStyle)) {
      const elapsed = time - character.projectileEvent;
      if (elapsed >= 0 && elapsed < 0.24) {
        const w = character.attackStyle === 'thorn' ? 42 : 31;
        const h = w * parts.projectile.height / parts.projectile.width;
        ctx.globalAlpha = 1 - elapsed / 0.24;
        ctx.drawImage(parts.projectile, character.muzzle[0] + elapsed * 210, character.muzzle[1] - h / 2, w, h);
      }
    }
    ctx.restore();
    if (backdrop) {
      ctx.fillStyle = '#315345'; ctx.font = `bold ${focus ? 16 : 14}px Trebuchet MS`; ctx.textAlign = 'center';
      ctx.fillText(defenseIce || clip === 'attack' ? `${character.name} · ${clipLabel(character, localClip)}` : character.name, x + CELL / 2, y + ROW - 12);
      ctx.textAlign = 'start';
    }
  });
  return canvas;
}
await writeFile(path.join(out, `lineup${suffix}.png`), scene('idle', 0).toBuffer('image/png'));
if (process.argv.includes('--lineup-only')) process.exit(0);
const primaryDuration = Math.max(...cast.map(({ character }) => clipsFor(character)[character.primaryClip ?? 'attack'].duration));
const timeline = nocturne ? [ ['idle', 1.2], ['seal', 1.4], ['channel', 2], ['recall', 1.2], ['recover', 1.4], ['hit', 0.8], ['spawn', 1.2], ['celebrate', 1.6] ]
  : defenseIce ? [ ['idle', 1.2], ['attack', 1.2], ['hit', 0.8], ['damaged', 1.2], ['critical', 1.2], ['spawn', 1.2], ['celebrate', 1.6] ]
  : [ ['idle', 1.2], ['attack', primaryDuration], ['spawn', 1.2], ['idle', 0.4], ['celebrate', 1.6] ];
const frames = [];
for (const [clip, duration] of timeline) for (let index = 0; index < Math.round(duration * FPS); index++) {
  const canvas = scene(clip, index / FPS, true);
  frames.push(Buffer.from(canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data));
}
const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
await input().webp({ quality: 89, effort: 3, loop: 0, delay }).toFile(path.join(out, `movimientos${suffix}.webp`));
const gifDelay = frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10);
await input().gif({ colours: 256, dither: 0.12, effort: 3, loop: 0, delay: gifDelay }).toFile(path.join(out, `movimientos${suffix}.gif`));
console.log(`Preview exported: ${frames.length} frames / ${(frames.length / FPS).toFixed(1)} seconds.`);
