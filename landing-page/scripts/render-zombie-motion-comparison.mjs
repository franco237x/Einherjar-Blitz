import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as first from '../public/zombis-vivos/runtime/zombie-rig.mjs';
import * as special from '../public/zombis-vivos/especiales-v4/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag < 0 ? '@napi-rs/canvas' : process.argv[flag + 1]);
const root = fileURLToPath(new URL('../public/zombis-vivos/', import.meta.url));
const out = path.join(root, 'especiales-v4', 'preview');
await mkdir(out, { recursive: true });
const cast = [];
for (const [module, directory] of [[first, root], [special, path.join(root, 'especiales-v4')]]) {
  for (const c of module.ZOMBIES) {
    const rig = module === special ? JSON.parse(await readFile(path.join(directory, 'characters', c.id, 'rig.json'), 'utf8')) : null;
    const names = rig ? Object.keys(rig.parts) : c.partNames.filter(name => name !== 'reference');
    const parts = Object.fromEntries(await Promise.all(names.map(async name => [name, await loadImage(path.join(directory, 'characters', c.id, 'parts', `${name}.png`))])));
    if (rig) parts.rig = rig;
    cast.push({ c, parts, module });
  }
}
const width = 1220, height = 440, fps = 30, count = 72, frames = [];
const centers = [126, 338, 547, 819, 1081];
for (let frame = 0; frame < count; frame++) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#304442'; ctx.font = 'bold 18px Trebuchet MS';
  ctx.fillText('Los tres primeros', 22, 29); ctx.fillText('Especiales · movimiento corregido', 658, 29);
  ctx.strokeStyle = '#ccd3bd'; ctx.beginPath(); ctx.moveTo(24, 350); ctx.lineTo(width - 24, 350); ctx.stroke();
  for (const [i, { c, parts, module }] of cast.entries()) {
    const scale = c.recommendedScale ?? 1, clip = c.locomotion ?? 'walk';
    ctx.save(); ctx.translate(centers[i], 350); ctx.scale(scale, scale); ctx.translate(-160, -288);
    module.renderZombie(ctx, c, parts, clip, frame / fps % module.CLIPS[clip].duration); ctx.restore();
    ctx.fillStyle = '#304442'; ctx.font = 'bold 19px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText(c.name, centers[i], 396);
    ctx.font = '13px Trebuchet MS'; ctx.fillText(c.role, centers[i], 419); ctx.textAlign = 'left';
  }
  if (frame === 0) await writeFile(path.join(out, 'comparacion-primeros.png'), canvas.toBuffer('image/png'));
  frames.push(Buffer.from(ctx.getImageData(0, 0, width, height).data));
}
const input = () => sharp(Buffer.concat(frames), { raw: { width, height: height * count, channels: 4, pageHeight: height } });
const ms = Array.from({ length: count }, (_, i) => Math.round((i + 1) * 1000 / fps) - Math.round(i * 1000 / fps));
await input().webp({ quality: 92, effort: 3, loop: 0, delay: ms }).toFile(path.join(out, 'comparacion-primeros.webp'));
await input().gif({ colours: 256, dither: 0.1, effort: 3, loop: 0, delay: ms.map((_, i) => (Math.round((i + 1) * 100 / fps) - Math.round(i * 100 / fps)) * 10) }).toFile(path.join(out, 'comparacion-primeros.gif'));
console.log('Original three and corrected special zombies rendered in one 2.4-second loop.');
