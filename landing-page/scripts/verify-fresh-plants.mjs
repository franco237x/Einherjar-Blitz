import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const rigFlag = process.argv.indexOf('--rig-module');
const { CHARACTERS, CLIPS, PlantAnimator, animationEvents, evaluatePose } = await import(
  rigFlag >= 0 ? pathToFileURL(path.resolve(process.argv[rigFlag + 1])).href : '../public/plantas-vivas/runtime/plant-rig.mjs');
import { createAromaStatus, applyAroma, updateAroma, applyAcid, applyPunch } from '../public/plantas-vivas/runtime/fresh-mechanics.mjs';
import { ZOMBIES, ZombieAnimator } from '../public/zombis-vivos/runtime/zombie-rig.mjs';

const rootFlag = process.argv.indexOf('--assets-root'), urlFlag = process.argv.indexOf('--viewer-url');
const root = rootFlag >= 0 ? path.resolve(process.argv[rootFlag + 1]) : fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const viewerURL = urlFlag >= 0 ? process.argv[urlFlag + 1] : 'http://127.0.0.1:8765/plantas-vivas/index.html';
const catalog = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag >= 0 ? process.argv[flag + 1] : 'playwright');
const cast = CHARACTERS.filter(character => ['cilantro', 'limon', 'jengibron'].includes(character.id));
const find = id => cast.find(character => character.id === id);
const target = (id = 'conero') => Object.assign(new ZombieAnimator(ZOMBIES.find(character => character.id === id), {}), { x: 282, lane: 0 });
const acid = animationEvents(find('limon'), 'attack')[0];
let enemy = target();
assert.deepEqual(applyAcid(acid, enemy), { hit: true, armorLost: 60, healthLost: 0, killed: false });
assert.equal(enemy.armor, 40); assert.equal(enemy.health, 100);
assert.deepEqual(applyAcid(acid, enemy), { hit: true, armorLost: 40, healthLost: 16, killed: false });
assert.equal(enemy.clip, 'armor-break');
enemy = target('despistado'); applyAcid(acid, enemy); assert.equal(enemy.health, 84);
enemy = target(); enemy.armor = 10; applyAcid(acid, enemy); assert.equal(enemy.health, 84, 'Unused corrosion must not overflow to health.');
enemy.health = 8; applyAcid(acid, enemy); assert.equal(enemy.clip, 'fall', 'Armor animation must never override death.');
assert.equal(applyAcid(acid, enemy).hit, false);

const aroma = animationEvents(find('cilantro'), 'attack')[0], status = createAromaStatus();
enemy = target(); enemy.play('bite'); enemy.seconds = 0.5; enemy.speedMultiplier = 0.7;
assert.equal(applyAroma(status, aroma, enemy), true);
assert.equal(enemy.clip, 'hit'); assert.equal(enemy.seconds, 0);
assert.equal(enemy.health, 100); assert.equal(enemy.armor, 100); assert.equal(enemy.speedMultiplier, 0.7);
assert.equal(updateAroma(status, 1), false); assert.equal(updateAroma(status, 0.11), true);
assert.equal(updateAroma(status, -1), true);
enemy.play('fall'); assert.equal(applyAroma(status, aroma, enemy), false);

const combo = animationEvents(find('jengibron'), 'attack');
assert.deepEqual(combo.map(event => event.time), [0.4, 0.8]);
assert.deepEqual(combo.map(event => event.damage), [22, 34]);
enemy = target('despistado');
assert.equal(applyPunch(combo[0], enemy).hit, true); assert.equal(enemy.health, 78);
enemy.x = 420; assert.equal(applyPunch(combo[1], enemy).hit, false); assert.equal(enemy.health, 78);
enemy.x = 130; assert.equal(applyPunch(combo[1], enemy).hit, false);
enemy.x = 282; enemy.lane = 1; assert.equal(applyPunch(combo[1], enemy).hit, false);
enemy.lane = 0; assert.equal(applyPunch(combo[1], enemy).hit, true); assert.equal(enemy.health, 44);
enemy.x = 10; assert.equal(applyPunch(combo[0], enemy, { x: 150, lane: 0, direction: -1 }).hit, true);

let exportedFrames = 0;
for (const character of cast) {
  const cues = [], animator = new PlantAnimator(character, {}, { onEvent: event => cues.push(event) });
  animator.play('attack');
  for (let index = 0; index < 100; index++) animator.update([0.016, 0.09, 0.031, 0.066][index % 4]);
  assert.deepEqual(cues, animationEvents(character, 'attack'), 'Irregular frame steps must emit each cue once.');
  assert.equal(animator.clip, 'idle');
  const interrupted = [], cut = new PlantAnimator(character, {}, { onEvent: event => interrupted.push(event) });
  cut.play('attack'); for (let index = 0; index < 6; index++) cut.update(0.1);
  cut.play('hit'); for (let index = 0; index < 20; index++) cut.update(0.1);
  assert.equal(interrupted.length, 1, 'Changing state must discard remaining attack cues.');
  const first = evaluatePose(character, 'idle', 0), last = evaluatePose(character, 'idle', 2.4);
  for (const key of ['sway', 'follow', 'breathe']) assert(Math.abs(first[key] - last[key]) < 1e-10);
  for (const [clip, info] of Object.entries(CLIPS).filter(([clip]) => ['idle', 'attack', 'hit', 'spawn', 'celebrate'].includes(clip))) {
    const atlasPath = path.join(root, 'characters', character.id, 'sprites', `${clip}.png`);
    const data = JSON.parse(await readFile(atlasPath.replace('.png', '.json'), 'utf8'));
    const meta = await sharp(atlasPath).metadata();
    assert.equal(meta.width, 2048); assert.equal(meta.height, Math.ceil(info.frames / 8) * 256); assert(meta.hasAlpha);
    assert.equal(data.frames.length, info.frames);
    assert.deepEqual(data.meta.animation.events.map(event => event.time), animationEvents(character, clip).map(event => event.time));
    const movie = await sharp(path.join(root, 'characters', character.id, 'animated', `${clip}.webp`), { animated: true }).metadata();
    assert.equal(movie.delay.reduce((sum, value) => sum + value, 0), info.duration * 1000);
    for (const frame of data.frames) {
      const { data: rgba } = await sharp(atlasPath).extract({ left: frame.frame.x, top: frame.frame.y, width: 256, height: 256 }).raw().toBuffer({ resolveWithObject: true });
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) if (rgba[(y * 256 + x) * 4 + 3] > 20) assert(x >= 2 && x <= 253 && y >= 2 && y <= 253, `${character.id}/${clip}: cropped sprite.`);
    }
    exportedFrames += info.frames;
  }
}
assert.equal(exportedFrames, 648);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(viewerURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, find('cilantro').name);
  assert.equal(await page.locator('[data-plant]').count(), catalog.characters.length);
  assert.equal(await page.locator('[data-plant="aurelia"], [data-plant="velaria"]').count(), 0);
  const snapshot = () => page.evaluate(async () => (await import(new URL('viewer.mjs', location.href))).freshPracticeSnapshot());
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-hits').textContent === '1');
  const interrupted = await snapshot(); assert(interrupted.blocked > 0); assert.equal(interrupted.health, 100);
  await page.locator('#pause').click(); const stopped = await snapshot(); await page.waitForTimeout(180); assert.deepEqual(await snapshot(), stopped);
  await page.locator('#pause').click();
  await page.waitForFunction(() => document.querySelector('#fresh-blocked').textContent === '—');
  await page.locator('[data-plant="limon"]').click();
  await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, find('limon').name);
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-hits').textContent === '1');
  assert.equal((await snapshot()).armor, 40); assert.equal((await snapshot()).health, 100);
  await page.waitForFunction(() => document.querySelector('#now-playing').textContent === 'Reposo');
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-hits').textContent === '2');
  assert.equal((await snapshot()).armor, 0); assert.equal((await snapshot()).health, 84);
  await page.locator('#fresh-target').selectOption('despistado');
  await page.waitForFunction(() => document.querySelector('#fresh-armor').textContent === '0' && document.querySelector('#fresh-hits').textContent === '0');
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-health').textContent === '84');
  await page.locator('[data-plant="jengibron"]').click();
  await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, find('jengibron').name);
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-hits').textContent === '2');
  assert.equal((await snapshot()).health, 44);
  await page.locator('#reset-fresh').click(); await page.locator('#fresh-far').check();
  await page.locator('[data-clip="attack"]').click(); await page.waitForTimeout(1300);
  assert.equal((await snapshot()).health, 100); assert.equal((await snapshot()).hits, 0); assert.equal((await snapshot()).misses, 2);
  await page.locator('#fresh-far').uncheck(); await page.locator('#reset-fresh').click();
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#fresh-hits').textContent === '1');
  await page.locator('[data-clip="hit"]').click(); await page.waitForTimeout(1000); assert.equal((await snapshot()).hits, 1);
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.locator('#fresh-target').selectOption('conero');
  await page.waitForFunction(() => document.querySelector('#fresh-armor').textContent === '100');
  if (rigFlag >= 0) {
    for (const character of cast) {
      await page.locator(`[data-plant="${character.id}"]`).click();
      await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, character.name);
      for (const clip of ['idle', 'attack', 'hit', 'spawn', 'celebrate']) {
        await page.locator(`[data-clip="${clip}"]`).click();
        assert((await page.locator('#download-sprites').getAttribute('href')).endsWith(`/sprites/${clip}.png`));
        await page.waitForTimeout(70);
      }
    }
    await page.locator('[data-clip="idle"]').click();
    await page.locator('#flip').check(); await page.locator('#flip').uncheck();
    const reducedPage = await browser.newPage({ reducedMotion: 'reduce' });
    await reducedPage.goto(viewerURL, { waitUntil: 'networkidle' });
    assert.equal(await reducedPage.locator('#pause').getAttribute('aria-pressed'), 'true');
    await reducedPage.close();
  }
  await page.screenshot({ path: path.join(root, 'preview', rigFlag >= 0 ? 'combate-v7.png' : 'combate-v6.png'), fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  const report = { date: '2026-10-02', plants: 3, clips: 15, frames: exportedFrames,
    atlas: '256×256, 8 columns, 30 fps, real alpha, no cropping',
    mechanics: { cilantro: 'interrupts biting for 1.1 s without changing movement, armor or health',
      limon: '16 normal damage + 44 armor-only corrosion; no bonus overflow; armor-break and death verified',
      jengibron: '22 + 34 damage at 0.4 / 0.8 s; same lane, forward distance, per-hit range and interruption verified' },
    runtime: 'each cue exactly once under irregular steps; interrupted attacks cancel future cues',
    browser: 'actual zombie rigs; acid versus armored and bare targets; pause, reset, far target, interrupted combo and portrait catalog verified',
    responsiveWidths: [1280, 768, 390, 320], javascriptErrors: errors, assetFailures: failures };
  await writeFile(path.join(root, 'fresh-validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
