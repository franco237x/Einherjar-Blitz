// Builds the Jardín sprites from the full art pack.
//
// The pack (branch codex/plantas-zombis-assets) ships PNG atlases, GIF/WebP
// previews and sources (~340 MB). The game only needs some clips per
// character, so this script converts those atlases to WebP and writes them to
// public/jardin/, together with the garden background and the lane mower.
// Usage:
//
//   git archive origin/codex/plantas-zombis-assets \
//     landing-page/public/plantas-vivas/characters \
//     landing-page/public/zombis-vivos/characters \
//     landing-page/public/zombis-vivos/especiales-v4/characters \
//     landing-page/public/jardin-yggdrasil | tar -x -C /tmp/pack
//   node scripts/build-jardin-assets.mjs /tmp/pack/landing-page/public
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) {
  console.error('Uso: node scripts/build-jardin-assets.mjs <public del pack>');
  process.exit(1);
}
const out = path.resolve(import.meta.dirname, '../public/jardin');

const PLANT_BASE = ['idle', 'attack', 'spawn'];
const PLANTS = {
  solmiel: { clips: PLANT_BASE, extra: { 'sun.webp': 'parts/projectile.png' } },
  nabu: { clips: PLANT_BASE, extra: { 'seed.webp': 'parts/projectile.png' } },
  cortezon: { clips: ['idle', 'damaged', 'critical', 'spawn'] },
  granadin: { clips: ['idle', 'attack'], extra: { 'burst.webp': 'parts/projectile.png' } },
  mordiseta: { clips: PLANT_BASE, extra: { 'spore.webp': 'parts/projectile.png' } },
  cardon: { clips: PLANT_BASE, extra: { 'spine.webp': 'parts/projectile.png' } },
  frigora: { clips: PLANT_BASE, extra: { 'frost.webp': 'parts/projectile.png' } },
  zarzina: { clips: PLANT_BASE },
  cilantro: { clips: PLANT_BASE, extra: { 'aroma.webp': 'parts/projectile.png' } },
  limon: { clips: PLANT_BASE, extra: { 'acid.webp': 'parts/projectile.png' } },
  jengibron: { clips: PLANT_BASE, extra: { 'impact.webp': 'parts/effect.png' } },
};
const ZOMBIE_BASE = ['walk', 'bite', 'fall', 'spawn'];
// The special zombies (especiales-v4) name some clips differently; the game
// keeps its own names: `{ game clip: pack clip }`.
const same = (names) => Object.fromEntries(names.map((name) => [name, name]));
const ZOMBIES = {
  despistado: { clips: same(ZOMBIE_BASE) },
  conero: { clips: same([...ZOMBIE_BASE, 'armor-break']), unarmored: same(['walk', 'bite', 'fall']) },
  balderon: { clips: same([...ZOMBIE_BASE, 'armor-break']), unarmored: same(['walk', 'bite', 'fall']) },
  bruton: { pack: 'especiales-v4', clips: { walk: 'walk', bite: 'smash', fall: 'fall', spawn: 'spawn' } },
  rafago: {
    pack: 'especiales-v4',
    clips: { walk: 'run', bite: 'bite', fall: 'fall', spawn: 'spawn', 'armor-break': 'armor-break' },
    unarmoredDir: 'helmetless',
    unarmored: { walk: 'run', bite: 'bite', fall: 'fall' },
  },
};

const summary = {};
async function atlas(from, to, name, key) {
  const meta = JSON.parse(await readFile(`${from}.json`, 'utf8'));
  await sharp(`${from}.png`)
    .webp({ quality: 80, alphaQuality: 88, effort: 5 })
    .toFile(path.join(to, `${name}.webp`));
  summary[key][name] = { frames: meta.frames.length, loop: meta.meta.animation.loop };
}
async function still(file, target, width) {
  await sharp(file)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(target);
}

for (const [id, { clips, extra = {} }] of Object.entries(PLANTS)) {
  const from = path.join(source, 'plantas-vivas', 'characters', id);
  const to = path.join(out, id);
  await mkdir(to, { recursive: true });
  summary[id] = {};
  for (const clip of clips) await atlas(path.join(from, 'sprites', clip), to, clip, id);
  await still(path.join(from, 'portrait.png'), path.join(to, 'portrait.webp'), 256);
  for (const [name, file] of Object.entries(extra)) await still(path.join(from, file), path.join(to, name), 160);
}

for (const [id, { pack, clips, unarmored = {}, unarmoredDir = 'unarmored' }] of Object.entries(ZOMBIES)) {
  const from = path.join(source, 'zombis-vivos', ...(pack ? [pack] : []), 'characters', id);
  const to = path.join(out, id);
  await mkdir(to, { recursive: true });
  summary[id] = {};
  for (const [name, clip] of Object.entries(clips)) await atlas(path.join(from, 'sprites', clip), to, name, id);
  for (const [name, clip] of Object.entries(unarmored))
    await atlas(path.join(from, unarmoredDir, 'sprites', clip), to, `sin-${name}`, id);
  await still(path.join(from, 'portrait.png'), path.join(to, 'portrait.webp'), 256);
}

// Garden background and lane mower (public/jardin-yggdrasil in the pack).
const garden = path.join(source, 'jardin-yggdrasil');
await mkdir(path.join(out, 'escenario'), { recursive: true });
await sharp(path.join(garden, 'background', 'jardin-yggdrasil.webp'))
  .webp({ quality: 84, effort: 5 })
  .toFile(path.join(out, 'escenario', 'jardin.webp'));
await mkdir(path.join(out, 'podadora'), { recursive: true });
summary.podadora = {};
for (const clip of ['idle', 'start', 'run'])
  await atlas(path.join(garden, 'podadora', 'sprites', clip), path.join(out, 'podadora'), clip, 'podadora');

// Paste into src/lib/jardin/sprites.ts when clips change.
console.log(JSON.stringify(summary));
