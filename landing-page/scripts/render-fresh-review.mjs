import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHARACTERS, PlantAnimator, renderPlant } from '../public/plantas-vivas/runtime/plant-rig.mjs';
import { FreshPractice } from '../public/plantas-vivas/runtime/fresh-scene.mjs';
import { ZOMBIES } from '../public/zombis-vivos/runtime/zombie-rig.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
async function partsFor(character, assetRoot) {
  return Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
    [name, await loadImage(path.join(assetRoot, 'characters', character.id, 'parts', `${name}.png`))])));
}

const boxer = CHARACTERS.find(character => character.id === 'jengibron'), boxerParts = await partsFor(boxer, root);
const poses = [['Carga', 0.24], ['Jab · 22', 0.4], ['Carga del cruzado', 0.67], ['Cruzado · 34', 0.8], ['Recuperación', 1.1]];
const strip = createCanvas(1280, 292), pen = strip.getContext('2d');
pen.fillStyle = '#e8efda'; pen.fillRect(0, 0, strip.width, strip.height);
for (const [index, [label, time]] of poses.entries()) {
  pen.save(); pen.translate(index * 256, 0); pen.scale(0.8, 0.8); renderPlant(pen, boxer, boxerParts, 'attack', time); pen.restore();
  pen.fillStyle = '#315345'; pen.font = 'bold 14px Trebuchet MS'; pen.textAlign = 'center'; pen.fillText(label, index * 256 + 128, 274);
}
await writeFile(path.join(root, 'preview', 'combo-jengibron.png'), strip.toBuffer('image/png'));

const zombieRoot = fileURLToPath(new URL('../public/zombis-vivos/', import.meta.url));
const conero = ZOMBIES.find(character => character.id === 'conero');
const target = { character: conero, parts: await partsFor(conero, zombieRoot) };
const cast = [];
for (const character of CHARACTERS.filter(character => ['cilantro', 'limon', 'jengibron'].includes(character.id))) {
  const parts = await partsFor(character, root), practice = new FreshPractice(target, character);
  const shots = [];
  const animator = new PlantAnimator(character, parts, { onEvent: event => {
    if (event.type === 'punch') practice.receive(event);
    else shots.push({ event, x: event.position[0], y: event.position[1] });
  } });
  cast.push({ character, parts, practice, animator, shots });
}
const FPS = 30, WIDTH = 1200, HEIGHT = 330, frames = [];
for (let frame = 0; frame < 108; frame++) {
  const time = frame / FPS, canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8efda'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#c7d99d'; ctx.fillRect(0, 244, WIDTH, 43);
  for (const [index, item] of cast.entries()) {
    if (frame === 15 || frame === 63 && item.character.id === 'limon') item.animator.play('attack');
    item.practice.update(1 / FPS); item.animator.update(1 / FPS);
    for (const shot of item.shots) {
      shot.x += shot.event.velocity[0] / FPS;
      if (!shot.spent && shot.x >= item.practice.target.x) { item.practice.receive(shot.event); shot.spent = true; }
    }
    ctx.save(); ctx.translate(index * 400 + 10, 42); ctx.scale(0.7, 0.7);
    item.animator.draw(ctx); item.practice.draw(ctx, item.parts, false);
    for (const shot of item.shots.filter(shot => !shot.spent)) {
      const w = shot.event.type === 'aroma' ? 64 : 39, h = w * item.parts.projectile.height / item.parts.projectile.width;
      ctx.drawImage(item.parts.projectile, shot.x - w / 2, shot.y - h / 2, w, h);
    }
    ctx.restore();
    const state = item.practice.snapshot();
    ctx.fillStyle = '#315345'; ctx.font = 'bold 16px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText(item.character.name, index * 400 + 200, 291);
    ctx.font = '13px Trebuchet MS';
    ctx.fillText(`Armadura ${state.armor} · vida ${state.health} · impactos ${state.hits}`, index * 400 + 200, 314);
  }
  frames.push(Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data));
}
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
const delays = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
await input().webp({ quality: 87, effort: 3, loop: 0, delay: delays }).toFile(path.join(root, 'preview', 'combate-cilantro-limon-jengibron.webp'));
await input().gif({ colours: 256, dither: 0.1, effort: 3, loop: 0, delay: frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10) }).toFile(path.join(root, 'preview', 'combate-cilantro-limon-jengibron.gif'));
console.log('Combo poses and animated battle review exported at 30 FPS.');
