import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ZOMBIES, CLIPS, ZombieAnimator, evaluatePose, moveSpeed, animationEvents } from '../public/zombis-vivos/runtime/zombie-rig.mjs';

const require = createRequire(import.meta.url), sharp = require('sharp');
const flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag >= 0 ? process.argv[flag + 1] : 'playwright');
const root = fileURLToPath(new URL('../public/zombis-vivos/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.characters.length, 3);
let clips = 0, frames = 0, encodedFrames = 0;
for (const character of manifest.characters) {
  for (const [clip, data] of Object.entries(character.animations)) {
    for (const key of ['atlas', 'data', 'webp', 'gif']) await access(path.join(root, data[key]));
    const atlas = JSON.parse(await readFile(path.join(root, data.data), 'utf8'));
    const png = await sharp(path.join(root, data.atlas)).metadata();
    assert(png.hasAlpha); assert.equal(png.width, atlas.meta.size.w); assert.equal(png.height, atlas.meta.size.h);
    assert.equal(atlas.frames.length, CLIPS[clip].frames);
    assert.equal(atlas.frames.reduce((sum, item) => sum + item.duration, 0), CLIPS[clip].duration * 1000);
    assert.deepEqual(atlas.meta.animation.events, animationEvents(character, clip).map(event => ({ ...event, frame: Math.ceil(event.time * 30) })));
    for (const item of atlas.frames) {
      assert(item.frame.x + item.frame.w <= png.width && item.frame.y + item.frame.h <= png.height);
      assert.deepEqual(item.pivot, { x: 0.5, y: 0.9 });
    }
    const webp = await sharp(path.join(root, data.webp), { animated: true }).metadata();
    assert(webp.hasAlpha); assert.equal(webp.delay.reduce((a, b) => a + b, 0), CLIPS[clip].duration * 1000);
    encodedFrames += webp.pages; clips++; frames += atlas.frames.length;
  }
}
assert.equal(clips, 20); assert.equal(frames, 858);
let variantClips = 0, variantFrames = 0;
for (const character of manifest.characters.filter(character => character.armor)) {
  for (const [clip, data] of Object.entries(character.variants.unarmored.animations)) {
    for (const key of ['atlas', 'data', 'webp', 'gif']) await access(path.join(root, data[key]));
    const atlas = JSON.parse(await readFile(path.join(root, data.data), 'utf8'));
    assert.equal(atlas.meta.animation.armorVisible, false); assert.equal(atlas.frames.length, CLIPS[clip].frames);
    const naked = await sharp(path.join(root, data.webp), { animated: true }).metadata();
    assert(naked.hasAlpha); assert.equal(naked.delay.reduce((a, b) => a + b, 0), CLIPS[clip].duration * 1000);
    if (clip === 'idle') {
      const top = async filename => {
        const pixels = await sharp(path.join(root, filename)).extract({ left: 0, top: 0, width: 256, height: 256 }).raw().toBuffer();
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) if (pixels[(y * 256 + x) * 4 + 3] > 64) return y;
        throw Error('Missing character');
      };
      assert(await top(data.atlas) > await top(character.animations.idle.atlas) + 10, 'The separate helmet must be absent from the naked variant.');
    }
    variantClips++; variantFrames += atlas.frames.length;
  }
}
assert.equal(variantClips, 10); assert.equal(variantFrames, 480);

for (const character of ZOMBIES) {
  for (const clip of character.clips.filter(clip => CLIPS[clip].loop)) {
    const first = evaluatePose(character, clip, 0), last = evaluatePose(character, clip, CLIPS[clip].duration);
    for (const key of Object.keys(first).filter(key => key !== 'progress')) {
      if (typeof first[key] === 'number') assert(Math.abs(first[key] - last[key]) < 1e-10, `${character.id}/${clip}/${key}: loop seam`);
      else assert.equal(first[key], last[key]);
    }
  }
  const walker = new ZombieAnimator(character, {});
  const footBefore = evaluatePose(character, 'walk', 0).footFrontX;
  const travel = walker.update(0.2), footAfter = evaluatePose(character, 'walk', walker.seconds).footFrontX;
  assert(Math.abs(footAfter + travel - footBefore) < 1e-8, 'Stance foot must stay planted in world space.');
  walker.setSpeedMultiplier(0);
  const frozenClock = walker.seconds; assert.equal(walker.update(10), 0); assert.equal(walker.seconds, frozenClock);
  walker.setSpeedMultiplier(0.5);
  assert(Math.abs(walker.update(0.7) + moveSpeed(character) * 0.35) < 1e-8);
  const events = [], biter = new ZombieAnimator(character, {}, { onEvent: event => events.push(event) });
  biter.play('bite'); biter.update(8.02);
  assert.equal(events.filter(event => event.type === 'bite').length, 7, 'Coarse updates must deliver exactly one bite per cycle.');
  assert(Math.abs(biter.seconds - 0.82) < 1e-8);
  for (const clip of ['hit', 'spawn', ...(character.armor ? ['armor-break'] : [])]) {
    const actor = new ZombieAnimator(character, {}); actor.play(clip); actor.update(CLIPS[clip].duration + 0.2);
    assert.equal(actor.clip, 'walk'); assert(actor.seconds > 0, 'Overshoot must be consumed by the next animation.');
  }
  const target = new ZombieAnimator(character, {});
  const current = target.clip; target.applyDamage(0); target.applyDamage(-30); target.applyDamage(NaN);
  assert.equal(target.clip, current, 'Zero damage must leave the state untouched.');
  if (character.armor) {
    const first = target.applyDamage(25); assert.equal(first.healthLost, 0); assert.equal(first.armorLost, 25);
    const second = target.applyDamage(character.armor - 25 + 15);
    assert.equal(second.healthLost, 15); assert.equal(target.health, 85); assert.equal(target.armor, 0); assert.equal(target.clip, 'armor-break');
    target.update(1); assert.equal(target.clip, 'walk');
  } else assert.equal(target.play('armor-break'), false);
  target.applyDamage(1000); assert.equal(target.clip, 'fall'); assert.equal(target.dying, true);
  assert.equal(target.play('bite'), false, 'A falling zombie must not resume attacking.');
  target.update(2); assert.equal(target.dead, true); assert.equal(target.update(5), 0);
  assert.equal(target.applyDamage(25).damage, 0);
  assert.equal(target.play('spawn'), true); assert.equal(target.health, character.health); assert.equal(target.armor, character.armor);
  assert.equal(target.dead, false); assert.equal(target.dying, false);
}
// Damage applied by a combat callback must not be overwritten by the previous bite clock.
let callbackActor;
callbackActor = new ZombieAnimator(ZOMBIES[0], {}, { onEvent: event => { if (event.type === 'bite') callbackActor.applyDamage(1000); } });
callbackActor.play('bite'); callbackActor.update(2.1);
assert.equal(callbackActor.clip, 'fall'); assert.equal(callbackActor.dead, true);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failedRequests = [];
const checked = { characters: 3, clips, atlasFrames: frames, variantClips, variantFrames, unarmoredExports: 'verified', webpEncodedFrames: encodedFrames, loopSeams: 'verified',
  worldFootContact: 'verified', slowAndFreeze: 'verified', biteTimingAndOvershoot: 'verified',
  armorAndOverflow: 'verified', deathAndRespawn: 'verified', callbackTransitions: 'verified' };
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:8765/zombis-vivos/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Despistado');
  assert(await page.locator('#roster img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  const hash = async () => createHash('sha256').update(await page.locator('canvas').evaluate(element => element.toDataURL())).digest('hex');
  for (const character of ZOMBIES) {
    await page.locator(`[data-character="${character.id}"]`).click();
    await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, character.name);
    for (const clip of character.clips) {
      // Fall appears before armor-break in the roster; respawn restores the actor before each next clip.
      await page.locator('[data-clip="spawn"]').click(); await page.waitForTimeout(40);
      await page.locator(`[data-clip="${clip}"]`).click();
      assert.equal(await page.locator('#now-playing').textContent(), CLIPS[clip].label);
      const before = await hash(); await page.waitForTimeout(220); assert.notEqual(await hash(), before, `${character.id}/${clip} must visibly animate`);
      assert((await page.locator('#download-animation').getAttribute('href')).endsWith(`${clip}.webp`));
    }
  }
  await page.locator('[data-character="conero"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Conero');
  for (let i = 0; i < 4; i++) await page.locator('#damage').click();
  assert.equal(await page.locator('#armor-value').textContent(), '0 / 100');
  assert.equal(await page.locator('#health-value').textContent(), '100 / 100');
  await page.waitForTimeout(950);
  await page.locator('#damage').click(); assert.equal(await page.locator('#health-value').textContent(), '75 / 100');
  for (let i = 0; i < 3; i++) await page.locator('#damage').click();
  assert(await page.locator('[data-clip="bite"]').isDisabled()); assert(await page.locator('#damage').isDisabled());
  await page.waitForFunction(() => document.querySelector('#now-playing').textContent === 'En el suelo');
  await page.locator('[data-clip="spawn"]').click();
  assert.equal(await page.locator('#armor-value').textContent(), '100 / 100'); assert.equal(await page.locator('#health-value').textContent(), '100 / 100');
  await page.locator('[data-clip="bite"]').click(); await page.waitForFunction(() => Number(document.querySelector('#bite-count').value) >= 2);
  await page.locator('#pause').click();
  const pausedHash = await hash(), pausedBites = await page.locator('#bite-count').textContent();
  await page.waitForTimeout(220); assert.equal(await hash(), pausedHash); assert.equal(await page.locator('#bite-count').textContent(), pausedBites);
  await page.locator('#flip').check(); assert.notEqual(await hash(), pausedHash);
  await page.locator('[data-background="alpha"]').click(); assert((await page.locator('#stage').getAttribute('class')).includes('alpha'));
  await page.locator('[data-background="dark"]').click(); assert((await page.locator('#stage').getAttribute('class')).includes('dark'));
  await page.locator('[data-background="garden"]').click(); await page.locator('#flip').uncheck();
  await page.locator('#speed').fill('1.5'); assert.equal(await page.locator('#speed-value').textContent(), '1.5×');
  await page.locator('#pause').click(); await page.locator('[data-clip="walk"]').click(); await page.locator('#travel').check();
  const advancing = await hash(); await page.waitForTimeout(250); assert.notEqual(await hash(), advancing);
  await page.locator('#travel').uncheck();
  await page.locator('[data-character="balderon"]').click(); await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Balderón');
  await page.locator('[data-clip="idle"]').click();
  await page.locator('[data-clip="idle"]').hover();
  const activeColors = await page.locator('[data-clip="idle"]').evaluate(element => ({ text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
  assert.equal(activeColors.background, 'rgb(48, 68, 66)'); assert.equal(activeColors.text, 'rgb(255, 249, 239)');
  await mkdir(path.join(root, 'preview'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'preview', 'visor-desktop.png'), fullPage: true });
  checked.responsiveWidths = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    checked.responsiveWidths.push(width);
    if (width === 390) await page.screenshot({ path: path.join(root, 'preview', 'visor-mobile.png'), fullPage: true });
  }
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' }), reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://127.0.0.1:8765/zombis-vivos/index.html', { waitUntil: 'networkidle' });
  assert.equal(await reducedPage.locator('#pause').textContent(), 'Reanudar');
  await reducedContext.close();
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  Object.assign(checked, { browserCanvas: 'all 20 clips animate', armorDemo: 'verified', pauseFlipBackgroundTravel: 'verified', reducedMotion: 'starts paused', javascriptErrors: errors, failedRequests });
} finally { await browser.close(); }
await writeFile(path.join(root, 'browser-validation.json'), JSON.stringify({ date: '2026-10-01', checked }, null, 2) + '\n');
console.log(JSON.stringify(checked, null, 2));
