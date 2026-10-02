import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, CLIPS, renderZombie } from '../public/zombis-vivos/especiales-v2/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v2/', import.meta.url)), out = path.join(root, 'preview');
await mkdir(out, { recursive: true });
const cast = [];
for (const character of ZOMBIES) {
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
    [name, await loadImage(path.join(root, 'characters', character.id, 'parts', name + '.png'))])));
  cast.push({ character, parts });
}
const WIDTH = 960, HEIGHT = 450, FPS = 30;
function scene(action, seconds, unarmored = false) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#304442'; ctx.font = 'bold 19px Trebuchet MS'; ctx.fillText(action, 23, 30);
  ctx.strokeStyle = '#ccd3bd'; ctx.beginPath(); ctx.moveTo(25, 361); ctx.lineTo(935, 361); ctx.stroke();
  for (const [index, { character, parts }] of cast.entries()) {
    const clip = action === 'Avanzar' ? character.locomotion : action === 'Atacar' ? character.id === 'bruton' ? 'smash' : 'bite'
      : character.clips.includes(action) ? action : 'idle';
    const time = CLIPS[clip].loop ? seconds * (clip === 'walk' ? character.gaitTempo : 1) % CLIPS[clip].duration : Math.min(seconds, CLIPS[clip].duration - 1 / FPS);
    const scale = character.recommendedScale;
    ctx.save(); ctx.translate(index * 480 + 240, 360); ctx.scale(scale, scale); ctx.translate(-160, -288);
    renderZombie(ctx, character, parts, clip, time, { armorRatio: unarmored && character.armor ? 0 : 1 }); ctx.restore();
    ctx.fillStyle = '#304442'; ctx.font = 'bold 22px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText(character.name, index * 480 + 240, 405);
    ctx.font = '14px Trebuchet MS'; ctx.fillText(character.role, index * 480 + 240, 431); ctx.textAlign = 'left';
  }
  return canvas;
}
await writeFile(path.join(out, 'conceptos.png'), scene('Dos invasores especiales', 0).toBuffer('image/png'));
const samples = [['idle', 0], ['Avanzar', 0.25], ['Atacar', 0.86], ['hit', 0.13], ['armor-break', 0.42], ['Avanzar', 0.25, true], ['fall', 1.36, true], ['spawn', 0.6]];
const contact = createCanvas(WIDTH, HEIGHT * samples.length), contactCtx = contact.getContext('2d');
for (const [index, sample] of samples.entries()) contactCtx.drawImage(scene(...sample), 0, index * HEIGHT);
await writeFile(path.join(out, 'poses.png'), contact.toBuffer('image/png'));
const frames = [], timeline = [['idle', 1.2], ['Avanzar', 2.4], ['Atacar', 1.6], ['hit', 0.6],
  ['armor-break', 0.8], ['Avanzar', 0.8, true], ['fall', 1.4, true], ['spawn', 1]];
for (const [action, duration, unarmored] of timeline) for (let frame = 0; frame < Math.round(duration * FPS); frame++) {
  const canvas = scene(action, frame / FPS, unarmored);
  frames.push(Buffer.from(canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data));
}
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
const delays = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
await input().webp({ quality: 91, effort: 3, loop: 0, delay: delays }).toFile(path.join(out, 'movimientos.webp'));
await input().gif({ colours: 256, dither: 0.12, effort: 3, loop: 0,
  delay: frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10) }).toFile(path.join(out, 'movimientos.gif'));
console.log('Special-zombie preview: ' + frames.length + ' frames / ' + frames.length / FPS + ' seconds.');
