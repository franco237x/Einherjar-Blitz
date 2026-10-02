import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url), sharp = require('sharp');
const root = fileURLToPath(new URL('../public/jardin-yggdrasil/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const geometry = JSON.parse(await readFile(path.join(root, 'background', 'geometry.json'), 'utf8'));
const background = await sharp(path.join(root, geometry.image)).metadata();
assert.equal(background.width, 2320); assert.equal(background.height, 1390); assert.equal(background.hasAlpha, false);
assert.deepEqual(geometry.lawn, { x: 180, y: 190, width: 1800, height: 1150, columns: 9, rows: 5, cellWidth: 200, cellHeight: 230 });
assert.equal(geometry.cells.length, 45);
const whole = await sharp(path.join(root, geometry.image)).raw().toBuffer();
for (const cell of geometry.cells) {
  assert.equal(cell.x, 180 + cell.column * 200); assert.equal(cell.y, 190 + cell.row * 230);
  assert.equal(cell.width, 200); assert.equal(cell.height, 230);
  const tile = await sharp(path.join(root, 'source', `grass-${cell.texture}.png`)).flip(cell.flip).flop(cell.flop).raw().toBuffer();
  for (let y = 0; y < 230; y++) {
    const start = ((cell.y + y) * 2320 + cell.x) * 3;
    assert(whole.subarray(start, start + 600).equals(tile.subarray(y * 600, (y + 1) * 600)), `Actual cell ${cell.index} pixels must agree with exact coordinates.`);
  }
}
const rig = JSON.parse(await readFile(path.join(root, 'podadora', 'manifest.json'), 'utf8'));
assert.deepEqual(rig.pivot, { x: 0.47, y: 0.9 }); assert.equal(rig.groundY, 230); assert.equal(rig.facing, 'right');
assert.equal(manifest.mower.movement, 'external'); assert.equal(manifest.mower.oncePerLane, true);
const expected = { idle: 36, start: 12, run: 24 }, checks = [];
for (const [clip, count] of Object.entries(expected)) {
  const paths = rig.animations[clip]; for (const key of ['atlas', 'data', 'webp', 'gif']) await access(path.join(root, paths[key]));
  const atlas = JSON.parse(await readFile(path.join(root, paths.data), 'utf8'));
  const png = await sharp(path.join(root, paths.atlas)).metadata();
  assert(png.hasAlpha); assert.equal(png.width, 2048); assert.equal(png.height, Math.ceil(count / 8) * 256);
  assert.equal(atlas.frames.length, count); assert.equal(atlas.meta.animation.fps, 30);
  assert.equal(atlas.meta.animation.loop, clip !== 'start'); assert.equal(atlas.meta.animation.after, clip === 'idle' ? 'idle' : 'run');
  assert.equal(atlas.frames.reduce((sum, frame) => sum + frame.duration, 0), count / 30 * 1000);
  let smallest = Infinity, largest = 0, difference = 0, previous;
  for (const [index, frame] of atlas.frames.entries()) {
    assert.deepEqual(frame.pivot, { x: 0.47, y: 0.9 });
    assert.deepEqual(frame.frame, { x: index % 8 * 256, y: Math.floor(index / 8) * 256, w: 256, h: 256 });
    const pixels = await sharp(path.join(root, paths.atlas)).extract({ left: frame.frame.x, top: frame.frame.y, width: 256, height: 256 }).raw().toBuffer();
    let left = 256, right = -1, bottom = -1, clear = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const alpha = pixels[(y * 256 + x) * 4 + 3]; if (!alpha) clear++;
      if (alpha > 20) { left = Math.min(left, x); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    }
    assert(clear > 256 * 256 * 0.6); assert(bottom >= 229 && bottom <= 230);
    const width = right - left + 1; assert(width >= 120 && width <= 130);
    assert(90 + left - 0.47 * 256 >= 0 && 90 + right - 0.47 * 256 <= 180, 'The actual mower sprite must fit the home strip at x=90.');
    smallest = Math.min(smallest, width); largest = Math.max(largest, width);
    if (previous) for (let i = 0; i < pixels.length; i++) difference += Math.abs(pixels[i] - previous[i]);
    previous = pixels;
  }
  assert(difference > 2000, `${clip} must visibly animate`);
  // Unused atlas slots are truly empty rather than duplicate playback frames.
  for (let index = count; index < Math.ceil(count / 8) * 8; index++) {
    const pixels = await sharp(path.join(root, paths.atlas)).extract({ left: index % 8 * 256, top: Math.floor(index / 8) * 256, width: 256, height: 256 }).raw().toBuffer();
    for (let alpha = 3; alpha < pixels.length; alpha += 4) assert.equal(pixels[alpha], 0);
  }
  const animated = await sharp(path.join(root, paths.webp), { animated: true }).metadata();
  assert(animated.hasAlpha); assert.equal(animated.delay.reduce((a, b) => a + b, 0), count / 30 * 1000);
  checks.push({ clip, atlasSize: [png.width, png.height], frames: count, fps: 30, widthRange: [smallest, largest], groundY: 230, homeStrip: 'fits', alpha: true, motion: true });
}
const report = { date: '2026-10-02', background: { size: [2320, 1390], opaque: true, cells: 45, actualPixelGeometry: 'verified', lawnOrigin: [180, 190], cellSize: [200, 230] },
  mower: { facing: 'right', pivot: [0.47, 0.9], groundY: 230, mainFrames: 72, states: checks, start: 'one-shot → run', movement: 'external', oncePerLane: true } };
await writeFile(path.join(root, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
