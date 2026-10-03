import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, CLIPS, renderZombie } from '../public/zombis-vivos/especiales-v4/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp'), flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag < 0 ? '@napi-rs/canvas' : process.argv[flag + 1]);
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v4/', import.meta.url)), out = path.join(root, 'preview');
await mkdir(out, { recursive: true });
const cast = [];
for (const c of ZOMBIES) {
  const rig = JSON.parse(await readFile(path.join(root, 'characters', c.id, 'rig.json'), 'utf8'));
  const parts = Object.fromEntries(await Promise.all(Object.keys(rig.parts).map(async name => [name, await loadImage(path.join(root, 'characters', c.id, 'parts', `${name}.png`))])));
  parts.rig = rig; cast.push({ c, parts });
}
const WIDTH = 960, HEIGHT = 450, FPS = 30;
function scene(action, seconds, helmetless = false) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#304442'; ctx.font = 'bold 19px Trebuchet MS';
  ctx.fillText(action === 'armor-break' ? 'Pierde sólo el casco' : action, 23, 30);
  ctx.strokeStyle = '#ccd3bd'; ctx.beginPath(); ctx.moveTo(25, 361); ctx.lineTo(935, 361); ctx.stroke();
  for (const [index, { c, parts }] of cast.entries()) {
    const clip = action === 'Avanzar' ? c.locomotion : action === 'Atacar' ? c.id === 'bruton' ? 'smash' : 'bite' : c.clips.includes(action) ? action : 'idle';
    const time = CLIPS[clip].loop ? seconds % CLIPS[clip].duration : Math.min(seconds, CLIPS[clip].duration - 1 / FPS);
    ctx.save(); ctx.translate(index * 480 + 240, 360); ctx.scale(c.recommendedScale, c.recommendedScale); ctx.translate(-160, -288);
    renderZombie(ctx, c, parts, clip, time, { armorRatio: helmetless && c.armor ? 0 : 1 }); ctx.restore();
    ctx.fillStyle = '#304442'; ctx.font = 'bold 22px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText(c.name, index * 480 + 240, 405); ctx.font = '14px Trebuchet MS'; ctx.fillText(c.role, index * 480 + 240, 431); ctx.textAlign = 'left';
  }
  return canvas;
}
await writeFile(path.join(out, 'conceptos.png'), scene('Personajes articulados por piezas', 0).toBuffer('image/png'));
for (const { c, parts } of cast) {
  const attack = c.id === 'bruton' ? 'smash' : 'bite';
  const samples = [['idle', 0], ...Array.from({ length: 7 }, (_, i) => [c.locomotion, i / 7 * CLIPS[c.locomotion].duration]),
    ...Array.from({ length: 7 }, (_, i) => [attack, i / 7 * CLIPS[attack].duration]),
    ...Array.from({ length: 7 }, (_, i) => ['fall', i / 6 * CLIPS.fall.duration]), ['hit', 0.12], [c.armor ? 'armor-break' : 'spawn', 0.3]];
  const sheet = createCanvas(6 * 256, 4 * 290), ctx = sheet.getContext('2d'); ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  for (const [i, [clip, seconds]] of samples.entries()) {
    const x = i % 6 * 256, y = Math.floor(i / 6) * 290;
    ctx.strokeStyle = '#ccd3bd'; ctx.beginPath(); ctx.moveTo(x, y + 230.4); ctx.lineTo(x + 256, y + 230.4); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.scale(0.8, 0.8); renderZombie(ctx, c, parts, clip, seconds); ctx.restore();
    ctx.fillStyle = '#304442'; ctx.font = '14px Trebuchet MS'; ctx.fillText(`${clip} · ${seconds.toFixed(2)} s`, x + 9, y + 269);
  }
  await writeFile(path.join(out, `${c.id}-revision.png`), sheet.toBuffer('image/png'));
}
if (!process.argv.includes('--stills-only')) {
  const frames = [], timeline = [['idle', 0.8], ['Avanzar', 2.4], ['Atacar', 1.4], ['armor-break', 0.6], ['Avanzar', 1.6, true], ['fall', 1.2, true], ['spawn', 0.6]];
  for (const [action, duration, bare] of timeline) for (let i = 0; i < Math.round(duration * FPS); i++) {
    const canvas = scene(action, i / FPS, bare); frames.push(Buffer.from(canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data));
  }
  const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
  await input().webp({ quality: 92, effort: 3, loop: 0, delay: frames.map((_, i) => Math.round((i + 1) * 1000 / FPS) - Math.round(i * 1000 / FPS)) }).toFile(path.join(out, 'movimientos.webp'));
  await input().gif({ colours: 256, dither: 0.1, effort: 3, loop: 0, delay: frames.map((_, i) => (Math.round((i + 1) * 100 / FPS) - Math.round(i * 100 / FPS)) * 10) }).toFile(path.join(out, 'movimientos.gif'));
  console.log(`Preview: ${frames.length} frames / ${frames.length / FPS} seconds.`);
}
