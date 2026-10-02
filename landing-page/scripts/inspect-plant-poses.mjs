import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CHARACTERS, CLIPS, clipsFor, clipLabel } from '../public/plantas-vivas/runtime/plant-rig.mjs';
const require = createRequire(import.meta.url), flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const newOnly = process.argv.includes('--new-only');
const defenseIce = process.argv.includes('--defense-ice');
const nocturne = process.argv.includes('--nocturne');
const fresh = process.argv.includes('--fresh');
const selection = fresh ? CHARACTERS.filter(character => ['cilantro', 'limon', 'jengibron'].includes(character.id)) : nocturne ? CHARACTERS.filter(character => character.id === 'velaria') : defenseIce ? CHARACTERS.filter(character => ['cortezon', 'frigora'].includes(character.id)) : newOnly ? CHARACTERS.filter(character => ['solmiel', 'granadin', 'aurelia'].includes(character.id)) : CHARACTERS;
const CELL = newOnly || defenseIce || nocturne || fresh ? 320 : 224, ROW = CELL + 24;
const rows = Math.max(...selection.map(character => Object.keys(clipsFor(character)).length));
const canvas = createCanvas(selection.length * CELL, rows * ROW), ctx = canvas.getContext('2d');
ctx.fillStyle = '#e8efda'; ctx.fillRect(0, 0, canvas.width, canvas.height);
for (let col = 0; col < selection.length; col++) {
  const character = selection[col];
  for (const [row, clip] of Object.keys(clipsFor(character)).entries()) {
    const time = ['attack', 'guard', 'seal'].includes(clip) ? character.projectileEvent + 0.12 : clip === 'channel' ? 0.6 : clip === 'recall' ? character.shadow.recallLeadSeconds + 0.08 : clip === 'recover' ? 0.3 : clip === 'hit' ? 0.12 : clip === 'spawn' ? 0.6 : clip === 'celebrate' ? 0.4 : 0;
    const frame = Math.min(CLIPS[clip].frames - 1, Math.round(time * 30));
    const image = await loadImage(path.join(root, 'characters', character.id, 'sprites', `${clip}.png`));
    ctx.drawImage(image, frame % 8 * 256, Math.floor(frame / 8) * 256, 256, 256, col * CELL, row * ROW, CELL, CELL);
    ctx.fillStyle = '#315345'; ctx.font = 'bold 15px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText(`${character.name} · ${clipLabel(character, clip)}`, col * CELL + CELL / 2, row * ROW + CELL + 15);
  }
}
await writeFile(path.join(root, 'preview', fresh ? 'action-poses-cilantro-limon-jengibron.png' : nocturne ? 'action-poses-velaria.png' : defenseIce ? 'action-poses-defensa-hielo.png' : newOnly ? 'action-poses-nuevas.png' : 'action-poses-v6.png'), canvas.toBuffer('image/png'));
console.log(`${selection.reduce((n, character) => n + Object.keys(clipsFor(character)).length, 0)} exported action poses rendered for visual review.`);
