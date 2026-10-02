import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CHARACTERS, PlantAnimator, createShadowRecall, markShadow, updateShadowRecall, clipLabel } from '../public/plantas-vivas/runtime/plant-rig.mjs';
import { createShadowTarget, advanceShadowTarget, drawShadowPractice } from '../public/plantas-vivas/runtime/shadow-scene.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url)), out = path.join(root, 'preview');
await mkdir(out, { recursive: true });
const character = CHARACTERS.find(item => item.id === 'velaria');
const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
  [name, await loadImage(path.join(root, 'characters', character.id, 'parts', `${name}.png`))])));
const state = createShadowRecall(), target = createShadowTarget();
let markCreated = false, flash = null, returns = 0;
const animator = new PlantAnimator(character, parts, { onEvent(event) {
  if (event.type === 'shadow-mark') markCreated = markShadow(state, event, target);
} });
const WIDTH = 720, HEIGHT = 430, FPS = 30, SECONDS = 8.8;
const frames = [], samples = [], sampleTimes = [0.5, 1.8, 2.8, 3.4, 3.8, 4.9];
for (let frame = 0; frame < SECONDS * FPS; frame++) {
  const time = frame / FPS, delta = frame === 0 ? 0 : 1 / FPS;
  if (frame === 27) animator.play('seal');
  markCreated = false; advanceShadowTarget(target, delta);
  if (flash) flash.remaining = Math.max(0, flash.remaining - delta);
  animator.update(delta);
  for (const event of updateShadowRecall(state, markCreated ? 0 : delta, target)) {
    if (event.type === 'shadow-recall-start') { animator.play('recall'); animator.seconds = event.elapsed; }
    if (event.type === 'shadow-rewind') { flash = { event, remaining: 0.55 }; returns++; }
  }
  const canvas = createCanvas(WIDTH, HEIGHT), ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#dcd5e7'); sky.addColorStop(0.77, '#ebe7eb'); sky.addColorStop(0.771, '#bcc8aa'); sky.addColorStop(1, '#cad3b8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#473755'; ctx.font = 'bold 24px Trebuchet MS'; ctx.fillText('VELARIA', 26, 34);
  ctx.font = '13px Trebuchet MS'; ctx.fillText('Eco umbrío · la sombra recuerda su lugar', 26, 55);
  ctx.textAlign = 'right'; ctx.fillText(clipLabel(character, animator.clip), WIDTH - 26, 34); ctx.textAlign = 'start';
  ctx.save(); ctx.translate(42, 4); ctx.scale(1.28, 1.28);
  ctx.fillStyle = '#393d3826'; ctx.beginPath(); ctx.ellipse(150, 288, 54, 7, 0, 0, Math.PI * 2); ctx.fill();
  animator.draw(ctx); drawShadowPractice(ctx, parts, state, target, { clock: time, flash }); ctx.restore();
  const active = ['marked', 'recalling'].includes(state.phase);
  const label = active ? `Sombra anclada · ${state.remaining.toFixed(1)} s` : flash?.remaining > 0 ? 'Retorno al ancla'
    : state.phase === 'cooldown' ? 'Recargando el eco' : 'Lista · objetivo en movimiento';
  ctx.fillStyle = '#473755'; ctx.font = '13px Trebuchet MS'; ctx.fillText(label, 26, 416);
  ctx.fillStyle = '#7d71823d'; ctx.fillRect(318, 405, 180, 6);
  ctx.fillStyle = '#775893'; ctx.fillRect(318, 405, 180 * (1 - state.cooldownRemaining / character.shadow.cooldownSeconds), 6);
  ctx.font = '11px Trebuchet MS'; ctx.fillStyle = '#473755'; ctx.fillText(`Recarga ${state.cooldownRemaining.toFixed(1)} s`, 508, 412);
  ctx.textAlign = 'right'; ctx.fillText(`Retornos ${returns}`, WIDTH - 26, 412);
  frames.push(Buffer.from(ctx.getImageData(0, 0, WIDTH, HEIGHT).data));
  if (sampleTimes.some(sample => frame === Math.round(sample * FPS))) samples.push(canvas.toBuffer('image/png'));
}
assert.equal(returns, 1); assert.equal(state.phase, 'ready'); assert.equal(target.health, 100);
const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
const input = () => sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT } });
await input().webp({ quality: 90, effort: 3, loop: 0, delay }).toFile(path.join(out, 'eco-umbrio.webp'));
const gifDelay = frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10);
await input().gif({ colours: 256, dither: 0.12, effort: 3, loop: 0, delay: gifDelay }).toFile(path.join(out, 'eco-umbrio.gif'));
const sheet = createCanvas(1080, 430), sheetCtx = sheet.getContext('2d');
for (const [index, buffer] of samples.entries()) sheetCtx.drawImage(await loadImage(buffer), index % 3 * 360, Math.floor(index / 3) * 215, 360, 215);
await writeFile(path.join(out, 'eco-umbrio-pasos.png'), sheet.toBuffer('image/png'));
console.log(`Eco umbrío: ${frames.length} frames, one rewind, full recovery and cooldown, unchanged target health.`);
