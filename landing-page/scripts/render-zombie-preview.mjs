import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, CLIPS, renderZombie } from '../public/zombis-vivos/runtime/zombie-rig.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/zombis-vivos/', import.meta.url));
const out = path.join(root, 'preview'); await mkdir(out, { recursive: true });
const cast = [];
for (const character of ZOMBIES) {
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
    [name, await loadImage(path.join(root, 'characters', character.id, 'parts', `${name}.png`))])));
  cast.push({ character, parts });
}
const WIDTH = 960, HEIGHT = 364, FPS = 30;
function scene(clip, time, background = false) {
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#334846'; ctx.font = 'bold 18px Trebuchet MS';
    ctx.fillText(CLIPS[clip].label, 20, 25);
    ctx.strokeStyle = '#d1d6c3'; ctx.beginPath(); ctx.moveTo(16, 311); ctx.lineTo(944, 311); ctx.stroke();
  }
  cast.forEach(({ character, parts }, index) => {
    const localClip = character.clips.includes(clip) ? clip : 'idle';
    ctx.save(); ctx.translate(index * 320, 26);
    renderZombie(ctx, character, parts, localClip, Math.min(time, CLIPS[localClip].duration),
      { armorRatio: clip === 'fall' ? 0 : 1 });
    ctx.restore();
    if (background) {
      ctx.fillStyle = '#334846'; ctx.font = 'bold 17px Trebuchet MS'; ctx.textAlign = 'center';
      ctx.fillText(character.name, index * 320 + 160, 343); ctx.textAlign = 'start';
    }
  });
  return canvas;
}
await writeFile(path.join(out, 'lineup.png'), scene('idle', 0).toBuffer('image/png'));
const samples = [['idle', 0], ['walk', 0.9], ['bite', 0.52], ['hit', 0.13], ['armor-break', 0.44], ['fall', 1.2], ['spawn', 0.56]];
const contact = createCanvas(WIDTH, HEIGHT * samples.length), contactCtx = contact.getContext('2d');
samples.forEach(([clip, time], index) => contactCtx.drawImage(scene(clip, time, true), 0, index * HEIGHT));
await writeFile(path.join(out, 'poses.png'), contact.toBuffer('image/png'));
const timeline = [['idle', 1.2], ['walk', 2.4], ['bite', 1.2], ['hit', 0.6], ['armor-break', 0.8], ['fall', 1.4], ['spawn', 1]];
const frames = [];
for (const [clip, duration] of timeline) for (let index = 0; index < Math.round(duration * FPS); index++) {
  const canvas = scene(clip, index / FPS, true);
  frames.push(Buffer.from(canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data));
}
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
await input().webp({ quality: 91, effort: 3, loop: 0, delay }).toFile(path.join(out, 'movimientos.webp'));
const gifDelay = frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10);
await input().gif({ colours: 256, dither: 0.12, effort: 3, loop: 0, delay: gifDelay }).toFile(path.join(out, 'movimientos.gif'));
console.log(`Three-zombie preview: ${frames.length} frames / ${frames.length / FPS} s.`);
