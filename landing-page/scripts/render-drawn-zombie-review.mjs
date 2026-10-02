import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, CLIPS, renderZombie } from '../public/zombis-vivos/especiales-v3/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag < 0 ? '@napi-rs/canvas' : process.argv[flag + 1]);
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v3/', import.meta.url));
const out = path.join(root, 'preview'); await mkdir(out, { recursive: true });
const cast = [];
for (const character of ZOMBIES) {
  const parts = Object.fromEntries(await Promise.all([...character.sheets, ...(character.armor ? ['gear', 'pads'] : [])].map(async name =>
    [name, await loadImage(path.join(root, 'characters', character.id, 'poses', `${name}.png`))])));
  cast.push({ character, parts });
}
const WIDTH = 960, HEIGHT = 450, FPS = 30;
function scene(action, seconds, bare = false) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#304442'; ctx.font = 'bold 19px Trebuchet MS';
  ctx.fillText(CLIPS[action]?.label ?? action, 23, 30);
  ctx.strokeStyle = '#ccd3bd'; ctx.beginPath(); ctx.moveTo(25, 361); ctx.lineTo(935, 361); ctx.stroke();
  for (const [index, { character, parts }] of cast.entries()) {
    const clip = action === 'Avanzar' ? character.locomotion : action === 'Atacar' ? character.id === 'bruton' ? 'smash' : 'bite'
      : character.clips.includes(action) ? action : 'idle';
    const time = CLIPS[clip].loop ? seconds % CLIPS[clip].duration : Math.min(seconds, CLIPS[clip].duration - 1 / FPS);
    ctx.save(); ctx.translate(index * 480 + 240, 360); ctx.scale(character.recommendedScale, character.recommendedScale); ctx.translate(-160, -288);
    renderZombie(ctx, character, parts, clip, time, { armorRatio: bare && character.armor ? 0 : 1 }); ctx.restore();
    ctx.fillStyle = '#304442'; ctx.font = 'bold 22px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText(character.name, index * 480 + 240, 405);
    ctx.font = '14px Trebuchet MS'; ctx.fillText(character.role, index * 480 + 240, 431); ctx.textAlign = 'left';
  }
  return canvas;
}
await writeFile(path.join(out, 'conceptos.png'), scene('Poses completas', 0).toBuffer('image/png'));
const samples = [['idle', 0], ['Avanzar', 0.27], ['Atacar', 0.74], ['hit', 0.13], ['armor-break', 0.3], ['Avanzar', 0.27, true], ['fall', 0.79, true], ['spawn', 0.4]];
const sheet = createCanvas(WIDTH, HEIGHT * samples.length), sctx = sheet.getContext('2d');
for (const [index, sample] of samples.entries()) sctx.drawImage(scene(...sample), 0, index * HEIGHT);
await writeFile(path.join(out, 'poses.png'), sheet.toBuffer('image/png'));
const frames = [], timeline = [['idle', 1], ['Avanzar', 2.4], ['Atacar', 1.2], ['hit', 0.4], ['armor-break', 0.6], ['Avanzar', 0.8, true], ['fall', 0.8, true], ['spawn', 0.6]];
for (const [action, duration, bare] of timeline) for (let index = 0; index < Math.round(duration * FPS); index++) {
  const canvas = scene(action, index / FPS, bare); frames.push(Buffer.from(canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data));
}
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
await input().webp({ quality: 93, effort: 3, loop: 0, delay }).toFile(path.join(out, 'movimientos.webp'));
await input().gif({ colours: 256, dither: 0.1, effort: 3, loop: 0,
  delay: frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10) }).toFile(path.join(out, 'movimientos.gif'));
console.log(`Drawn-zombie preview: ${frames.length} frames / ${frames.length / FPS} seconds.`);
