import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, SHEETS, CLIPS, renderZombie, animationEvents, afterClip, moveSpeed } from '../public/zombis-vivos/especiales-v4/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const arg = (key, fallback) => { const i = process.argv.indexOf(key); return i < 0 ? fallback : process.argv[i + 1]; };
const { createCanvas, loadImage } = require(arg('--canvas-module', '@napi-rs/canvas'));
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v4/', import.meta.url));
const COLUMNS = 8, FPS = 30;
const angle = (a, b) => Math.atan2(a[0] - b[0], b[1] - a[1]) * 180 / Math.PI;
function extract(data, width, height) {
  const labels = new Int32Array(width * height), queue = new Int32Array(width * height), components = [], assignment = [];
  for (let start = 0, label = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] < 24) continue;
    labels[start] = ++label; queue[0] = start;
    let count = 1, sx = 0, sy = 0;
    for (let q = 0; q < count; q++) {
      const at = queue[q], x = at % width, y = Math.floor(at / width); sx += x; sy += y;
      for (const next of [x ? at - 1 : -1, x < width - 1 ? at + 1 : -1, y ? at - width : -1, y < height - 1 ? at + width : -1])
        if (next >= 0 && !labels[next] && data[next * 4 + 3] >= 24) { labels[next] = label; queue[count++] = next; }
    }
    components.push({ label, count, x: sx / count, y: sy / count });
  }
  const largest = [...components].sort((a, b) => b.count - a.count).slice(0, 6).sort((a, b) => a.y - b.y);
  assert.equal(largest.length, 6);
  const ordered = [...largest.slice(0, 3).sort((a, b) => a.x - b.x), ...largest.slice(3).sort((a, b) => a.x - b.x)];
  for (const [i, component] of ordered.entries()) assignment[component.label] = i;
  for (const component of components) if (assignment[component.label] === undefined) {
    const nearest = ordered.map((p, index) => ({ index, d: ((p.x - component.x) / width) ** 2 + ((p.y - component.y) / height) ** 2 })).sort((a, b) => a.d - b.d)[0];
    assignment[component.label] = nearest.index;
  }
  const visible = new Int32Array(labels);
  for (let at = 0; at < labels.length; at++) if (!labels[at] && data[at * 4 + 3]) {
    const x = at % width, y = Math.floor(at / width);
    search: for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && visible[ny * width + nx]) { labels[at] = visible[ny * width + nx]; break search; }
    }
  }
  const regions = Array.from({ length: 6 }, () => ({ left: width, right: -1, top: height, bottom: -1 }));
  for (let at = 0; at < labels.length; at++) if (labels[at]) {
    const r = regions[assignment[labels[at]]], x = at % width, y = Math.floor(at / width);
    r.left = Math.min(r.left, x); r.right = Math.max(r.right, x); r.top = Math.min(r.top, y); r.bottom = Math.max(r.bottom, y);
  }
  for (const r of regions) { r.width = r.right - r.left + 1; r.height = r.bottom - r.top + 1; r.pixels = Buffer.alloc(r.width * r.height * 4); }
  for (let at = 0; at < labels.length; at++) if (labels[at]) {
    const r = regions[assignment[labels[at]]], x = at % width - r.left, y = Math.floor(at / width) - r.top;
    data.copy(r.pixels, (y * r.width + x) * 4, at * 4, at * 4 + 4);
  }
  return regions;
}
function centerAt(r, fraction) {
  const y = Math.round((r.height - 1) * fraction); let total = 0, sum = 0;
  for (let dy = -2; dy <= 2; dy++) for (let x = 0; x < r.width; x++) {
    const row = Math.max(0, Math.min(r.height - 1, y + dy)), alpha = r.pixels[(row * r.width + x) * 4 + 3];
    if (alpha > 96) { total += alpha; sum += x * alpha; }
  }
  return [total ? sum / total : r.width / 2, y];
}
function definition(c, name, r) {
  const w = r.width, h = r.height, l = c.layout;
  let size, anchor;
  if (name.startsWith('head')) { size = l.headSize; anchor = l.headAnchor; }
  else if (name === 'torso') { size = l.torso; anchor = l.torsoAnchor; }
  else if (name === 'pelvis') { size = l.pelvis; anchor = [0.5, 0.64]; }
  else if (name === 'helmet') { size = [96, 105]; anchor = [0.54, 0.9]; }
  else if (name === 'effect') { size = [70, 39]; anchor = [0.5, 0.9]; }
  else if (name.startsWith('hand')) { size = l.handSize; anchor = [0.5, 0.13]; }
  else if (name.startsWith('shoe')) { size = l.shoeSize; anchor = [0.68, 0.14]; }
  if (size) return { file: `parts/${name}.png`, width: w, height: h, scale: Math.min(size[0] / w, size[1] / h), pivot: [anchor[0] * w, anchor[1] * h], fixedAspect: true };
  const length = name.startsWith('upper') ? l.armLengths[0] : name.startsWith('forearm') ? l.armLengths[1] : name.startsWith('thigh') ? l.legLengths[0] : l.legLengths[1];
  const arm = c.id === 'bruton' && (name.startsWith('upper') || name.startsWith('forearm'));
  const pivot = centerAt(r, arm ? 0.18 : 0.1), distal = centerAt(r, arm ? 0.82 : 0.9), nativeLength = Math.hypot(distal[0] - pivot[0], distal[1] - pivot[1]);
  return { file: `parts/${name}.png`, width: w, height: h, pivot, distal, nativeAngle: angle(pivot, distal), nativeLength,
    boneLength: length, scale: length / nativeLength, fixedAspect: true };
}
async function loadParts(c, out) {
  await mkdir(path.join(out, 'parts'), { recursive: true }); await mkdir(path.join(out, 'sheets'), { recursive: true });
  const parts = {}, definitions = {}, sources = [];
  for (const [sheet, originalNames] of Object.entries(SHEETS)) {
    const source = path.join(root, 'source', `${c.id}-${sheet}.png`), { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let clear = 0; for (let i = 3; i < data.length; i += 4) clear += data[i] === 0;
    assert(clear / (info.width * info.height) > 0.25, `${c.id}/${sheet} needs genuine transparency`);
    const regions = extract(data, info.width, info.height), names = originalNames.map(name => name === 'extra' ? c.id === 'bruton' ? 'effect' : 'helmet' : name);
    const packed = createCanvas(512 * 3, 512 * 2), context = packed.getContext('2d'), frames = [];
    for (const [i, name] of names.entries()) {
      const r = regions[i], buffer = await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } }).png().toBuffer();
      await writeFile(path.join(out, 'parts', `${name}.png`), buffer); parts[name] = await loadImage(buffer); definitions[name] = { ...definition(c, name, r), source: `source/${c.id}-${sheet}.png`, sourceBounds: { x: r.left, y: r.top, w: r.width, h: r.height } };
      // The rig consumes original-resolution cutouts; these sheets are an optional human-friendly atlas.
      const scale = Math.min(472 / r.width, 472 / r.height), x = i % 3 * 512 + (512 - r.width * scale) / 2, y = Math.floor(i / 3) * 512 + (512 - r.height * scale) / 2;
      context.drawImage(parts[name], x, y, r.width * scale, r.height * scale);
      frames.push({ name, frame: { x, y, w: r.width * scale, h: r.height * scale }, sourceSize: [r.width, r.height], packingScale: scale });
    }
    await writeFile(path.join(out, 'sheets', `${sheet}.png`), packed.toBuffer('image/png'));
    await writeFile(path.join(out, 'sheets', `${sheet}.json`), JSON.stringify({ frames, image: `${sheet}.png`, size: [1536, 1024], source: `source/${c.id}-${sheet}.png` }, null, 2) + '\n');
    sources.push({ sheet, source: `source/${c.id}-${sheet}.png`, size: [info.width, info.height], parts: names });
  }
  const rig = { version: '4.0.0', id: c.id, logicalSize: [320, 320], ground: 288, pivot: [0.5, 0.9],
    transform: 'fixed uniform scale + rotation only', layout: c.layout, parts: definitions, helmetOffset: [-2, -4],
    drawOrder: ['leg-back', 'arm-back', 'leg-front', 'upper-arm-front', 'pelvis', 'torso-with-permanent-pads', 'head', 'helmet', 'forearm-and-hand-front'], sources };
  parts.rig = rig; await writeFile(path.join(out, 'rig.json'), JSON.stringify(rig, null, 2) + '\n'); return parts;
}
function frame(c, parts, clip, time, size, options = {}) {
  const canvas = createCanvas(size, size), ctx = canvas.getContext('2d'); ctx.scale(size / 320, size / 320);
  renderZombie(ctx, c, parts, clip, time, options); return canvas;
}
function bounds(raw, size) {
  let left = size, top = size, right = -1, bottom = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (raw[(y * size + x) * 4 + 3] > 24) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  return { left, top, right, bottom };
}
const delay = (count, fps = FPS) => Array.from({ length: count }, (_, i) => Math.round((i + 1) * 1000 / fps) - Math.round(i * 1000 / fps));
async function exportClip(c, parts, out, clip, options = {}) {
  const info = CLIPS[clip], raws = []; const files = {};
  for (const size of [256, 512]) {
    const suffix = size === 512 ? '@2x' : '', atlas = createCanvas(COLUMNS * size, Math.ceil(info.frames / COLUMNS) * size), ctx = atlas.getContext('2d'), entries = [];
    for (let i = 0; i < info.frames; i++) {
      const canvas = frame(c, parts, clip, i / FPS, size, options), raw = Buffer.from(canvas.getContext('2d').getImageData(0, 0, size, size).data), b = bounds(raw, size);
      assert(b.left > 1 && b.top > 1 && b.right < size - 2 && b.bottom < size - 2, `${c.id}/${clip}/${i}: clipped ${JSON.stringify(b)}`);
      if (size === 256) raws.push(raw);
      const x = i % COLUMNS * size, y = Math.floor(i / COLUMNS) * size; ctx.drawImage(canvas, x, y);
      entries.push({ filename: `${c.id}-${clip}-${i}`, frame: { x, y, w: size, h: size }, pivot: { x: 0.5, y: 0.9 }, rotated: false, trimmed: false,
        sourceSize: { w: size, h: size }, spriteSourceSize: { x: 0, y: 0, w: size, h: size }, duration: delay(info.frames)[i] });
    }
    const image = `${clip}${suffix}.png`, data = `${clip}${suffix}.json`;
    await writeFile(path.join(out, 'sprites', image), atlas.toBuffer('image/png'));
    await writeFile(path.join(out, 'sprites', data), JSON.stringify({ frames: entries, meta: { image, size: { w: atlas.width, h: atlas.height }, scale: String(size / 256), format: 'RGBA8888',
      animation: { ...info, after: afterClip(clip, c), facing: 'left', helmetVisible: !!c.armor && options.armorRatio !== 0, shoulderPadsVisible: !!c.armor,
        events: animationEvents(c, clip).map(e => ({ ...e, frame: Math.ceil(e.time * FPS) })), ...(clip === c.locomotion ? { recommendedSpeed: moveSpeed(c), distancePerCycle: moveSpeed(c) * info.duration } : {}) } } }, null, 2) + '\n');
    files[size === 512 ? 'hdAtlas' : 'atlas'] = path.relative(root, path.join(out, 'sprites', image)).split(path.sep).join('/');
    files[size === 512 ? 'hdData' : 'data'] = path.relative(root, path.join(out, 'sprites', data)).split(path.sep).join('/');
  }
  const input = () => sharp(Buffer.concat(raws), { raw: { width: 256, height: 256 * raws.length, channels: 4, pageHeight: 256 } });
  await input().webp({ quality: 93, alphaQuality: 100, effort: 3, loop: 0, delay: delay(info.frames) }).toFile(path.join(out, 'animated', `${clip}.webp`));
  await input().gif({ colours: 256, effort: 3, dither: 0.1, loop: 0, delay: Array.from({ length: info.frames }, (_, i) => (Math.round((i + 1) * 100 / FPS) - Math.round(i * 100 / FPS)) * 10) }).toFile(path.join(out, 'animated', `${clip}.gif`));
  for (const ext of ['webp', 'gif']) files[ext] = path.relative(root, path.join(out, 'animated', `${clip}.${ext}`)).split(path.sep).join('/');
  const media = await sharp(path.join(root, files.webp), { animated: true }).metadata(); assert(media.hasAlpha); assert.equal(media.delay.reduce((a, b) => a + b, 0), info.duration * 1000);
  console.log(`${c.id}/${path.basename(out) === 'helmetless' ? 'helmetless/' : ''}${clip}: ${info.frames} continuous frames, alpha and borders verified.`);
  return { ...info, ...files, columns: COLUMNS, frameSize: [256, 256], shoulderPadsVisible: !!c.armor, helmetVisible: !!c.armor && options.armorRatio !== 0 };
}
const characters = [];
for (const c of ZOMBIES) {
  if (arg('--character', c.id) !== c.id) continue;
  const out = path.join(root, 'characters', c.id), parts = process.argv.includes('--reuse-parts') ? Object.fromEntries(await Promise.all(Object.keys(JSON.parse(await readFile(path.join(out, 'rig.json'), 'utf8')).parts).map(async name => [name, await loadImage(path.join(out, 'parts', `${name}.png`))]))) : await loadParts(c, out);
  if (!parts.rig) parts.rig = JSON.parse(await readFile(path.join(out, 'rig.json'), 'utf8'));
  await writeFile(path.join(out, 'portrait.png'), frame(c, parts, 'idle', 0, 512).toBuffer('image/png'));
  if (process.argv.includes('--parts-only')) { console.log(`${c.id}: 18 rigid pieces assembled.`); continue; }
  for (const folder of ['sprites', 'animated']) await mkdir(path.join(out, folder), { recursive: true });
  const animations = {}, variants = {};
  for (const clip of c.clips) animations[clip] = await exportClip(c, parts, out, clip);
  if (c.armor) {
    const variant = path.join(out, 'helmetless'); for (const folder of ['sprites', 'animated']) await mkdir(path.join(variant, folder), { recursive: true });
    const alternate = {}; for (const clip of ['idle', 'run', 'bite', 'hit', 'spawn', 'fall']) alternate[clip] = await exportClip(c, parts, variant, clip, { armorRatio: 0 });
    variants.helmetless = { helmetVisible: false, shoulderPadsVisible: true, animations: alternate };
  }
  const item = { ...c, moveSpeed: moveSpeed(c), rig: `characters/${c.id}/rig.json`, portrait: `characters/${c.id}/portrait.png`, sourceSheets: parts.rig.sources, animations, variants };
  characters.push(item); await writeFile(path.join(out, 'manifest.json'), JSON.stringify(item, null, 2) + '\n');
}
if (!process.argv.includes('--parts-only')) await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ name: 'Zombis articulados', version: '4.0.0', created: '2026-10-03',
  artwork: 'Built-in ImageGen', animation: 'Continuous rigid part transforms with foot IK', logicalSize: [320, 320], frameSize: [256, 256], hdFrameSize: [512, 512],
  fps: FPS, anchor: [0.5, 0.9], facing: 'left', characters }, null, 2) + '\n');
