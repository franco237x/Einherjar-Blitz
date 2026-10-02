import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ZOMBIES, CLIPS, ZombieAnimator, moveSpeed, animationEvents } from '../public/zombis-vivos/especiales-v3/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag < 0 ? 'playwright' : process.argv[flag + 1]);
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v3/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
let primary = 0, frames = 0, variants = 0, variantFrames = 0, painted = 0;
for (const character of manifest.characters) {
  for (const sheet of Object.values(character.poseSheets)) {
    assert.equal(sheet.paintedPoses, 12); assert.deepEqual(sheet.frameSize, [512, 512]);
    assert.equal(new Set(sheet.registration.map(frame => frame.scale)).size, 1, 'Per-pose resizing would distort the body.');
    for (const pose of sheet.registration) assert(Math.abs(pose.width / pose.height - pose.sourceBounds.w / pose.sourceBounds.h) < 1e-9);
    const image = await sharp(path.join(root, sheet.image)).metadata(); assert(image.hasAlpha); assert.equal(image.width, 4096);
    const hashes = [];
    for (let index = 0; index < 12; index++) {
      const pixels = await sharp(path.join(root, sheet.image)).extract({ left: index % 8 * 512, top: Math.floor(index / 8) * 512, width: 512, height: 512 }).raw().toBuffer();
      hashes.push(createHash('sha256').update(pixels).digest('hex'));
    }
    assert.equal(new Set(hashes).size, 12, 'The painted poses must not be duplicated static drawings.'); painted += 12;
  }
  for (const [alternate, animations] of [[false, character.animations], [true, character.variants.unarmored?.animations ?? {}]]) {
    for (const [clip, info] of Object.entries(animations)) {
      for (const key of ['atlas', 'data', 'hdAtlas', 'hdData', 'webp', 'gif']) await access(path.join(root, info[key]));
      const data = JSON.parse(await readFile(path.join(root, info.data), 'utf8'));
      const hd = JSON.parse(await readFile(path.join(root, info.hdData), 'utf8'));
      assert.equal(data.frames.length, CLIPS[clip].frames); assert.equal(hd.frames.length, data.frames.length);
      assert.deepEqual(data.meta.animation.events, animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * 30) })));
      const image = await sharp(path.join(root, info.hdAtlas)).metadata();
      assert(image.hasAlpha); assert.equal(image.width, 4096); assert.equal(image.height, Math.ceil(info.frames / 8) * 512);
      for (const item of hd.frames) { assert.equal(item.frame.w, 512); assert.deepEqual(item.pivot, { x: 0.5, y: 0.9 }); }
      const webp = await sharp(path.join(root, info.webp), { animated: true }).metadata();
      assert(webp.hasAlpha); assert.equal(webp.delay.reduce((sum, duration) => sum + duration, 0), CLIPS[clip].duration * 1000);
      if (alternate) { variants++; variantFrames += info.frames; } else { primary++; frames += info.frames; }
    }
  }
}
assert.equal(painted, 108); assert.equal(primary, 13); assert.equal(frames, 390); assert.equal(variants, 5); assert.equal(variantFrames, 156);
const [brute, runner] = ZOMBIES;
assert.equal(brute.armor, 0); assert.equal(brute.health, 800);
assert(Math.abs(moveSpeed(runner) / (32 / (2.4 * 0.6)) - 3.5) < 1e-10);
for (const character of ZOMBIES) {
  const actor = new ZombieAnimator(character, {});
  assert(Math.abs(actor.update(0.2) + moveSpeed(character) * 0.2) < 1e-9);
  actor.setSpeedMultiplier(0); const clock = actor.seconds; assert.equal(actor.update(10), 0); assert.equal(actor.seconds, clock);
  actor.setSpeedMultiplier(0.5); assert(Math.abs(actor.update(0.8) + moveSpeed(character) * 0.4) < 1e-9);
  if (character.armor) {
    const hit = actor.applyDamage(315); assert.equal(hit.armorLost, 300); assert.equal(hit.healthLost, 15); assert.equal(actor.clip, 'armor-break');
    actor.update(0.8); assert.equal(actor.clip, 'run');
  }
  actor.applyDamage(1000); assert.equal(actor.clip, 'fall'); assert.equal(actor.play(character.id === 'bruton' ? 'smash' : 'bite'), false);
  actor.update(2); assert(actor.dead); assert.equal(actor.update(20), 0);
  actor.play('spawn'); assert.equal(actor.health, character.health); assert.equal(actor.armor, character.armor);
}
const impacts = [], striker = new ZombieAnimator(brute, {}, { onEvent: event => impacts.push(event) });
striker.play('smash'); striker.update(0.69); assert.equal(impacts.length, 0);
striker.update(0.02); assert.equal(impacts.length, 1); assert.equal(impacts[0].type, 'smash');
striker.update(3); assert.equal(impacts.length, 1); assert.equal(striker.clip, 'walk');
striker.play('smash'); striker.update(0.5); striker.applyDamage(25); striker.update(2); assert.equal(impacts.length, 1);
const bites = [], biter = new ZombieAnimator(runner, {}, { onEvent: event => bites.push(event) });
biter.play('bite'); biter.update(4.4); assert.equal(bites.length, 6);
let callback;
callback = new ZombieAnimator(brute, {}, { onEvent: event => { if (event.type === 'smash') callback.applyDamage(1000); } });
callback.play('smash'); callback.update(2); assert.equal(callback.clip, 'fall'); assert(callback.dead);

const checked = { characters: 2, primaryClips: primary, primaryFrames: frames, variantClips: variants, variantFrames, paintedPoses: painted,
  uniformPoseScaleAndAspect: 'verified', distinctPaintedPoses: 'verified', standardAndHDAtlases: 'verified',
  combatTimingAndInterruption: 'verified', armorOverflowAndContinuedRun: 'verified', deathAndRespawn: 'verified', slowAndFreeze: 'verified' };
const browser = await chromium.launch({ channel: 'msedge', headless: true }), errors = [], failedRequests = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  const url = 'http://127.0.0.1:8765/zombis-vivos/especiales-v3/index.html';
  await page.goto('http://127.0.0.1:8765/zombis-vivos/especiales-v2/index.html', { waitUntil: 'networkidle' });
  await page.waitForURL(url, { waitUntil: 'networkidle' });
  checked.previousViewerRedirect = 'verified';
  const snapshot = () => page.evaluate(async () => (await import('./viewer.mjs')).zombieSnapshot());
  const hash = async () => createHash('sha256').update(await page.locator('canvas').evaluate(canvas => canvas.toDataURL())).digest('hex');
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Brutón');
  for (const character of ZOMBIES) {
    await page.locator(`[data-character="${character.id}"]`).click();
    await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, character.name);
    for (const clip of character.clips) {
      await page.locator('[data-clip="spawn"]').click(); await page.waitForTimeout(25);
      await page.locator(`[data-clip="${clip}"]`).click();
      const before = await hash(); await page.waitForTimeout(180); assert.notEqual(await hash(), before, `${character.id}/${clip} is static`);
      for (const id of ['download-animation', 'download-sprites', 'download-highres']) {
        const href = await page.locator(`#${id}`).getAttribute('href'); assert.equal((await page.request.get(new URL(href, url).href)).status(), 200);
      }
    }
  }
  await page.locator('[data-clip="spawn"]').click(); await page.locator('[data-clip="run"]').click();
  for (let i = 0; i < 12; i++) await page.locator('#damage').click();
  assert.equal((await snapshot()).armor, 0); assert.equal((await snapshot()).health, 140);
  await page.waitForTimeout(750); assert.equal((await snapshot()).clip, 'run');
  assert((await page.locator('#download-highres').getAttribute('href')).includes('/unarmored/'));
  await page.locator('#pause').click(); const frozen = await snapshot(); await page.waitForTimeout(180); assert.deepEqual(await snapshot(), frozen);
  await page.locator('#step').click(); const stepped = await snapshot(); assert(stepped.paused);
  assert(Math.abs(stepped.seconds - frozen.seconds - 1 / 30) < 1e-8, 'Step must advance exactly one atlas frame.');
  await page.locator('#travel').check(); const position = (await snapshot()).position; await page.locator('#step').click(); assert((await snapshot()).position < position);
  await page.locator('#travel').uncheck(); const flipped = await hash(); await page.locator('#flip').check(); assert.notEqual(await hash(), flipped); await page.locator('#flip').uncheck();
  await page.locator('[data-clip="spawn"]').click(); await page.locator('[data-clip="run"]').click(); await page.locator('#pause').click();
  await page.screenshot({ path: path.join(root, 'preview', 'visor-desktop.png'), fullPage: true });
  checked.responsiveWidths = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    checked.responsiveWidths.push(width);
    if (width === 390) await page.screenshot({ path: path.join(root, 'preview', 'visor-mobile.png'), fullPage: true });
  }
  const context = await browser.newContext({ reducedMotion: 'reduce' }), reduced = await context.newPage();
  await reduced.goto(url, { waitUntil: 'networkidle' }); assert.equal(await reduced.locator('#pause').textContent(), 'Reanudar');
  await context.close(); assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  Object.assign(checked, { browserClips: 'all 13 animate', pauseAndFrameStep: 'verified', armorVariants: 'verified', reducedMotion: 'starts paused', javascriptErrors: errors, failedRequests });
} finally { await browser.close(); }
await writeFile(path.join(root, 'browser-validation.json'), JSON.stringify({ date: '2026-10-02', checked }, null, 2) + '\n');
console.log(JSON.stringify(checked, null, 2));
