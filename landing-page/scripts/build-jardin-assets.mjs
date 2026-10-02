// Builds the Jardín sandbox sprites from the full art pack.
//
// The pack (branch codex/plantas-zombis-assets) ships PNG atlases, GIF/WebP
// previews and sources (~340 MB). The game only needs a few clips per
// character, so this script converts those atlases to WebP and writes them to
// public/jardin/, together with the garden background and the lane mower.
// Usage:
//
//   git archive origin/codex/plantas-zombis-assets landing-page/public \
//     | tar -x -C /tmp/pack
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

const CHARACTERS = {
  solmiel: { dir: 'plantas-vivas', clips: ['idle', 'attack', 'spawn'], extra: { 'sun.webp': 'parts/projectile.png' } },
  nabu: { dir: 'plantas-vivas', clips: ['idle', 'attack', 'spawn'], extra: { 'seed.webp': 'parts/projectile.png' } },
  cortezon: { dir: 'plantas-vivas', clips: ['idle', 'damaged', 'critical', 'spawn'] },
  granadin: { dir: 'plantas-vivas', clips: ['idle', 'attack'], extra: { 'burst.webp': 'parts/projectile.png' } },
  despistado: { dir: 'zombis-vivos', clips: ['walk', 'bite', 'fall', 'spawn'] },
};

const summary = {};
for (const [id, { dir, clips, extra = {} }] of Object.entries(CHARACTERS)) {
  const from = path.join(source, dir, 'characters', id);
  const to = path.join(out, id);
  await mkdir(to, { recursive: true });
  summary[id] = {};
  for (const clip of clips) {
    const meta = JSON.parse(await readFile(path.join(from, 'sprites', `${clip}.json`), 'utf8'));
    await sharp(path.join(from, 'sprites', `${clip}.png`))
      .webp({ quality: 82, alphaQuality: 90, effort: 5 })
      .toFile(path.join(to, `${clip}.webp`));
    summary[id][clip] = { frames: meta.frames.length, loop: meta.meta.animation.loop };
  }
  await sharp(path.join(from, 'portrait.png'))
    .resize(256, 256)
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(path.join(to, 'portrait.webp'));
  for (const [name, file] of Object.entries(extra)) {
    await sharp(path.join(from, file))
      .resize({ width: 160, withoutEnlargement: true })
      .webp({ quality: 85, alphaQuality: 90 })
      .toFile(path.join(to, name));
  }
}
// Garden background and lane mower (public/jardin-yggdrasil in the pack).
const garden = path.join(source, 'jardin-yggdrasil');
await mkdir(path.join(out, 'escenario'), { recursive: true });
await sharp(path.join(garden, 'background', 'jardin-yggdrasil.webp'))
  .webp({ quality: 84, effort: 5 })
  .toFile(path.join(out, 'escenario', 'jardin.webp'));
await mkdir(path.join(out, 'podadora'), { recursive: true });
summary.podadora = {};
for (const clip of ['idle', 'start', 'run']) {
  const meta = JSON.parse(await readFile(path.join(garden, 'podadora', 'sprites', `${clip}.json`), 'utf8'));
  await sharp(path.join(garden, 'podadora', 'sprites', `${clip}.png`))
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(path.join(out, 'podadora', `${clip}.webp`));
  summary.podadora[clip] = { frames: meta.frames.length, loop: meta.meta.animation.loop };
}

// Paste into src/lib/jardin/sprites.ts when clips change.
console.log(JSON.stringify(summary, null, 2));
