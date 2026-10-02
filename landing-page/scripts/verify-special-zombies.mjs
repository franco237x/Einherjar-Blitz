import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ZOMBIES, CLIPS, ZombieAnimator, evaluatePose, moveSpeed, animationEvents } from '../public/zombis-vivos/especiales-v2/runtime/zombie-rig.mjs';
import { ZOMBIES as BASIC, moveSpeed as basicSpeed } from '../public/zombis-vivos/runtime/zombie-rig.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag >= 0 ? process.argv[flag + 1] : 'playwright');
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v2/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.characters.length, 2);
let clips = 0, frames = 0, variants = 0, variantFrames = 0;
for (const character of manifest.characters) {
  for (const [alternate, animations] of [[false, character.animations], [true, character.variants.unarmored?.animations ?? {}]]) {
    for (const [clip, data] of Object.entries(animations)) {
      for (const key of ['atlas', 'data', 'webp', 'gif']) await access(path.join(root, data[key]));
      const atlas = JSON.parse(await readFile(path.join(root, data.data), 'utf8'));
      const png = await sharp(path.join(root, data.atlas)).metadata();
      assert(png.hasAlpha); assert.equal(png.width, 256 * 8);
      assert.equal(png.height, Math.ceil(data.frames / 8) * 256);
      assert.deepEqual(data.frameSize, [256, 256]); assert.equal(data.fps, 30);
      assert.equal(atlas.frames.length, CLIPS[clip].frames);
      assert.equal(atlas.frames.reduce((sum, item) => sum + item.duration, 0), CLIPS[clip].duration * 1000);
      assert.deepEqual(atlas.meta.animation.events, animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * 30) })));
      if (alternate) assert.equal(atlas.meta.animation.armorVisible, false);
      for (const item of atlas.frames) {
        assert.deepEqual(item.pivot, { x: 0.5, y: 0.9 });
        assert.equal(item.frame.w, 256); assert.equal(item.frame.h, 256);
      }
      const webp = await sharp(path.join(root, data.webp), { animated: true }).metadata();
      assert(webp.hasAlpha); assert.equal(webp.delay.reduce((a, b) => a + b, 0), CLIPS[clip].duration * 1000);
      if (alternate) { variants++; variantFrames += data.frames; } else { clips++; frames += data.frames; }
    }
  }
}
assert.equal(clips, 13); assert.equal(frames, 528);
assert.equal(variants, 5); assert.equal(variantFrames, 192);
const [brute, runner] = ZOMBIES;
assert.equal(brute.armor, 0); assert.equal(brute.health, 800);
assert(Math.abs(moveSpeed(runner) / basicSpeed(BASIC[0]) - 3.5) < 1e-10);
assert(Math.abs(moveSpeed(brute) / basicSpeed(BASIC[0]) - 0.5) < 1e-10);
for (const character of ZOMBIES) {
  for (const clip of character.clips.filter(clip => CLIPS[clip].loop)) {
    const first = evaluatePose(character, clip, 0), last = evaluatePose(character, clip, CLIPS[clip].duration);
    for (const key of Object.keys(first).filter(key => key !== 'progress')) {
      if (typeof first[key] === 'number') assert(Math.abs(first[key] - last[key]) < 1e-9, `${character.id}/${clip}/${key}: loop seam`);
      else assert.equal(first[key], last[key]);
    }
  }
  const moving = new ZombieAnimator(character, {});
  const before = evaluatePose(character, character.locomotion, 0).footFrontX;
  const travel = moving.update(0.2), after = evaluatePose(character, character.locomotion, moving.seconds).footFrontX;
  assert(Math.abs(after + travel - before) < 1e-8, 'Support foot slides in world space.');
  moving.setSpeedMultiplier(0); const clock = moving.seconds;
  assert.equal(moving.update(10), 0); assert.equal(moving.seconds, clock);
  moving.setSpeedMultiplier(0.5); assert(Math.abs(moving.update(0.7) + moveSpeed(character) * 0.35) < 1e-8);
  for (const clip of ['hit', 'spawn', ...(character.armor ? ['armor-break'] : [])]) {
    const actor = new ZombieAnimator(character, {}); actor.play(clip); actor.update(CLIPS[clip].duration + 0.2);
    assert.equal(actor.clip, character.locomotion); assert(actor.seconds > 0);
  }
  const target = new ZombieAnimator(character, {}), current = target.clip;
  target.applyDamage(0); target.applyDamage(-1); target.applyDamage(NaN); assert.equal(target.clip, current);
  if (character.armor) {
    assert.equal(target.applyDamage(25).healthLost, 0);
    assert.equal(target.applyDamage(character.armor - 25 + 15).healthLost, 15);
    assert.equal(target.health, 125); assert.equal(target.armor, 0); assert.equal(target.clip, 'armor-break');
    target.update(1); assert.equal(target.clip, 'run');
  } else {
    assert.equal(target.applyDamage(25).healthLost, 25);
    assert.equal(target.play('armor-break'), false);
  }
  target.applyDamage(1000); assert.equal(target.clip, 'fall');
  assert.equal(target.play(character.id === 'bruton' ? 'smash' : 'bite'), false);
  target.update(2); assert(target.dead); assert.equal(target.update(5), 0);
  assert.equal(target.applyDamage(25).damage, 0);
  assert(target.play('spawn')); assert.equal(target.health, character.health); assert.equal(target.armor, character.armor);
  assert.equal(target.dead, false); assert.equal(target.dying, false);
}
const hits = [], striker = new ZombieAnimator(brute, {}, { onEvent: event => hits.push(event) });
striker.play('smash'); striker.update(0.85); assert.equal(hits.length, 0);
striker.update(0.02); assert.equal(hits.length, 1); assert.equal(hits[0].damage, 80);
striker.update(4); assert.equal(hits.length, 1); assert.equal(striker.clip, 'walk');
striker.play('smash'); striker.update(0.5); striker.applyDamage(25); striker.update(2); assert.equal(hits.length, 1);
const bites = [], biter = new ZombieAnimator(runner, {}, { onEvent: event => bites.push(event) });
biter.play('bite'); biter.update(8.02); assert.equal(bites.length, 7); assert(Math.abs(biter.seconds - 0.82) < 1e-8);
const dropped = [], armored = new ZombieAnimator(runner, {}, { onEvent: event => dropped.push(event) });
armored.applyDamage(300); armored.update(1);
assert.deepEqual(dropped[0].pieces, ['gear', 'pads']); assert.equal(armored.clip, 'run');
let callbackActor;
callbackActor = new ZombieAnimator(brute, {}, { onEvent: event => { if (event.type === 'smash') callbackActor.applyDamage(1000); } });
callbackActor.play('smash'); callbackActor.update(3); assert(callbackActor.dead); assert.equal(callbackActor.clip, 'fall');

const checked = { characters: 2, clips, atlasFrames: frames, variantClips: variants, variantFrames,
  loopSeams: 'verified', worldFootContact: 'verified', slowAndFreeze: 'verified', runnerSpeedVsBasic: 3.5,
  smashContactAndInterruption: 'verified', biteCycles: 'verified', armorOverflowAndTwoPieceDrop: 'verified', deathAndRespawn: 'verified' };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failedRequests = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  const url = 'http://127.0.0.1:8765/zombis-vivos/especiales-v2/legacy.html';
  await page.goto(url, { waitUntil: 'networkidle' });
  const snapshot = () => page.evaluate(async () => (await import('./viewer.mjs')).zombieSnapshot());
  const hash = async () => createHash('sha256').update(await page.locator('canvas').evaluate(element => element.toDataURL())).digest('hex');
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Brutón');
  assert.equal(await page.locator('#roster button').count(), 2);
  assert(await page.locator('#armor-stat').isHidden());
  assert(await page.locator('#roster img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  for (const character of ZOMBIES) {
    await page.locator(`[data-character="${character.id}"]`).click();
    await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, character.name);
    for (const clip of character.clips) {
      await page.locator('[data-clip="spawn"]').click(); await page.waitForTimeout(40);
      await page.locator(`[data-clip="${clip}"]`).click();
      assert.equal(await page.locator('#now-playing').textContent(), CLIPS[clip].label);
      const before = await hash(); await page.waitForTimeout(220); assert.notEqual(await hash(), before, `${character.id}/${clip} is static`);
      for (const id of ['download-animation', 'download-sprites']) {
        const href = await page.locator(`#${id}`).getAttribute('href');
        assert.equal((await page.request.get(new URL(href, url).href)).status(), 200);
      }
    }
  }
  // Reset selection to a fresh armored runner before testing the interactive damage controls.
  await page.locator('[data-character="bruton"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Brutón');
  await page.locator('[data-clip="smash"]').click();
  await page.waitForFunction(() => Number(document.querySelector('#bite-count').value) === 1);
  await page.waitForTimeout(900); assert.equal((await snapshot()).hits, 1);
  await page.locator('[data-character="rafago"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Ráfago');
  assert.equal((await snapshot()).clip, 'run'); assert(await page.locator('#armor-stat').isVisible());
  for (let i = 0; i < 12; i++) await page.locator('#damage').click();
  assert.equal((await snapshot()).armor, 0); assert.equal((await snapshot()).health, 140);
  await page.waitForTimeout(950); assert.equal((await snapshot()).clip, 'run');
  assert((await page.locator('#download-sprites').getAttribute('href')).includes('/unarmored/'));
  for (let i = 0; i < 6; i++) await page.locator('#damage').click();
  assert(await page.locator('[data-clip="bite"]').isDisabled()); assert(await page.locator('#damage').isDisabled());
  await page.waitForFunction(() => document.querySelector('#now-playing').textContent === 'En el suelo');
  await page.locator('[data-clip="spawn"]').click(); assert.equal((await snapshot()).armor, 300); assert.equal((await snapshot()).health, 140);
  await page.locator('[data-clip="bite"]').click();
  await page.waitForFunction(() => Number(document.querySelector('#bite-count').value) >= 2);
  await page.locator('#pause').click(); const frozen = await snapshot(), frozenImage = await hash();
  await page.waitForTimeout(240); assert.deepEqual(await snapshot(), frozen); assert.equal(await hash(), frozenImage);
  await page.locator('#flip').check(); assert.notEqual(await hash(), frozenImage);
  await page.locator('#flip').uncheck();
  await page.locator('[data-background="alpha"]').click(); assert((await page.locator('#stage').getAttribute('class')).includes('alpha'));
  await page.locator('[data-background="garden"]').click();
  await page.locator('[data-clip="run"]').click(); await page.locator('#travel').check();
  const moving = await snapshot(); await page.waitForTimeout(350); assert((await snapshot()).position < moving.position);
  await page.locator('#flip').check(); const flipped = await snapshot(); await page.waitForTimeout(350); assert((await snapshot()).position > flipped.position);
  await page.locator('#travel').uncheck(); await page.locator('#flip').uncheck();
  await page.locator('#pause').click();
  await page.screenshot({ path: path.join(root, 'preview', 'visor-desktop.png'), fullPage: true });
  checked.responsiveWidths = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    checked.responsiveWidths.push(width);
    if (width === 390) await page.screenshot({ path: path.join(root, 'preview', 'visor-mobile.png'), fullPage: true });
  }
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' }), reducedPage = await reducedContext.newPage();
  await reducedPage.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await reducedPage.locator('#pause').textContent(), 'Reanudar');
  await reducedContext.close();
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  Object.assign(checked, { browserCanvas: '13 clips animate', interactiveArmorAndCombat: 'verified', pauseFlipAndTravel: 'verified',
    reducedMotion: 'starts paused', javascriptErrors: errors, failedRequests });
} finally { await browser.close(); }
await writeFile(path.join(root, 'browser-validation.json'), JSON.stringify({ date: '2026-10-02', checked }, null, 2) + '\n');
console.log(JSON.stringify(checked, null, 2));
