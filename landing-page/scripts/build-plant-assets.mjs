import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const rigFlag = process.argv.indexOf('--rig-module');
const { CHARACTERS, CLIPS, clipsFor, renderPlant, PlantAnimator, actionEvent, animationEvents, afterClip, clipLabel } = await import(
  rigFlag >= 0 ? pathToFileURL(path.resolve(process.argv[rigFlag + 1])).href : '../public/plantas-vivas/runtime/plant-rig.mjs');

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const moduleFlag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(moduleFlag >= 0 ? process.argv[moduleFlag + 1] : '@napi-rs/canvas');
const rootFlag = process.argv.indexOf('--assets-root');
const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const requested = process.argv.filter(arg => CHARACTERS.some(item => item.id === arg));
const selection = CHARACTERS.filter(item => requested.length === 0 || requested.includes(item.id));
const FRAME = 256, COLUMNS = 8;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const reports = [];

async function exists(filename) { try { await access(filename); return true; } catch { return false; } }

function alphaBounds(data, width, height, threshold = 8) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] <= threshold) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1, right, bottom };
}

// Preserve connected alpha shapes when a wide asset extends beyond its nominal grid cell.
// This is mechanical sprite extraction: all retained RGBA pixels stay unchanged.
function segmentCells(data, width, height) {
  const rowCounts = new Uint32Array(height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 32) rowCounts[y]++;
  const rowCuts = [1 / 3, 2 / 3].map(fraction => {
    const target = height * fraction, start = Math.floor(target - height * 0.12), end = Math.ceil(target + height * 0.12);
    const candidates = []; let run = -1;
    for (let y = start; y <= end + 1; y++) {
      if (y <= end && rowCounts[y] < width * 0.004) { if (run < 0) run = y; }
      else if (run >= 0) {
        const center = (run + y - 1) / 2;
        candidates.push({ center, score: y - run - Math.abs(center - target) * 0.3 }); run = -1;
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    assert(candidates.length, 'Source needs a transparent horizontal gutter between rows.');
    return candidates[0].center;
  });
  const labels = new Int32Array(width * height), queue = new Int32Array(width * height);
  const assignments = [null]; let component = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 16) continue;
    component++; labels[start] = component; queue[0] = start;
    let next = 0, total = 1, sumX = 0, sumY = 0;
    while (next < total) {
      const current = queue[next++], x = current % width, y = Math.floor(current / width);
      sumX += x; sumY += y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const candidate = ny * width + nx;
        if (!labels[candidate] && data[candidate * 4 + 3] > 16) {
          labels[candidate] = component; queue[total++] = candidate;
        }
      }
    }
    const col = Math.max(0, Math.min(2, Math.floor(sumX / total / width * 3)));
    const centerY = sumY / total;
    const row = centerY < rowCuts[0] ? 0 : centerY < rowCuts[1] ? 1 : 2;
    assignments[component] = row * 3 + col;
  }
  // Restore the source's soft antialias pixels within three pixels of a visible component.
  const opaqueLabels = new Int32Array(labels);
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] || !data[i * 4 + 3]) continue;
    const x = i % width, y = Math.floor(i / width);
    outer: for (let radius = 1; radius <= 3; radius++) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && opaqueLabels[ny * width + nx]) {
        labels[i] = opaqueLabels[ny * width + nx]; break outer;
      }
    }
  }
  const regions = Array.from({ length: 9 }, () => ({ left: width, top: height, right: -1, bottom: -1 }));
  for (let i = 0; i < labels.length; i++) if (labels[i]) {
    const region = regions[assignments[labels[i]]], x = i % width, y = Math.floor(i / width);
    region.left = Math.min(region.left, x); region.right = Math.max(region.right, x);
    region.top = Math.min(region.top, y); region.bottom = Math.max(region.bottom, y);
  }
  return regions.map((region, index) => {
    assert(region.right >= region.left, `Source cell ${index + 1} is empty.`);
    const w = region.right - region.left + 1, h = region.bottom - region.top + 1;
    const pixels = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const original = (region.top + y) * width + region.left + x;
      if (labels[original] && assignments[labels[original]] === index) data.copy(pixels, (y * w + x) * 4, original * 4, original * 4 + 4);
    }
    return { pixels, width: w, height: h, cell: { left: region.left, top: region.top, width: w, height: h } };
  });
}

async function extractParts(character) {
  const PART_NAMES = character.partNames;
  const sourceFile = character.source ?? `${character.id}-parts.png`;
  const source = path.join(root, 'source', sourceFile);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 4);
  let transparentPixels = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha === 0) transparentPixels++;
  }
  assert(transparentPixels > info.width * info.height * 0.15, 'Source needs genuine alpha transparency.');
  const regions = segmentCells(data, info.width, info.height);
  const output = path.join(root, 'characters', character.id);
  await mkdir(path.join(output, 'parts'), { recursive: true });
  await mkdir(path.join(output, 'sprites'), { recursive: true });
  await mkdir(path.join(output, 'animated'), { recursive: true });
  const cropped = {};
  for (let index = 0; index < PART_NAMES.length; index++) {
    const { pixels, width, height, cell } = regions[index];
    // Remove empty atlas padding and negligible isolated alpha noise, retaining edge feathering.
    const bounds = alphaBounds(pixels, width, height, 32);
    assert(bounds, `${character.id}/${PART_NAMES[index]} has no visible artwork.`);
    const left = Math.max(0, bounds.left - 3), top = Math.max(0, bounds.top - 3);
    const crop = { left, top, width: Math.min(width, bounds.right + 4) - left, height: Math.min(height, bounds.bottom + 4) - top };
    const buffer = await sharp(pixels, { raw: { width, height, channels: 4 } })
      .extract(crop).extend({ top: 3, right: 3, bottom: 3, left: 3, background: transparent }).png().toBuffer();
    const metadata = await sharp(buffer).metadata();
    cropped[PART_NAMES[index]] = { buffer, width: metadata.width, height: metadata.height, cell };
  }

  // Normalize expressions to the neutral part size so an eye change cannot resize the plant.
  for (const group of [character.expressions, ...(character.extraExpressions ?? [])]) {
    const neutral = cropped[group[0]], w = neutral.width, h = neutral.height;
    for (const name of group) {
      const item = cropped[name];
      item.buffer = await sharp(item.buffer).resize(w, h, { fit: 'fill' }).png().toBuffer();
      item.width = w; item.height = h;
    }
  }
  const parts = {};
  for (const name of PART_NAMES) {
    await writeFile(path.join(output, 'parts', `${name}.png`), cropped[name].buffer);
    parts[name] = await loadImage(cropped[name].buffer);
  }
  await writeFile(path.join(output, 'rig.json'), JSON.stringify({
    ...character, logicalSize: [320, 320], groundAnchor: [150, 288],
    source: `../../source/${sourceFile}`, sourceSize: [info.width, info.height],
    sourceRegions: Object.fromEntries(PART_NAMES.map(name => [name, cropped[name].cell])),
    parts: Object.fromEntries(PART_NAMES.map(name => [name, { file: `parts/${name}.png`, width: cropped[name].width, height: cropped[name].height }])),
  }, null, 2) + '\n');
  return { parts, output };
}

function drawFrame(character, parts, clip, time, size = FRAME) {
  const canvas = createCanvas(size, size), ctx = canvas.getContext('2d');
  ctx.scale(size / 320, size / 320);
  renderPlant(ctx, character, parts, clip, time, { includeEmittedObjects: true });
  return canvas;
}

async function exportClip(character, parts, output, clip, info) {
  const atlas = createCanvas(FRAME * COLUMNS, FRAME * Math.ceil(info.frames / COLUMNS));
  const atlasContext = atlas.getContext('2d');
  const frames = [], bounds = [], frameEntries = [];
  let consecutiveDifference = 0, previous = null;
  for (let index = 0; index < info.frames; index++) {
    const frame = drawFrame(character, parts, clip, index / info.fps);
    const ctx = frame.getContext('2d');
    const raw = Buffer.from(ctx.getImageData(0, 0, FRAME, FRAME).data);
    const content = alphaBounds(raw, FRAME, FRAME, 20);
    if (content) {
      assert(content.left >= 2 && content.top >= 2 && content.right <= FRAME - 3 && content.bottom <= FRAME - 3,
        `${character.id}/${clip} frame ${index}: sprite clipped at the frame border (${JSON.stringify(content)}).`);
      bounds.push(content);
    }
    if (previous) for (let i = 3; i < raw.length; i += 4) consecutiveDifference += Math.abs(raw[i] - previous[i]);
    previous = raw;
    frames.push(raw);
    const x = (index % COLUMNS) * FRAME, y = Math.floor(index / COLUMNS) * FRAME;
    atlasContext.drawImage(frame, x, y);
    frameEntries.push({ filename: `${character.id}-${clip}-${String(index).padStart(3, '0')}`, frame: { x, y, w: FRAME, h: FRAME },
      rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: FRAME, h: FRAME }, sourceSize: { w: FRAME, h: FRAME },
      duration: Math.round((index + 1) * 1000 / info.fps) - Math.round(index * 1000 / info.fps), pivot: { x: 150 / 320, y: 288 / 320 },
    });
  }
  assert(consecutiveDifference > 10000, `${character.id}/${clip}: animation did not move.`);
  await writeFile(path.join(output, 'sprites', `${clip}.png`), atlas.toBuffer('image/png'));
  const delay = frames.map((_, index) => Math.round((index + 1) * 1000 / info.fps) - Math.round(index * 1000 / info.fps));
  const animatedInput = () => sharp(Buffer.concat(frames), { raw: { width: FRAME, height: FRAME * info.frames, channels: 4, pageHeight: FRAME } });
  await animatedInput().webp({ quality: 92, effort: 4, alphaQuality: 100, loop: 0, delay }).toFile(path.join(output, 'animated', `${clip}.webp`));
  // GIFs are review previews; PNG atlases and WebP retain smoother alpha edges.
  const gifDelay = frames.map((_, index) => (Math.round((index + 1) * 100 / info.fps) - Math.round(index * 100 / info.fps)) * 10);
  await animatedInput().gif({ effort: 3, colours: 256, dither: 0.15, loop: 0, delay: gifDelay }).toFile(path.join(output, 'animated', `${clip}.gif`));
  await writeFile(path.join(output, 'sprites', `${clip}.json`), JSON.stringify({ frames: frameEntries, meta: {
    app: 'Einherjar Blitz / Plantas vivas', version: '1.0', image: `${clip}.png`, format: 'RGBA8888',
    size: { w: atlas.width, h: atlas.height }, scale: '1',
    frameTags: [{ name: clip, from: 0, to: info.frames - 1, direction: 'forward' }],
    animation: { label: clipLabel(character, clip),
      fps: info.fps, duration: info.duration, loop: info.loop,
      emittedObjectIncluded: clip === 'attack' && character.attackStyle === 'sun',
      after: afterClip(character, clip),
      events: animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * info.fps) })),
    },
  } }, null, 2) + '\n');
  const metadata = await sharp(path.join(output, 'animated', `${clip}.webp`), { animated: true }).metadata();
  assert(metadata.pages >= 2 && metadata.pages <= info.frames, `${character.id}/${clip}: animated WebP has no motion.`);
  assert.equal(metadata.pageHeight, FRAME);
  assert(metadata.hasAlpha);
  assert.equal(metadata.delay.reduce((sum, ms) => sum + ms, 0), info.duration * 1000, 'Encoded clip duration must match metadata.');
  return { frames: info.frames, fps: info.fps, duration: info.duration, loop: info.loop,
    atlas: `characters/${character.id}/sprites/${clip}.png`, data: `characters/${character.id}/sprites/${clip}.json`,
    webp: `characters/${character.id}/animated/${clip}.webp`, gif: `characters/${character.id}/animated/${clip}.gif`,
    columns: COLUMNS, frameSize: [FRAME, FRAME],
  };
}

function checkGameplayEvent(character, parts) {
  const events = [], animator = new PlantAnimator(character, parts, { onEvent: event => events.push(event) });
  if (character.defenseOnly) assert.equal(animator.play('attack'), false, 'Pure defense must reject offensive attacks.');
  animator.play(character.primaryClip ?? 'attack');
  const primary = character.primaryClip ?? 'attack';
  for (let i = 0; i < Math.ceil(CLIPS[primary].duration * 60) + 2; i++) animator.update(1 / 60);
  assert.equal(events.length, animationEvents(character, primary).length, 'Every action cue must release exactly once.');
  assert.equal(events[0].time, character.projectileEvent);
  for (let i = 0; i < 15; i++) animator.update(1 / 60);
  assert.equal(events[0].type, actionEvent(character).type);
  if (character.consumedOnAction) {
    assert.equal(animator.spent, true, 'The explosive plant must remain consumed.');
    assert.equal(animator.play('attack'), false, 'A consumed explosive cannot detonate twice.');
    animator.play('spawn');
    assert.equal(animator.spent, false, 'Replanting must restore the explosive.');
    animator.play('attack');
    for (let i = 0; i < 85; i++) animator.update(1 / 60);
    assert.equal(events.length, 2, 'Replanted explosive must release one new event.');
  } else if (character.attackStyle === 'shadow-mark') {
    assert.equal(animator.clip, 'channel', 'The shadow seal must sustain its link.');
    animator.play('recall');
    for (let i = 0; i < 165; i++) animator.update(1 / 60);
    assert.equal(animator.clip, 'idle', 'Recall must pass through recovery and return to idle.');
    assert.equal(events.filter(event => event.type === 'shadow-mark').length, 1);
    assert.equal(events.filter(event => event.cue === 'rewind').length, 1);
  } else assert.equal(animator.clip, 'idle', 'Actions must return to idle.');
}

for (const character of selection) {
  if (process.argv.includes('--metadata-only')) continue;
  if (!await exists(path.join(root, 'source', character.source ?? `${character.id}-parts.png`))) {
    console.log(`Skip ${character.id}: source not generated yet.`); continue;
  }
  const { parts, output } = await extractParts(character);
  await writeFile(path.join(output, 'portrait.png'), drawFrame(character, parts, 'idle', 0, 512).toBuffer('image/png'));
  if (process.argv.includes('--parts-only')) continue;
  const animations = {};
  for (const [clip, info] of Object.entries(clipsFor(character))) {
    animations[clip] = await exportClip(character, parts, output, clip, info);
    console.log(`${character.id}/${clip}: ${info.frames} frames, alpha and movement verified.`);
  }
  await writeFile(path.join(output, 'portrait.png'), drawFrame(character, parts, 'idle', 0, 512).toBuffer('image/png'));
  checkGameplayEvent(character, parts);
  const entry = { ...character, portrait: `characters/${character.id}/portrait.png`, rig: `characters/${character.id}/rig.json`,
    effects: Object.fromEntries(['projectile', 'effect', 'cracks', 'cracks-critical', 'sigil'].filter(name => character.partNames.includes(name))
      .map(name => [name === 'effect' ? 'burst' : name, `characters/${character.id}/parts/${name}.png`])), animations };
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(entry, null, 2) + '\n');
  reports.push({ id: character.id, clips: Object.keys(animations).length, frames: Object.values(clipsFor(character)).reduce((n, item) => n + item.frames, 0),
    alpha: 'verified', clipping: 'none', motion: 'verified', gameplayEvent: character.attackStyle === 'punch' ? 'two distinct hits per combo' : 'once per primary action',
    ...(character.defenseOnly ? { offensiveAttack: 'absent', attackDamage: 0, healthTiers: ['healthy', 'damaged', 'critical'] } : {}) });
}

const available = [];
for (const character of CHARACTERS) {
  const file = path.join(root, 'characters', character.id, 'manifest.json');
  if (await exists(file)) {
    const entry = { ...JSON.parse(await readFile(file, 'utf8')), ...character };
    await writeFile(file, JSON.stringify(entry, null, 2) + '\n');
    for (const [clip, animation] of Object.entries(entry.animations)) {
      const atlasPath = path.join(root, animation.data);
      const atlas = JSON.parse(await readFile(atlasPath, 'utf8'));
      atlas.meta.animation.label = clipLabel(character, clip);
      atlas.meta.animation.after = afterClip(character, clip);
      atlas.meta.animation.events = animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * animation.fps) }));
      await writeFile(atlasPath, JSON.stringify(atlas, null, 2) + '\n');
    }
    available.push(entry);
  }
}
await writeFile(path.join(root, 'manifest.json'), JSON.stringify({
  name: 'Plantas vivas', version: available.some(character => character.rigVersion === 7) ? '7.0.0' : '6.0.0', created: '2026-10-02', artwork: 'Built-in ImageGen / original caricature characters',
  animation: 'Continuous cutout rig; deterministic exports at 30 fps', logicalSize: [320, 320], frameSize: [FRAME, FRAME],
  anchor: [150 / 320, 288 / 320], directions: ['right'], flipForLeft: true,
  characters: available.filter(character => !character.retired), archivedCharacters: available.filter(character => character.retired),
}, null, 2) + '\n');
const reportFile = path.join(root, 'validation.json');
let previousReports = [];
if (await exists(reportFile)) previousReports = JSON.parse(await readFile(reportFile, 'utf8')).characters;
await writeFile(reportFile, JSON.stringify({ date: '2026-10-02', characters: [...previousReports.filter(item => !reports.some(report => report.id === item.id)), ...reports] }, null, 2) + '\n');
console.log(`Export complete: ${available.length} characters in ${root}`);
