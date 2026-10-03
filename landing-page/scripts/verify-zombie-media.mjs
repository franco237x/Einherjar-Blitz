import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url), sharp = require('sharp');
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v4/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')), files = [];
for (const c of manifest.characters) for (const group of [c.animations, c.variants.helmetless?.animations ?? {}]) {
  for (const clip of Object.values(group)) for (const format of ['gif', 'webp']) files.push({ file: clip[format], duration: Math.round(clip.duration * 1000), size: [256, 256], alpha: true });
}
for (const [name, duration, size] of [['movimientos', 9400, [960, 450]], ['comparacion-primeros', 2400, [1220, 440]]]) {
  for (const format of ['gif', 'webp']) files.push({ file: `preview/${name}.${format}`, duration, size, alpha: false });
}
sharp.cache(false);
const checked = [];
for (const { file, duration, size, alpha } of files) {
  const source = path.join(root, file), metadata = await sharp(source, { animated: true }).metadata();
  assert(metadata.pages > 1, `${file}: missing animation`);
  assert.deepEqual([metadata.width, metadata.pageHeight], size);
  assert.equal(metadata.delay.reduce((a, b) => a + b, 0), duration, `${file}: changed playback timing`);
  if (alpha) assert(metadata.hasAlpha, `${file}: missing transparency`);
  // Decode every frame, rather than trusting the header or a successful write.
  const decoded = await sharp(source, { animated: true }).stats();
  assert(decoded.channels.some(channel => channel.max > channel.min), `${file}: empty frames`);
  checked.push({ file, pages: metadata.pages, duration, decoded: true });
}
await writeFile(path.join(root, 'media-validation.json'), JSON.stringify({ assetVersion: manifest.version, files: checked.length, checked }, null, 2) + '\n');
console.log(`${checked.length} animated files fully decoded; dimensions, durations and clip transparency verified.`);
