import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
const root = fileURLToPath(new URL('../public/jardin-yggdrasil/', import.meta.url));
const FRAME = 256, FPS = 30, COLUMNS = 8, PIVOT = { x: 0.47, y: 0.9 }, GROUND = 230;
const CLIPS = {
  idle: { label: 'Reposo', frames: 36, duration: 1.2, loop: true, after: 'idle' },
  start: { label: 'Arranque', frames: 12, duration: 0.4, loop: false, after: 'run' },
  run: { label: 'En marcha', frames: 24, duration: 0.8, loop: true, after: 'run' },
};
const NAMES = ['reference', 'chassis', 'wheel-back', 'wheel-front', 'handle', 'glint', 'smoke', 'dust'];
const transparent = { r: 0, g: 0, b: 0, alpha: 0 }, TAU = 2 * Math.PI;
for (const dir of ['background', 'podadora/parts', 'podadora/sprites', 'podadora/animated', 'effects', 'preview']) await mkdir(path.join(root, dir), { recursive: true });

function bounds(data, width, height, threshold = 20) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > threshold) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return right < left ? null : { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}
const clamp = t => Math.max(0, Math.min(1, t));
const smooth = t => { const v = clamp(t); return v * v * (3 - 2 * v); };
const pulse = (t, start, peak, end) => t < peak ? smooth((t - start) / (peak - start)) : 1 - smooth((t - peak) / (end - peak));

async function buildBackground() {
  // Bake generated grass tiles into one opaque image. Geometry uses integer coordinates.
  const paletteFile = path.join(root, 'source', 'grass-master.png'), palette = await sharp(paletteFile).metadata();
  const tileImages = [];
  for (let index = 0; index < 2; index++) {
    const half = Math.floor(palette.width / 2), insetX = Math.round(half * 0.08), insetY = Math.round(palette.height * 0.08);
    const buffer = await sharp(paletteFile).extract({ left: index * half + insetX, top: insetY, width: half - insetX * 2, height: palette.height - insetY * 2 })
      .resize(200, 230, { fit: 'fill' }).removeAlpha().png().toBuffer();
    await writeFile(path.join(root, 'source', index ? 'grass-dark.png' : 'grass-light.png'), buffer); tileImages.push(buffer);
  }
  const composite = [], cells = [];
  for (let row = 0; row < 5; row++) for (let column = 0; column < 9; column++) {
    const index = (row + column) % 2, flip = row % 2 === 1, flop = column % 2 === 1;
    const texture = await sharp(tileImages[index]).flip(flip).flop(flop).png().toBuffer();
    const left = 180 + column * 200, top = 190 + row * 230;
    composite.push({ input: texture, left, top });
    cells.push({ index: row * 9 + column, row, column, x: left, y: top, width: 200, height: 230, texture: index ? 'dark' : 'light', flip, flop });
  }
  const output = path.join(root, 'background', 'jardin-yggdrasil.webp');
  await sharp(path.join(root, 'source', 'garden-master.png')).resize(2320, 1390, { fit: 'fill' })
    .composite(composite).flatten({ background: '#dde5cb' }).removeAlpha().webp({ lossless: true, effort: 5 }).toFile(output);
  const geometry = { image: 'background/jardin-yggdrasil.webp', width: 2320, height: 1390, opaque: true,
    lawn: { x: 180, y: 190, width: 1800, height: 1150, columns: 9, rows: 5, cellWidth: 200, cellHeight: 230 },
    zones: { home: { x: 0, y: 190, width: 180, height: 1150 }, entrance: { x: 1980, y: 190, width: 340, height: 1150 },
      sky: { x: 0, y: 0, width: 2320, height: 190 }, bottom: { x: 0, y: 1340, width: 2320, height: 50 } }, cells };
  await writeFile(path.join(root, 'background', 'geometry.json'), JSON.stringify(geometry, null, 2) + '\n');
  const decoded = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, 2320); assert.equal(decoded.info.height, 1390); assert.equal(decoded.info.channels, 3);
  // Pixel equality proves the actual output has all 45 exact rectangles, not just metadata.
  for (const [index, cell] of cells.entries()) {
    const tile = await sharp(composite[index].input).raw().toBuffer();
    for (let y = 0; y < 230; y++) {
      const offset = ((cell.y + y) * 2320 + cell.x) * 3;
      assert(decoded.data.subarray(offset, offset + 200 * 3).equals(tile.subarray(y * 200 * 3, (y + 1) * 200 * 3)), `Lawn cell ${index}: pixel alignment`);
    }
  }
  const means = [];
  for (const texture of tileImages) means.push((await sharp(texture).stats()).channels.map(channel => channel.mean));
  const contrast = means[0].reduce((sum, value, index) => sum + Math.abs(value - means[1][index]), 0);
  assert(contrast > 18, 'The two lawn greens must be distinguishable.');
  await sharp(output).resize({ width: 1160 }).png().toFile(path.join(root, 'preview', 'jardin.png'));
  console.log('Background: opaque 2320×1390; all 45 exact 200×230 cells verified pixel by pixel.');
  return { ...geometry, cells: undefined, cellCount: cells.length, meanGreens: means.map(mean => mean.map(Math.round)), contrast };
}

async function extractParts() {
  const { data, info } = await sharp(path.join(root, 'source', 'mower-parts.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0; for (let index = 3; index < data.length; index += 4) if (!data[index]) clear++;
  assert(clear > info.width * info.height * 0.2, 'The mower source must have real alpha.');
  const labels = new Int32Array(info.width * info.height), queue = new Int32Array(labels.length), assignments = [-1];
  let component = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 16) continue;
    component++; labels[start] = component; queue[0] = start;
    let count = 1, cursor = 0, sumX = 0, sumY = 0;
    while (cursor < count) {
      const pixel = queue[cursor++], x = pixel % info.width, y = Math.floor(pixel / info.width); sumX += x; sumY += y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || nx >= info.width || ny < 0 || ny >= info.height) continue;
        const next = ny * info.width + nx;
        if (!labels[next] && data[next * 4 + 3] > 16) { labels[next] = component; queue[count++] = next; }
      }
    }
    assignments[component] = Math.min(3, Math.floor(sumX / count / info.width * 4)) + (sumY / count > info.height * 0.5 ? 4 : 0);
  }
  const visible = new Int32Array(labels);
  for (let index = 0; index < labels.length; index++) if (!labels[index] && data[index * 4 + 3]) {
    const x = index % info.width, y = Math.floor(index / info.width);
    outer: for (let radius = 1; radius <= 3; radius++) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < info.width && ny >= 0 && ny < info.height && visible[ny * info.width + nx]) { labels[index] = visible[ny * info.width + nx]; break outer; }
    }
  }
  const parts = {}, regions = [];
  for (const [cell, name] of NAMES.entries()) {
    const pixels = Buffer.alloc(data.length);
    for (let index = 0; index < labels.length; index++) if (labels[index] && assignments[labels[index]] === cell) data.copy(pixels, index * 4, index * 4, index * 4 + 4);
    const content = bounds(pixels, info.width, info.height, 8); assert(content, `Missing part ${name}`);
    const buffer = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract({ left: content.left, top: content.top, width: content.width, height: content.height })
      .extend({ top: 2, left: 2, right: 2, bottom: 2, background: transparent }).png().toBuffer();
    await writeFile(path.join(root, 'podadora', 'parts', `${name}.png`), buffer);
    parts[name] = await loadImage(buffer); regions.push({ name, sourceRegion: content });
  }
  await writeFile(path.join(root, 'effects', 'sweep-dust.png'), await readFile(path.join(root, 'podadora', 'parts', 'dust.png')));
  return { parts, sourceSize: [info.width, info.height], regions };
}
function part(ctx, image, x, y, width, height, angle = 0, ax = 0.5, ay = 1) {
  const sourceWidth = image.width - 4, sourceHeight = image.height - 4;
  const scale = Math.min(width / sourceWidth, height / sourceHeight), w = sourceWidth * scale, h = sourceHeight * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.drawImage(image, 2, 2, sourceWidth, sourceHeight, -w * ax, -h * ay, w, h); ctx.restore();
}
function wheel(ctx, image, x, radius, angle) {
  ctx.save(); ctx.translate(x, GROUND - radius); ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.clip(); ctx.rotate(angle);
  ctx.drawImage(image, 2, 2, image.width - 4, image.height - 4, -radius, -radius, radius * 2, radius * 2); ctx.restore();
}
function drawLocal(ctx, parts, clip, seconds, localBounds) {
  const progress = clamp(seconds / CLIPS[clip].duration), phase = progress * TAU;
  let shakeX = 0, shakeY = 0, angle = 0, handleAngle = 0, spin = 0, smoke = 0, dust = 0, shine = 0;
  if (clip === 'idle') {
    shakeY = Math.sin(phase) * 0.23; angle = Math.sin(phase) * 0.003;
    handleAngle = (Math.sin(phase - 0.25) + Math.sin(0.25)) * 0.004;
    shine = pulse(progress, 0.08, 0.30, 0.57) * 0.8;
  }
  if (clip === 'start') {
    const strength = (1 - smooth(progress)) * smooth(progress / 0.08);
    shakeX = Math.sin(phase * 3) * 1.5 * strength; shakeY = -Math.sin(phase * 2) * 1.1 * strength;
    angle = Math.sin(phase * 3) * 0.024 * strength; handleAngle = -angle * 1.4;
    smoke = pulse(progress, 0.03, 0.37, 0.95); spin = Math.sin(phase * 2) * 0.04 * strength;
    shine = pulse(progress, 0.05, 0.23, 0.55);
  }
  if (clip === 'run') {
    shakeY = Math.sin(phase * 2) * 0.5; angle = Math.sin(phase * 2) * 0.007;
    handleAngle = -Math.sin(phase * 2) * 0.008; spin = phase;
    dust = pulse(progress, 0.05, 0.30, 0.77) * 0.66;
  }
  const minX = localBounds?.left ?? 54;
  if (smoke) {
    ctx.save(); ctx.globalAlpha *= smoke * 0.82;
    part(ctx, parts.smoke, minX + 17 + progress * 3, 189 - progress * 13, 24 + progress * 3, 29 + progress * 8, 0, 0.5, 0.5); ctx.restore();
  }
  wheel(ctx, parts['wheel-back'], 91, 15, spin);
  part(ctx, parts.handle, 112 + shakeX * 0.6, 201 + shakeY * 0.6, 70, 82, handleAngle, 0.9, 1);
  part(ctx, parts.chassis, 125 + shakeX, 216 + shakeY, 112, 59, angle, 0.5, 1);
  wheel(ctx, parts['wheel-front'], 157, 13, spin);
  if (shine) { ctx.save(); ctx.globalAlpha *= shine; part(ctx, parts.glint, 139 + shakeX, 168 + shakeY, 8, 8, 0, 0.5, 0.5); ctx.restore(); }
  if (dust) { ctx.save(); ctx.globalAlpha *= dust; part(ctx, parts.dust, minX + 22, 229, 26, 13); ctx.restore(); }
}
function frame(parts, transform, clip, seconds) {
  const canvas = createCanvas(FRAME, FRAME), ctx = canvas.getContext('2d');
  ctx.translate(PIVOT.x * FRAME, GROUND); ctx.scale(transform.scale, transform.scale); ctx.translate(-transform.centerX, -GROUND);
  drawLocal(ctx, parts, clip, seconds, transform.bounds); return canvas;
}
async function animationBuffers(frames, width, height, folder, name) {
  const input = () => sharp(Buffer.concat(frames), { raw: { width, height: height * frames.length, channels: 4, pageHeight: height } });
  const delays = frames.map((_, index) => Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS));
  await input().webp({ quality: 94, alphaQuality: 100, effort: 4, loop: 0, delay: delays }).toFile(path.join(folder, `${name}.webp`));
  const gifDelays = frames.map((_, index) => (Math.round((index + 1) * 100 / FPS) - Math.round(index * 100 / FPS)) * 10);
  await input().gif({ colours: 256, dither: 0.1, effort: 3, loop: 0, delay: gifDelays }).toFile(path.join(folder, `${name}.gif`));
}
async function buildMower() {
  const { parts, sourceSize, regions } = await extractParts();
  const initial = createCanvas(FRAME, FRAME); drawLocal(initial.getContext('2d'), parts, 'idle', 0);
  const initialBounds = bounds(initial.getContext('2d').getImageData(0, 0, FRAME, FRAME).data, FRAME, FRAME);
  const transform = { centerX: (initialBounds.left + initialBounds.right + 1) / 2, scale: 126 / initialBounds.width, bounds: initialBounds };
  const portraits = frame(parts, transform, 'idle', 0); await writeFile(path.join(root, 'podadora', 'portrait.png'), portraits.toBuffer('image/png'));
  if (process.argv.includes('--parts-only')) { console.log(JSON.stringify({ sourceSize, regions, transform })); return null; }
  const animations = {}, reports = [];
  for (const [clip, info] of Object.entries(CLIPS)) {
    const atlas = createCanvas(FRAME * COLUMNS, FRAME * Math.ceil(info.frames / COLUMNS)), atlasCtx = atlas.getContext('2d');
    const frames = [], entries = []; let difference = 0, previous, minWidth = Infinity, maxWidth = 0;
    for (let index = 0; index < info.frames; index++) {
      const image = frame(parts, transform, clip, index / FPS), pixels = Buffer.from(image.getContext('2d').getImageData(0, 0, FRAME, FRAME).data);
      const content = bounds(pixels, FRAME, FRAME);
      assert(content && content.width >= 120 && content.width <= 130, `${clip}/${index}: mower width ${JSON.stringify(content)}`);
      assert(content.left > 2 && content.right < 253 && content.top > 2 && content.bottom >= 229 && content.bottom <= 230,
        `${clip}/${index}: frame or ground ${JSON.stringify(content)}`);
      if (previous) for (let channel = 0; channel < pixels.length; channel++) difference += Math.abs(pixels[channel] - previous[channel]);
      previous = pixels; frames.push(pixels); minWidth = Math.min(minWidth, content.width); maxWidth = Math.max(maxWidth, content.width);
      const x = index % COLUMNS * FRAME, y = Math.floor(index / COLUMNS) * FRAME; atlasCtx.drawImage(image, x, y);
      entries.push({ filename: `podadora-${clip}-${String(index).padStart(3, '0')}`, frame: { x, y, w: FRAME, h: FRAME }, rotated: false, trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: FRAME, h: FRAME }, sourceSize: { w: FRAME, h: FRAME }, pivot: PIVOT,
        duration: Math.round((index + 1) * 1000 / FPS) - Math.round(index * 1000 / FPS) });
    }
    assert(difference > 2000, `${clip}: visible motion required`);
    if (info.loop) assert(frame(parts, transform, clip, 0).toBuffer('image/png').equals(frame(parts, transform, clip, info.duration).toBuffer('image/png')), `${clip}: loop seam`);
    await writeFile(path.join(root, 'podadora', 'sprites', `${clip}.png`), atlas.toBuffer('image/png'));
    const metadata = { frames: entries, meta: { app: 'Einherjar Blitz / Jardín de Yggdrasil', version: '1.0', image: `${clip}.png`, format: 'RGBA8888',
      size: { w: atlas.width, h: atlas.height }, scale: '1', animation: { ...info, fps: FPS, facing: 'right', groundY: GROUND, pivot: PIVOT,
        movement: 'external', oncePerLane: true, ...(clip === 'start' ? { events: [{ type: 'animation-cue', cue: 'engine-ignition', gameplay: false, time: 0.1, frame: 3 }] } : {}) } } };
    await writeFile(path.join(root, 'podadora', 'sprites', `${clip}.json`), JSON.stringify(metadata, null, 2) + '\n');
    await animationBuffers(frames, FRAME, FRAME, path.join(root, 'podadora', 'animated'), clip);
    const encoded = await sharp(path.join(root, 'podadora', 'animated', `${clip}.webp`), { animated: true }).metadata();
    assert(encoded.hasAlpha); assert.equal(encoded.delay.reduce((a, b) => a + b, 0), info.duration * 1000);
    animations[clip] = { ...info, fps: FPS, atlas: `podadora/sprites/${clip}.png`, data: `podadora/sprites/${clip}.json`, webp: `podadora/animated/${clip}.webp`, gif: `podadora/animated/${clip}.gif` };
    reports.push({ clip, frames: info.frames, widthRange: [minWidth, maxWidth], groundY: GROUND, alpha: 'verified', loopSeam: info.loop ? 'pixel-identical' : 'one-shot', motion: 'verified' });
    console.log(`Mower/${clip}: ${info.frames} frames; width ${minWidth}–${maxWidth}; ground ${GROUND}; alpha and motion verified.`);
  }
  const rig = { id: 'podadora-nordica', facing: 'right', frameSize: [FRAME, FRAME], groundY: GROUND, pivot: PIVOT, nominalWidth: 126, transform, sourceSize, regions, animations };
  await writeFile(path.join(root, 'podadora', 'manifest.json'), JSON.stringify(rig, null, 2) + '\n');
  const timeline = [['idle', 1.2], ['start', 0.4], ['run', 1.6]], reviewFrames = [];
  for (const [clip, duration] of timeline) for (let index = 0; index < duration * FPS; index++) {
    const preview = createCanvas(512, 312), ctx = preview.getContext('2d');
    ctx.fillStyle = '#f3ecdf'; ctx.fillRect(0, 0, 512, 312); ctx.fillStyle = '#334846'; ctx.font = 'bold 20px Trebuchet MS'; ctx.fillText(CLIPS[clip].label, 24, 32);
    ctx.strokeStyle = '#c6d0b6'; ctx.beginPath(); ctx.moveTo(24, 280); ctx.lineTo(488, 280); ctx.stroke();
    ctx.save(); ctx.translate(16, -180); ctx.scale(2, 2); ctx.drawImage(frame(parts, transform, clip, index / FPS % CLIPS[clip].duration), 0, 0); ctx.restore();
    reviewFrames.push(Buffer.from(ctx.getImageData(0, 0, 512, 312).data));
  }
  await animationBuffers(reviewFrames, 512, 312, path.join(root, 'preview'), 'podadora');
  const poses = createCanvas(768, 256), posesCtx = poses.getContext('2d');
  ['idle', 'start', 'run'].forEach((clip, index) => posesCtx.drawImage(frame(parts, transform, clip, CLIPS[clip].duration * 0.4), index * 256, 0));
  await writeFile(path.join(root, 'preview', 'podadora-poses.png'), poses.toBuffer('image/png'));
  return { rig, reports, portrait: portraits };
}

const mower = await buildMower();
if (!process.argv.includes('--mower-only') && !process.argv.includes('--parts-only')) {
  const background = await buildBackground();
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ name: 'Jardín de Yggdrasil', version: '1.0.0', created: '2026-10-02',
    artwork: 'Built-in ImageGen; original raster environment, generated grass textures and articulated mower cutouts', background,
    mower: { manifest: 'podadora/manifest.json', frameSize: [FRAME, FRAME], columns: COLUMNS, fps: FPS, pivot: PIVOT, groundY: GROUND,
      facing: 'right', nominalWidth: 126, oncePerLane: true, movement: 'external', animations: mower.rig.animations }, effects: { sweepDust: 'effects/sweep-dust.png' } }, null, 2) + '\n');
  const garden = createCanvas(2320, 1390), ctx = garden.getContext('2d'); ctx.drawImage(await loadImage(path.join(root, background.image)), 0, 0);
  for (let row = 0; row < 5; row++) ctx.drawImage(mower.portrait, 90 - PIVOT.x * FRAME, 190 + (row + 1) * 230 - 18 - GROUND);
  await sharp(garden.toBuffer('image/png')).resize({ width: 1160 }).webp({ quality: 95 }).toFile(path.join(root, 'preview', 'jardin-con-podadoras.webp'));
  await writeFile(path.join(root, 'validation.json'), JSON.stringify({ date: '2026-10-02', background: { dimensions: [2320, 1390], opaque: true, cells: 45,
    lawnPixels: 'all 45 rectangles pixel-identical to their generated texture tile', cellSize: [200, 230], origin: [180, 190], strongPerspective: false, charactersOrPropsOnLawn: false }, mower: mower.reports }, null, 2) + '\n');
}
