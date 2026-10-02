import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const rigFlag = process.argv.indexOf('--rig-module');
const { ZOMBIES, clipsFor, CLIPS, renderZombie, animationEvents, afterClip, moveSpeed } = await import(
  rigFlag >= 0 ? pathToFileURL(path.resolve(process.argv[rigFlag + 1])).href : '../public/zombis-vivos/runtime/zombie-rig.mjs');

const require = createRequire(import.meta.url), sharp = require('sharp'), flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const rootFlag = process.argv.indexOf('--assets-root');
const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : fileURLToPath(new URL('../public/zombis-vivos/', import.meta.url));
const ids = process.argv.filter(arg => ZOMBIES.some(character => character.id === arg));
const selection = ZOMBIES.filter(character => !ids.length || ids.includes(character.id));
const SIZE = 256, COLUMNS = 8, transparent = { r: 0, g: 0, b: 0, alpha: 0 };
async function exists(file) { try { await access(file); return true; } catch { return false; } }
function bounds(data, width, height, threshold = 20) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > threshold) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return right < left ? null : { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

// Mechanical extraction keeps source RGBA pixels intact and restores soft edge feathering.
function cells(data, width, height, columns = 5, rows = 3) {
  const counts = new Uint32Array(height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 32) counts[y]++;
  const cuts = Array.from({ length: rows - 1 }, (_, index) => (index + 1) / rows).map(fraction => {
    const radius = rows === 3 ? 0.2 : 0.45 / rows;
    const center = height * fraction, first = Math.floor(center - height * radius), last = Math.ceil(center + height * radius);
    let start = -1; const choices = [];
    for (let y = first; y <= last + 1; y++) {
      if (y <= last && counts[y] < width * 0.003) { if (start < 0) start = y; }
      else if (start >= 0) { const midpoint = (start + y - 1) / 2; choices.push({ midpoint, score: y - start - Math.abs(midpoint - center) * 0.3 }); start = -1; }
    }
    choices.sort((a, b) => b.score - a.score); assert(choices.length, 'Transparent gutters are required between rows.'); return choices[0].midpoint;
  });
  assert(cuts.every((cut, index) => index === 0 || cut > cuts[index - 1]), 'Source row boundaries must remain ordered.');
  const labels = new Int32Array(width * height), queue = new Int32Array(width * height), assignments = [-1];
  let component = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 16) continue;
    component++; labels[start] = component; queue[0] = start;
    let count = 1, next = 0, sumX = 0, sumY = 0;
    while (next < count) {
      const index = queue[next++], x = index % width, y = Math.floor(index / width); sumX += x; sumY += y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const candidate = ny * width + nx;
        if (!labels[candidate] && data[candidate * 4 + 3] > 16) { labels[candidate] = component; queue[count++] = candidate; }
      }
    }
    const col = Math.max(0, Math.min(columns - 1, Math.floor(sumX / count / width * columns))), y = sumY / count;
    const row = cuts.filter(cut => y >= cut).length;
    assignments[component] = row * columns + col;
  }
  const visible = new Int32Array(labels);
  for (let index = 0; index < labels.length; index++) {
    if (labels[index] || !data[index * 4 + 3]) continue;
    const x = index % width, y = Math.floor(index / width);
    outer: for (let radius = 1; radius <= 3; radius++) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && visible[ny * width + nx]) { labels[index] = visible[ny * width + nx]; break outer; }
    }
  }
  const regions = Array.from({ length: rows * columns }, () => ({ left: width, top: height, right: -1, bottom: -1 }));
  for (let index = 0; index < labels.length; index++) if (labels[index]) {
    const region = regions[assignments[labels[index]]], x = index % width, y = Math.floor(index / width);
    region.left = Math.min(region.left, x); region.right = Math.max(region.right, x); region.top = Math.min(region.top, y); region.bottom = Math.max(region.bottom, y);
  }
  return regions.map((region, cell) => {
    assert(region.right >= region.left, `Empty source cell ${cell + 1}`);
    const w = region.right - region.left + 1, h = region.bottom - region.top + 1, pixels = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const index = (region.top + y) * width + region.left + x;
      if (labels[index] && assignments[labels[index]] === cell) data.copy(pixels, (y * w + x) * 4, index * 4, index * 4 + 4);
    }
    return { pixels, width: w, height: h, region };
  });
}

async function extract(character, output) {
  const source = path.join(root, 'source', `${character.id}-parts.png`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0; for (let i = 3; i < data.length; i += 4) if (!data[i]) clear++;
  assert(clear > info.width * info.height * 0.15, `${character.id}: source must have real alpha.`);
  const regions = cells(data, info.width, info.height, ...(character.sourceGrid ?? [5, 3])), processed = {};
  for (const [index, name] of character.partNames.entries()) {
    const item = regions[index], content = bounds(item.pixels, item.width, item.height, 32);
    assert(content, `${character.id}/${name}: missing visible pixels`);
    const left = Math.max(0, content.left - 3), top = Math.max(0, content.top - 3);
    const buffer = await sharp(item.pixels, { raw: { width: item.width, height: item.height, channels: 4 } })
      .extract({ left, top, width: Math.min(item.width, content.right + 4) - left, height: Math.min(item.height, content.bottom + 4) - top })
      .extend({ top: 3, left: 3, right: 3, bottom: 3, background: transparent }).png().toBuffer();
    const metadata = await sharp(buffer).metadata(); processed[name] = { buffer, width: metadata.width, height: metadata.height, region: item.region };
  }
  const neutral = processed.head;
  for (const name of character.expressions) {
    processed[name].buffer = await sharp(processed[name].buffer).resize(neutral.width, neutral.height, { fit: 'fill' }).png().toBuffer();
    processed[name].width = neutral.width; processed[name].height = neutral.height;
  }
  const parts = {};
  for (const name of character.partNames) { await writeFile(path.join(output, 'parts', `${name}.png`), processed[name].buffer); parts[name] = await loadImage(processed[name].buffer); }
  await writeFile(path.join(output, 'rig.json'), JSON.stringify({ ...character, logicalSize: [320, 320], groundAnchor: [160, 288],
    source: `../../source/${character.id}-parts.png`, sourceSize: [info.width, info.height],
    parts: Object.fromEntries(character.partNames.map(name => [name, { file: `parts/${name}.png`, width: processed[name].width, height: processed[name].height, sourceRegion: processed[name].region }])),
  }, null, 2) + '\n');
  return parts;
}
function frame(character, parts, clip, seconds, size = SIZE, options = {}) {
  const canvas = createCanvas(size, size), ctx = canvas.getContext('2d'); ctx.scale(size / 320, size / 320);
  renderZombie(ctx, character, parts, clip, seconds, options); return canvas;
}
async function exportClip(character, parts, output, clip, info, options = {}) {
  const atlas = createCanvas(SIZE * COLUMNS, SIZE * Math.ceil(info.frames / COLUMNS)), atlasCtx = atlas.getContext('2d');
  const frames = [], entries = []; let difference = 0, previous = null;
  for (let index = 0; index < info.frames; index++) {
    const canvas = frame(character, parts, clip, index / info.fps, SIZE, options), raw = Buffer.from(canvas.getContext('2d').getImageData(0, 0, SIZE, SIZE).data);
    const content = bounds(raw, SIZE, SIZE);
    if (content) assert(content.left >= 2 && content.top >= 2 && content.right <= SIZE - 3 && content.bottom <= SIZE - 3,
      `${character.id}/${clip}/${index} clipped: ${JSON.stringify(content)}`);
    if (previous) for (let i = 3; i < raw.length; i += 4) difference += Math.abs(raw[i] - previous[i]);
    previous = raw; frames.push(raw);
    const x = index % COLUMNS * SIZE, y = Math.floor(index / COLUMNS) * SIZE; atlasCtx.drawImage(canvas, x, y);
    entries.push({ filename: `${character.id}-${clip}-${String(index).padStart(3, '0')}`, frame: { x, y, w: SIZE, h: SIZE }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE }, sourceSize: { w: SIZE, h: SIZE }, pivot: { x: 0.5, y: 0.9 },
      duration: Math.round((index + 1) * 1000 / info.fps) - Math.round(index * 1000 / info.fps) });
  }
  assert(difference > 10000, `${character.id}/${clip}: no visible movement`);
  await writeFile(path.join(output, 'sprites', `${clip}.png`), atlas.toBuffer('image/png'));
  const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / info.fps) - Math.round(index * 1000 / info.fps));
  const input = () => sharp(Buffer.concat(frames), { raw: { width: SIZE, height: SIZE * frames.length, channels: 4, pageHeight: SIZE } });
  await input().webp({ quality: 92, alphaQuality: 100, effort: 4, loop: 0, delay }).toFile(path.join(output, 'animated', `${clip}.webp`));
  const gifDelay = frames.map((_, index) => (Math.round((index + 1) * 100 / info.fps) - Math.round(index * 100 / info.fps)) * 10);
  await input().gif({ colours: 256, dither: 0.15, effort: 3, loop: 0, delay: gifDelay }).toFile(path.join(output, 'animated', `${clip}.gif`));
  await writeFile(path.join(output, 'sprites', `${clip}.json`), JSON.stringify({ frames: entries, meta: { app: 'Einherjar Blitz / Zombis vivos', version: '1.0',
    image: `${clip}.png`, format: 'RGBA8888', size: { w: atlas.width, h: atlas.height }, scale: '1',
    animation: { ...info, after: afterClip(clip, character), facing: 'left', armorVisible: character.armor > 0 && options.armorRatio !== 0,
      events: animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * info.fps) })),
      ...(['walk', 'run'].includes(clip) ? { distancePerCycle: 2 * character.stride / (character.stance ?? 0.6), recommendedSpeed: moveSpeed(character), gaitTempo: character.gaitTempo } : {}) } } }, null, 2) + '\n');
  const media = await sharp(path.join(output, 'animated', `${clip}.webp`), { animated: true }).metadata();
  // The encoder merges identical held poses; the atlas retains every 30 FPS frame.
  assert(media.pages >= 2 && media.pages <= info.frames); assert(media.hasAlpha);
  assert.equal(media.delay.reduce((a, b) => a + b, 0), info.duration * 1000);
  const relative = file => path.relative(root, path.join(output, file)).split(path.sep).join('/');
  return { ...info, atlas: relative(`sprites/${clip}.png`), data: relative(`sprites/${clip}.json`),
    webp: relative(`animated/${clip}.webp`), gif: relative(`animated/${clip}.gif`), columns: COLUMNS, frameSize: [SIZE, SIZE] };
}

const reports = [];
for (const character of selection) {
  if (!await exists(path.join(root, 'source', `${character.id}-parts.png`))) { console.log(`Waiting for ${character.id} source.`); continue; }
  const output = path.join(root, 'characters', character.id);
  for (const directory of ['parts', 'sprites', 'animated']) await mkdir(path.join(output, directory), { recursive: true });
  const parts = await extract(character, output);
  let animations = {};
  await writeFile(path.join(output, 'portrait.png'), frame(character, parts, 'idle', 0, 512).toBuffer('image/png'));
  if (process.argv.includes('--unarmored-only')) animations = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8')).animations;
  else if (!process.argv.includes('--parts-only')) for (const [clip, info] of Object.entries(clipsFor(character))) {
    animations[clip] = await exportClip(character, parts, output, clip, info); console.log(`${character.id}/${clip}: ${info.frames} frames, alpha, edges and motion verified.`);
  }
  if (process.argv.includes('--parts-only')) continue;
  const variants = {};
  if (character.armor) {
    const variant = path.join(output, 'unarmored'), alternate = {};
    for (const directory of ['sprites', 'animated']) await mkdir(path.join(variant, directory), { recursive: true });
    for (const clip of ['idle', character.locomotion ?? 'walk', 'bite', 'hit', 'fall'].filter(clip => character.clips.includes(clip))) {
      alternate[clip] = await exportClip(character, parts, variant, clip, CLIPS[clip], { armorRatio: 0 });
      console.log(`${character.id}/unarmored/${clip}: ${CLIPS[clip].frames} frames, alpha, edges and motion verified.`);
    }
    variants.unarmored = { armorVisible: false, animations: alternate };
  }
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ ...character, moveSpeed: moveSpeed(character), portrait: `characters/${character.id}/portrait.png`,
    rig: `characters/${character.id}/rig.json`, animations, variants }, null, 2) + '\n');
  const alternate = variants.unarmored?.animations ?? {};
  reports.push({ id: character.id, clips: Object.keys(animations).length, frames: Object.values(animations).reduce((sum, clip) => sum + clip.frames, 0),
    variantClips: Object.keys(alternate).length, variantFrames: Object.values(alternate).reduce((sum, clip) => sum + clip.frames, 0),
    alpha: 'verified', clipping: 'none', movement: 'verified', encodedDuration: 'exact' });
}
const available = [];
for (const character of ZOMBIES) { const file = path.join(root, 'characters', character.id, 'manifest.json'); if (await exists(file)) available.push(JSON.parse(await readFile(file, 'utf8'))); }
await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ name: 'Zombis vivos', version: rigFlag >= 0 ? '2.0.0' : '1.0.0', created: rigFlag >= 0 ? '2026-10-02' : '2026-10-01', artwork: 'Built-in ImageGen / original cartoon zombies',
  logicalSize: [320, 320], frameSize: [256, 256], anchor: [0.5, 0.9], fps: 30, facing: 'left', flipForRight: true, characters: available }, null, 2) + '\n');
let prior = []; const reportFile = path.join(root, 'validation.json'); if (await exists(reportFile)) prior = JSON.parse(await readFile(reportFile, 'utf8')).characters;
await writeFile(reportFile, JSON.stringify({ date: rigFlag >= 0 ? '2026-10-02' : '2026-10-01', characters: [...prior.filter(item => !reports.some(report => item.id === report.id)), ...reports] }, null, 2) + '\n');
console.log(`Zombie export complete: ${available.length} characters.`);
