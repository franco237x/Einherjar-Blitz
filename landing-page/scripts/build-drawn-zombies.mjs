import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ZOMBIES, CLIPS, clipsFor, renderZombie, animationEvents, afterClip, moveSpeed } from '../public/zombis-vivos/especiales-v3/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--canvas-module');
const { createCanvas, loadImage } = require(flag < 0 ? '@napi-rs/canvas' : process.argv[flag + 1]);
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v3/', import.meta.url));
const SIZE = 256, COLUMNS = 8, POSE_SIZE = 512;
const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];

// Group complete painted sprites across imperfect generated grid gutters.
function extractCells(data, width, height, columns, rows) {
  const components = [];
  const labels = new Int32Array(width * height), queue = new Int32Array(width * height), assigned = [-1];
  let component = 0;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || data[start * 4 + 3] <= 16) continue;
    labels[start] = ++component; queue[0] = start;
    let count = 1, sx = 0, sy = 0;
    for (let q = 0; q < count; q++) {
      const at = queue[q], x = at % width, y = Math.floor(at / width); sx += x; sy += y;
      for (const next of [x ? at - 1 : -1, x < width - 1 ? at + 1 : -1, at >= width ? at - width : -1, at < width * (height - 1) ? at + width : -1])
        if (next >= 0 && !labels[next] && data[next * 4 + 3] > 16) { labels[next] = component; queue[count++] = next; }
    }
    components.push({ label: component, count, x: sx / count, y: sy / count });
  }
  // Raised fists can overlap the next row's y range without touching another body.
  // Cluster complete ink components instead of slicing an arm at a grid boundary.
  const main = [...components].sort((a, b) => b.count - a.count).slice(0, columns * rows).sort((a, b) => a.y - b.y);
  if (process.argv.includes('--debug-cells')) console.log(JSON.stringify({ width, height, components: [...components].sort((a, b) => b.count - a.count).slice(0, 16) }));
  assert.equal(main.length, columns * rows);
  assert(main.every(item => item.count > main[0].count * 0.15), 'Every cell needs one complete connected character.');
  const ordered = [];
  for (let row = 0; row < rows; row++) ordered.push(...main.slice(row * columns, (row + 1) * columns).sort((a, b) => a.x - b.x));
  for (const [index, item] of ordered.entries()) assigned[item.label] = index;
  for (const item of components) if (assigned[item.label] === undefined) {
    let closest = 0, distance = Infinity;
    for (const [index, body] of ordered.entries()) {
      const d = ((item.x - body.x) / (width / columns)) ** 2 + ((item.y - body.y) / (height / rows)) ** 2;
      if (d < distance) { distance = d; closest = index; }
    }
    assigned[item.label] = closest;
  }
  const rowCenters = Array.from({ length: rows }, (_, row) => ordered.slice(row * columns, (row + 1) * columns).reduce((sum, body) => sum + body.y, 0) / columns);
  const cuts = rowCenters.slice(1).map((center, index) => (center + rowCenters[index]) / 2);
  const visible = new Int32Array(labels);
  for (let at = 0; at < labels.length; at++) if (!labels[at] && data[at * 4 + 3]) {
    const x = at % width, y = Math.floor(at / width);
    search: for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && visible[ny * width + nx]) { labels[at] = visible[ny * width + nx]; break search; }
    }
  }
  const regions = Array.from({ length: columns * rows }, () => ({ left: width, top: height, right: -1, bottom: -1 }));
  for (let at = 0; at < labels.length; at++) if (labels[at]) {
    const region = regions[assigned[labels[at]]], x = at % width, y = Math.floor(at / width);
    region.left = Math.min(region.left, x); region.right = Math.max(region.right, x);
    region.top = Math.min(region.top, y); region.bottom = Math.max(region.bottom, y);
  }
  for (const region of regions) {
    assert(region.right >= region.left, 'A painted pose is missing.');
    region.width = region.right - region.left + 1; region.height = region.bottom - region.top + 1;
    region.pixels = Buffer.alloc(region.width * region.height * 4);
  }
  for (let at = 0; at < labels.length; at++) if (labels[at]) {
    const region = regions[assigned[labels[at]]], x = at % width - region.left, y = Math.floor(at / width) - region.top;
    data.copy(region.pixels, (y * region.width + x) * 4, at * 4, at * 4 + 4);
  }
  return { regions, cuts };
}
function costumeAnchor(region, character, baseHeight) {
  let sum = 0, count = 0;
  const top = Math.max(0, Math.floor(region.height - baseHeight * 0.45)), bottom = Math.min(region.height, Math.ceil(region.height - baseHeight * 0.1));
  for (let y = top; y < bottom; y++) for (let x = 0; x < region.width; x++) {
    const at = (y * region.width + x) * 4, [r, g, b, a] = region.pixels.subarray(at, at + 4);
    if (a > 128 && (character.id === 'bruton' ? r > g * 1.25 && b > g * 1.12 : r > g * 1.5 && r > b * 1.5)) { sum += x; count++; }
  }
  return count > 10 ? sum / count : region.width / 2;
}
const reports = [], cast = [];
for (const character of ZOMBIES) {
  const output = path.join(root, 'characters', character.id), targetHeight = character.id === 'bruton' ? 135 : 140;
  await mkdir(path.join(output, 'poses'), { recursive: true });
  const parts = {}, sheets = {}, scales = new Map();
  for (const sheet of character.sheets) {
    const bare = sheet.endsWith('-unarmored'), baseName = sheet.replace('-unarmored', '');
    const source = path.join(root, 'source', `${character.id}-${sheet}.png`);
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let clear = 0; for (let i = 3; i < data.length; i += 4) if (!data[i]) clear++;
    assert(clear / (info.width * info.height) > 0.15, 'Source requires genuine alpha.');
    const grid = ['walk', 'run', 'smash'].includes(baseName) ? [4, 3] : [3, 4];
    const { regions, cuts } = extractCells(data, info.width, info.height, ...grid);
    const reference = baseName === 'states' ? [0, 1, 5] : baseName === 'smash' ? [0, 11] : [0];
    const baseHeight = median(reference.map(index => regions[index].height));
    const scale = bare ? scales.get(baseName).scale * scales.get(baseName).width / info.width : targetHeight / baseHeight;
    if (!bare) scales.set(baseName, { scale, width: info.width });
    const board = createCanvas(POSE_SIZE * COLUMNS, POSE_SIZE * 2), ctx = board.getContext('2d'), registration = [];
    ctx.scale(2, 2);
    for (const [index, region] of regions.entries()) {
      const w = region.width * scale, h = region.height * scale;
      const falling = baseName === 'states' && index >= 6;
      const anchor = falling ? region.width / 2 : costumeAnchor(region, character, baseHeight);
      const desired = falling ? Math.min(144, 253 - w / 2) : baseName === 'bite' ? 154 : 146;
      const x = desired - anchor * scale;
      const flight = baseName === 'run' ? [0, 0, 2, 9, 5, 0, 9, 4, 0, 8, 0, 0][index] : 0;
      const y = 230.4 - h - flight;
      assert(x > 2 && x + w < 254 && y > 2 && y + h < 254, `${character.id}/${sheet}/${index}: pose must fit without shrinking or clipping (${x},${y},${w},${h}).`);
      const image = await loadImage(await sharp(region.pixels, { raw: { width: region.width, height: region.height, channels: 4 } }).png().toBuffer());
      ctx.drawImage(image, (index % COLUMNS) * SIZE + x, Math.floor(index / COLUMNS) * SIZE + y, w, h);
      registration.push({ frame: index, sourceBounds: { x: region.left, y: region.top, w: region.width, h: region.height }, scale, x, y, width: w, height: h, flight });
    }
    const buffer = board.toBuffer('image/png');
    await writeFile(path.join(output, 'poses', sheet + '.png'), buffer);
    sheets[sheet] = { image: `characters/${character.id}/poses/${sheet}.png`, grid: [8, 2], frameSize: [512, 512], paintedPoses: 12, source: `source/${character.id}-${sheet}.png`, sourceGrid: grid, rowCuts: cuts, registration };
    parts[sheet] = await loadImage(buffer);
    console.log(`${character.id}/${sheet}: 12 complete-body painted poses, one uniform scale per sheet.`);
  }
  if (character.armor) for (const name of ['gear', 'pads']) {
    const source = path.join(root, 'source', `rafago-${name}.png`);
    await copyFile(source, path.join(output, 'poses', `${name}.png`)); parts[name] = await loadImage(source);
  }
  const portrait = createCanvas(512, 512), pctx = portrait.getContext('2d'); pctx.scale(1.6, 1.6);
  renderZombie(pctx, character, parts, 'idle', 0);
  await writeFile(path.join(output, 'portrait.png'), portrait.toBuffer('image/png'));
  const animations = {}, variants = {};
  async function exportClip(clip, alternate = false) {
    const info = CLIPS[clip], subroot = alternate ? path.join(output, 'unarmored') : output;
    for (const directory of ['sprites', 'animated']) await mkdir(path.join(subroot, directory), { recursive: true });
    const atlas = createCanvas(SIZE * COLUMNS, SIZE * Math.ceil(info.frames / COLUMNS)), actx = atlas.getContext('2d'), frames = [], entries = [];
    const hdAtlas = createCanvas(SIZE * 2 * COLUMNS, SIZE * 2 * Math.ceil(info.frames / COLUMNS)), hdCtx = hdAtlas.getContext('2d');
    for (let index = 0; index < info.frames; index++) {
      const canvas = createCanvas(SIZE, SIZE), ctx = canvas.getContext('2d'); ctx.scale(0.8, 0.8);
      const pose = renderZombie(ctx, character, parts, clip, index / info.fps, { armorRatio: alternate ? 0 : 1 });
      const pixels = Buffer.from(ctx.getImageData(0, 0, SIZE, SIZE).data);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (x < 2 || x >= SIZE - 2 || y < 2 || y >= SIZE - 2)
        assert.equal(pixels[(y * SIZE + x) * 4 + 3], 0, `${character.id}/${clip}: frame border clipping.`);
      frames.push(pixels); actx.drawImage(canvas, index % COLUMNS * SIZE, Math.floor(index / COLUMNS) * SIZE);
      const hdFrame = createCanvas(SIZE * 2, SIZE * 2), hctx = hdFrame.getContext('2d'); hctx.scale(1.6, 1.6);
      renderZombie(hctx, character, parts, clip, index / info.fps, { armorRatio: alternate ? 0 : 1 });
      hdCtx.drawImage(hdFrame, index % COLUMNS * SIZE * 2, Math.floor(index / COLUMNS) * SIZE * 2);
      entries.push({ filename: `${character.id}-${clip}-${String(index).padStart(3, '0')}`, frame: { x: index % COLUMNS * SIZE, y: Math.floor(index / COLUMNS) * SIZE, w: SIZE, h: SIZE },
        rotated: false, trimmed: false, sourceSize: { w: SIZE, h: SIZE }, spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE }, pivot: { x: 0.5, y: 0.9 },
        duration: Math.round((index + 1) * 1000 / info.fps) - Math.round(index * 1000 / info.fps), paintedPose: { sheet: pose.sheet, frame: pose.frame } });
    }
    const metadata = { ...info, after: afterClip(clip, character), facing: 'left', armorVisible: character.armor > 0 && !alternate,
      events: animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * info.fps) })) };
    await writeFile(path.join(subroot, 'sprites', clip + '.png'), atlas.toBuffer('image/png'));
    await writeFile(path.join(subroot, 'sprites', clip + '.json'), JSON.stringify({ frames: entries, meta: { app: 'Einherjar Blitz / Painted zombies', image: clip + '.png',
      format: 'RGBA8888', size: { w: atlas.width, h: atlas.height }, animation: metadata } }, null, 2) + '\n');
    await writeFile(path.join(subroot, 'sprites', clip + '@2x.png'), hdAtlas.toBuffer('image/png'));
    await writeFile(path.join(subroot, 'sprites', clip + '@2x.json'), JSON.stringify({ frames: entries.map(entry => ({ ...entry,
      frame: { x: entry.frame.x * 2, y: entry.frame.y * 2, w: 512, h: 512 }, sourceSize: { w: 512, h: 512 }, spriteSourceSize: { x: 0, y: 0, w: 512, h: 512 } })),
      meta: { app: 'Einherjar Blitz / Painted zombies', image: clip + '@2x.png', format: 'RGBA8888', size: { w: hdAtlas.width, h: hdAtlas.height }, pixelRatio: 2, animation: metadata } }, null, 2) + '\n');
    const input = () => sharp(Buffer.concat(frames), { raw: { width: SIZE, height: SIZE * info.frames, channels: 4, pageHeight: SIZE } });
    await input().webp({ quality: 96, effort: 3, loop: info.loop ? 0 : 1, delay: entries.map(frame => frame.duration) }).toFile(path.join(subroot, 'animated', clip + '.webp'));
    await input().gif({ colours: 256, effort: 3, dither: 0.1, loop: info.loop ? 0 : 1,
      delay: entries.map((_, index) => (Math.round((index + 1) * 100 / info.fps) - Math.round(index * 100 / info.fps)) * 10) }).toFile(path.join(subroot, 'animated', clip + '.gif'));
    const webp = await sharp(path.join(subroot, 'animated', clip + '.webp'), { animated: true }).metadata();
    assert(webp.hasAlpha); assert.equal(webp.delay.reduce((sum, ms) => sum + ms, 0), info.duration * 1000);
    const relative = directory => path.relative(root, path.join(subroot, directory, clip)).replaceAll(path.sep, '/');
    return { ...metadata, atlas: relative('sprites') + '.png', data: relative('sprites') + '.json', hdAtlas: relative('sprites') + '@2x.png', hdData: relative('sprites') + '@2x.json', webp: relative('animated') + '.webp', gif: relative('animated') + '.gif', frameSize: [256, 256], hdFrameSize: [512, 512], columns: 8,
      paintedPoses: new Set(entries.map(entry => `${entry.paintedPose.sheet}/${entry.paintedPose.frame}`)).size };
  }
  if (!process.argv.includes('--poses-only')) {
    for (const clip of character.clips) { animations[clip] = await exportClip(clip); console.log(`${character.id}/${clip}: ${animations[clip].frames} atlas frames.`); }
    if (character.armor) {
      const alternate = {};
      for (const clip of ['idle', 'run', 'bite', 'hit', 'fall']) alternate[clip] = await exportClip(clip, true);
      variants.unarmored = { armorVisible: false, animations: alternate };
    }
    const manifest = { ...character, portrait: `characters/${character.id}/portrait.png`, moveSpeed: moveSpeed(character), poseSheets: sheets, animations, variants };
    await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    reports.push({ id: character.id, clips: Object.keys(animations).length, frames: Object.values(animations).reduce((s, a) => s + a.frames, 0),
      variantClips: Object.keys(variants.unarmored?.animations ?? {}).length, variantFrames: Object.values(variants.unarmored?.animations ?? {}).reduce((s, a) => s + a.frames, 0),
      alpha: 'verified', clipping: 'none', uniformPoseScale: 'verified', encodedDuration: 'exact' });
    cast.push(manifest);
  }
  await writeFile(path.join(output, 'pose-registration.json'), JSON.stringify(sheets, null, 2) + '\n');
}
if (!process.argv.includes('--poses-only')) {
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ name: 'Brutón y Ráfago / poses completas', version: '3.0.0', created: '2026-10-02', artwork: 'Built-in ImageGen / complete-body painted pose sequences',
    logicalSize: [320, 320], frameSize: [256, 256], anchor: [0.5, 0.9], fps: 30, facing: 'left', flipForRight: true, characters: cast }, null, 2) + '\n');
  await writeFile(path.join(root, 'validation.json'), JSON.stringify({ date: '2026-10-02', characters: reports }, null, 2) + '\n');
}
