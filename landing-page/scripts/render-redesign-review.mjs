import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHARACTERS, CLIPS, renderPlant, clipLabel } from '../public/plantas-vivas/estetica-v7/runtime/plant-rig.mjs';

const require = createRequire(import.meta.url), flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const previous = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const root = path.join(previous, 'estetica-v7'), out = path.join(root, 'preview');
await mkdir(out, { recursive: true });
const cast = [];
for (const character of CHARACTERS) {
  const parts = Object.fromEntries(await Promise.all(character.partNames.filter(name => name !== 'reference').map(async name =>
    [name, await loadImage(path.join(root, 'characters', character.id, 'parts', `${name}.png`))])));
  cast.push({ character, parts });
}
function sheet(width, height) {
  const canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f2df'; ctx.fillRect(0, 0, width, height); return { canvas, ctx };
}
function label(ctx, text, x, y, size = 18, align = 'left', color = '#345241') {
  ctx.font = `bold ${size}px Trebuchet MS`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y);
}

const concept = sheet(1320, 610);
label(concept.ctx, 'ESTÉTICA V7 · EINHERJAR BLITZ', 35, 39, 14, 'left', '#788462');
label(concept.ctx, 'Un coro. Un fuelle. Un mazazo.', 35, 94, 39);
const notes = ['Tres caras y tres voces desparejas.', 'La cáscara forma un cuerpo elástico.', 'Toda la raíz es la masa del golpe.'];
for (const [index, { character, parts }] of cast.entries()) {
  const x = index * 440;
  concept.ctx.save(); concept.ctx.translate(x + 35, 143); concept.ctx.scale(1.15, 1.15);
  renderPlant(concept.ctx, character, parts, 'idle', 0); concept.ctx.restore();
  label(concept.ctx, character.name, x + 220, 513, 26, 'center');
  label(concept.ctx, notes[index], x + 220, 546, 16, 'center', '#68705b');
}
await writeFile(path.join(out, 'conceptos-v7.png'), concept.canvas.toBuffer('image/png'));

const comparison = sheet(1320, 830);
label(comparison.ctx, 'ANTES · V6', 27, 37, 18, 'left', '#788462');
label(comparison.ctx, 'REDISEÑO · V7', 27, 448, 18);
comparison.ctx.strokeStyle = '#d4dbc0'; comparison.ctx.beginPath(); comparison.ctx.moveTo(25, 407); comparison.ctx.lineTo(1295, 407); comparison.ctx.stroke();
for (const [index, { character }] of cast.entries()) {
  const x = index * 440;
  const oldPortrait = await loadImage(path.join(previous, 'characters', character.id, 'portrait.png'));
  const newPortrait = await loadImage(path.join(root, 'characters', character.id, 'portrait.png'));
  comparison.ctx.drawImage(oldPortrait, x + 58, 47, 320, 320);
  comparison.ctx.drawImage(newPortrait, x + 58, 458, 320, 320);
  label(comparison.ctx, ['Cilantro', 'Limón', 'Jengibrón'][index], x + 220, 389, 20, 'center', '#788462');
  label(comparison.ctx, character.name, x + 220, 800, 23, 'center');
}
await writeFile(path.join(out, 'antes-despues-v7.png'), comparison.canvas.toBuffer('image/png'));

const clips = ['idle', 'attack', 'hit', 'spawn', 'celebrate'], poses = sheet(960, 5 * 344);
for (const [col, { character }] of cast.entries()) for (const [row, clip] of clips.entries()) {
  const seconds = clip === 'attack' ? character.projectileEvent + 0.05 : clip === 'hit' ? 0.12 : clip === 'spawn' ? 0.6 : clip === 'celebrate' ? 0.4 : 0;
  const frame = Math.min(CLIPS[clip].frames - 1, Math.round(seconds * 30));
  const atlas = await loadImage(path.join(root, 'characters', character.id, 'sprites', `${clip}.png`));
  poses.ctx.drawImage(atlas, frame % 8 * 256, Math.floor(frame / 8) * 256, 256, 256, col * 320, row * 344, 320, 320);
  label(poses.ctx, `${character.name} · ${clipLabel(character, clip)}`, col * 320 + 160, row * 344 + 335, 14, 'center');
}
await writeFile(path.join(out, 'poses-v7.png'), poses.canvas.toBuffer('image/png'));

const combo = sheet(1280, 295), gavel = cast.find(item => item.character.id === 'jengibron');
for (const [index, [title, seconds]] of [['Carga', 0.22], ['Tanteo · 22', 0.4], ['Carga del mazazo', 0.67], ['Mazazo · 34', 0.8], ['Recuperación', 1.1]].entries()) {
  combo.ctx.save(); combo.ctx.translate(index * 256, 0); combo.ctx.scale(0.8, 0.8);
  renderPlant(combo.ctx, gavel.character, gavel.parts, 'attack', seconds); combo.ctx.restore();
  label(combo.ctx, title, index * 256 + 128, 277, 15, 'center');
}
await writeFile(path.join(out, 'mazazo-v7.png'), combo.canvas.toBuffer('image/png'));
console.log('Concept board, before/after comparison, 15 atlas poses and gavel timing strip exported.');
