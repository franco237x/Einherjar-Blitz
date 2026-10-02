import assert from 'node:assert/strict';
import { readFile, access, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { CHARACTERS, ACTIVE_CHARACTERS, CLIPS, clipsFor, evaluatePose, clipLabel, actionEvent, animationEvents, afterClip, PlantAnimator,
  createColdStatus, applyChill, updateColdStatus } from '../public/plantas-vivas/runtime/plant-rig.mjs';
import { verifyShadowMechanic } from './verify-shadow-mechanic.mjs';

const require = createRequire(import.meta.url), flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag >= 0 ? process.argv[flag + 1] : 'playwright');
const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.characters.length, ACTIVE_CHARACTERS.length);
assert.equal(manifest.archivedCharacters.length, 2);
let clipsChecked = 0;
for (const character of [...manifest.characters, ...manifest.archivedCharacters]) {
  if (character.defenseOnly) {
    assert.equal(character.animations.attack, undefined, 'Pure defense must have no offensive atlas.');
    assert.equal(character.effects.projectile, undefined, 'Pure defense must have no projectile asset.');
    assert.equal(character.combat.attackDamage, 0);
    assert.equal(character.combat.reflectDamage, 0);
    const defender = new PlantAnimator(character, {});
    assert.equal(defender.play('attack'), false);
    assert.equal(defender.clip, 'idle');
  }
  for (const [clip, data] of Object.entries(character.animations)) {
  for (const key of ['atlas', 'data', 'webp', 'gif']) await access(path.join(root, data[key]));
  const atlas = JSON.parse(await readFile(path.join(root, data.data), 'utf8'));
  assert.equal(atlas.frames.length, CLIPS[clip].frames);
  assert.equal(atlas.frames.reduce((sum, frame) => sum + frame.duration, 0), CLIPS[clip].duration * 1000);
  const expectedEvents = animationEvents(character, clip);
  assert.equal(atlas.meta.animation.events.length, expectedEvents.length);
  assert.equal(atlas.meta.animation.after, afterClip(character, clip));
  for (const [index, event] of expectedEvents.entries()) {
    assert.equal(atlas.meta.animation.events[index].type, event.type);
    assert.equal(atlas.meta.animation.events[index].time, event.time);
    assert.equal(atlas.meta.animation.events[index].frame, Math.ceil(event.time * CLIPS[clip].fps));
  }
  if (clip === (character.primaryClip ?? 'attack')) {
    if (character.attackStyle === 'sun') assert.equal(atlas.meta.animation.events[0].value, 25);
    if (character.consumedOnAction) {
      assert.equal(atlas.meta.animation.events[0].consumePlant, true);
      assert.equal(atlas.meta.animation.after, 'consumed');
    }
  }
  for (const frame of atlas.frames) {
    assert(frame.frame.x + frame.frame.w <= atlas.meta.size.w);
    assert(frame.frame.y + frame.frame.h <= atlas.meta.size.h);
  }
  clipsChecked++;
}
}
const frost = CHARACTERS.find(character => character.id === 'frigora');
const coldEvent = actionEvent(frost), cold = createColdStatus();
applyChill(cold, coldEvent);
assert.equal(updateColdStatus(cold, 1.2), 0.5, 'One hit must slow the target.');
applyChill(cold, coldEvent); updateColdStatus(cold, 1.2);
assert.equal(cold.stacks, 2);
assert.equal(applyChill(cold, coldEvent), true, 'Three consecutive hits must freeze.');
assert.equal(updateColdStatus(cold, 0.6), 0);
assert.equal(updateColdStatus(cold, 0.61), 0.5, 'The target thaws but remains slowed.');
assert.equal(updateColdStatus(cold, 2), 1, 'The debuff must expire.');
applyChill(cold, coldEvent); updateColdStatus(cold, 3.1);
assert.equal(cold.stacks, 0, 'Expired frost must not count toward a later freeze.');
assert.equal(applyChill(cold, coldEvent), false);
assert.equal(cold.stacks, 1);
const shadowChecks = verifyShadowMechanic();
for (const character of CHARACTERS) {
  for (const [clip, info] of Object.entries(clipsFor(character)).filter(([, info]) => info.loop)) {
  const start = evaluatePose(character, clip, 0), end = evaluatePose(character, clip, info.duration);
  for (const key of Object.keys(start).filter(key => !['progress', 'elapsed'].includes(key))) {
    if (typeof start[key] === 'number') assert(Math.abs(start[key] - end[key]) < 1e-10, `${character.id}/${clip}: loop must be seamless.`);
    else assert.equal(start[key], end[key]);
  }
  }
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], failedRequests = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:8765/plantas-vivas/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Cilantro');
  const imageLoaded = await page.locator('#roster img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0));
  assert(imageLoaded, 'All character portraits must load.');
  const hash = async () => createHash('sha256').update(await page.locator('canvas').evaluate(element => element.toDataURL())).digest('hex');
  for (const character of ACTIVE_CHARACTERS) {
    await page.locator(`[data-plant="${character.id}"]`).click();
    await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, character.name);
    for (const [clip, data] of Object.entries(clipsFor(character))) {
      await page.locator(`[data-clip="${clip}"]`).click();
      assert.equal(await page.locator('#now-playing').textContent(), clipLabel(character, clip));
      const before = await hash(); await page.waitForTimeout(180); const after = await hash();
      assert.notEqual(before, after, `${character.id}/${clip}: canvas must animate.`);
    }
  }
  await page.goto('http://127.0.0.1:8765/plantas-vivas/index.html?archivo=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Velaria');
  await page.locator('#reset-shadow').click();
  const shadowSnapshot = () => page.evaluate(async () => (await import('/plantas-vivas/viewer.mjs')).shadowPracticeSnapshot());
  await page.locator('[data-clip="seal"]').click();
  assert.equal(await page.locator('[data-clip="seal"]').isDisabled(), true, 'Windup must reject duplicate casts.');
  await page.waitForFunction(() => document.querySelector('#shadow-phase').textContent === 'Sombra marcada');
  const anchored = await shadowSnapshot(); assert(anchored.anchor); assert.equal(anchored.target.health, 100);
  await page.waitForTimeout(550);
  const advancing = await shadowSnapshot();
  assert(advancing.target.x < anchored.target.x - 10, 'The marked enemy must keep advancing.');
  assert.equal(advancing.anchor.x, anchored.anchor.x, 'The anchor must remain fixed.');
  await page.locator('#pause').click();
  const shadowPaused = await shadowSnapshot(); await page.waitForTimeout(180);
  assert.deepEqual(await shadowSnapshot(), shadowPaused, 'Pause must stop the mechanic clock and target.');
  await page.locator('#pause').click();
  await page.waitForFunction(() => document.querySelector('#shadow-returns').textContent === '1');
  const rewound = await shadowSnapshot();
  assert(Math.abs(rewound.target.x - anchored.anchor.x) < 6, 'The enemy must return to its stored position.');
  assert.equal(rewound.target.health, 100); assert.equal(rewound.phase, 'cooldown');
  assert.equal(await page.locator('[data-clip="seal"]').isDisabled(), true);
  await page.waitForFunction(() => document.querySelector('#shadow-phase').textContent === 'Lista');
  assert.equal(await page.locator('[data-clip="seal"]').isDisabled(), false);
  assert.equal(await page.locator('#shadow-returns').textContent(), '1', 'The same mark must never rewind twice.');
  await page.locator('#reset-shadow').click();
  await page.locator('[data-clip="seal"]').click();
  await page.waitForFunction(() => document.querySelector('#shadow-phase').textContent === 'Sombra marcada');
  await page.locator('[data-clip="hit"]').click();
  assert((await page.locator('#status').textContent()).includes('rompió el vínculo'));
  assert.equal((await shadowSnapshot()).anchor, null);
  await page.waitForTimeout(2100);
  assert.equal(await page.locator('#shadow-returns').textContent(), '0', 'An interrupted link must not return later.');
  assert.equal(await page.locator('[data-clip="seal"]').isDisabled(), true);
  await page.locator('#reset-shadow').click();
  await page.locator('[data-clip="seal"]').click();
  await page.waitForFunction(() => document.querySelector('#shadow-phase').textContent === 'Sombra marcada');
  await page.locator('#toggle-shadow-target').click();
  assert.equal(await page.locator('#shadow-phase').textContent(), 'Sin objetivo');
  assert.equal((await shadowSnapshot()).anchor, null);
  await page.locator('#toggle-shadow-target').click();
  assert.equal(await page.locator('[data-clip="seal"]').isDisabled(), true, 'Restoring an enemy must preserve cooldown.');
  await page.locator('#reset-shadow').click();
  await page.locator('#repeat').check(); await page.locator('[data-clip="seal"]').click();
  await page.waitForFunction(() => document.querySelector('#shadow-returns').textContent === '2', null, { timeout: 20000 });
  await page.locator('#repeat').uncheck();
  await page.goto('http://127.0.0.1:8765/plantas-vivas/index.html', { waitUntil: 'networkidle' });
  await page.locator('[data-plant="cortezon"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Cortezón');
  assert.equal(await page.locator('[data-clip="attack"]').count(), 0, 'Defender exposes a block button, never attack.');
  await page.locator('[data-clip="guard"]').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Daño ofensivo: 0'));
  await page.locator('#integrity').evaluate(element => { element.value = 20; element.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.locator('#integrity-value').textContent(), '20%');
  assert((await page.locator('#download-sprites').getAttribute('href')).endsWith('/critical.png'));
  await page.locator('[data-clip="spawn"]').click();
  assert.equal(await page.locator('#integrity-value').textContent(), '100%', 'Replanting restores bark integrity.');
  await page.locator('[data-plant="frigora"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Frígora');
  await page.locator('#repeat').check();
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#cold-state').textContent === 'Ralentizado');
  assert.equal(await page.locator('#cold-speed').textContent(), '50%');
  await page.waitForFunction(() => document.querySelector('#cold-state').textContent === 'Congelado');
  assert.equal(await page.locator('#cold-speed').textContent(), '0%');
  await page.locator('#repeat').uncheck();
  await page.waitForFunction(() => document.querySelector('#cold-state').textContent === 'Ralentizado');
  await page.locator('#reset-cold').click();
  assert.equal(await page.locator('#cold-speed').textContent(), '100%');
  await page.locator('[data-plant="solmiel"]').click();
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('25 de energía'));
  await page.locator('[data-plant="granadin"]').click();
  await page.locator('[data-clip="attack"]').click();
  await page.waitForFunction(() => document.querySelector('#now-playing').textContent.includes('Consumida'));
  assert.equal(await page.locator('[data-clip="attack"]').isDisabled(), true, 'Consumed explosive must not detonate again.');
  await page.locator('[data-clip="spawn"]').click();
  assert.equal(await page.locator('[data-clip="attack"]').isDisabled(), false, 'Replanting must restore the explosive.');
  await page.locator('[data-plant="cilantro"]').click();
  await page.locator('[data-clip="idle"]').click();
  await page.locator('#pause').click();
  assert.equal(await page.locator('#pause').textContent(), 'Reproducir');
  const paused = await hash(); await page.waitForTimeout(220); assert.equal(await hash(), paused, 'Pause must freeze the canvas.');
  await page.locator('#flip').check(); assert.notEqual(await hash(), paused, 'Flip must reflect the plant.');
  await page.locator('#flip').uncheck();
  await page.locator('[data-background="alpha"]').click();
  assert.equal(await page.locator('#stage').getAttribute('class'), 'stage alpha');
  await page.locator('[data-background="garden"]').click();
  const preview = path.join(root, 'preview'); await mkdir(preview, { recursive: true });
  await page.screenshot({ path: path.join(preview, 'visor-desktop-v6.png'), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    assert(dimensions[0] <= dimensions[1], `No horizontal overflow at ${width}px.`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(preview, 'visor-mobile-v6.png'), fullPage: true });
  const download = await page.request.get(await page.locator('#download-animation').getAttribute('href'));
  assert.equal(download.status(), 200, 'Selected animation must download.');
  const motionContext = await browser.newContext({ reducedMotion: 'reduce' });
  const motionPage = await motionContext.newPage();
  await motionPage.goto('http://127.0.0.1:8765/plantas-vivas/index.html', { waitUntil: 'networkidle' });
  assert.equal(await motionPage.locator('#pause').textContent(), 'Reproducir', 'Reduced motion starts paused.');
  await motionPage.locator('[data-clip="attack"]').click();
  assert.equal(await motionPage.locator('#pause').textContent(), 'Pausar', 'Explicit action starts playback.');
  assert.deepEqual(errors, [], 'Browser must have no JavaScript errors.');
  assert.deepEqual(failedRequests, [], 'All runtime assets must load successfully.');
  const report = { date: '2026-10-02', story: 'Select plant → load transparent pieces → play distinct rig actions → download asset',
    checked: { characters: ACTIVE_CHARACTERS.length, archivedCharacters: 2, clips: clipsChecked, atlasBounds: 'valid', clipDurations: 'exact', idleLoop: 'seamless',
      browserActions: ACTIVE_CHARACTERS.reduce((sum, character) => sum + Object.keys(clipsFor(character)).length, 0), sunEvent: '25 energy once', explosion: 'consumed and replantable',
      pureDefense: 'no attack, no projectiles, zero offensive damage', barkIntegrity: 'healthy, damaged, critical',
      frost: '50% speed; 3 impacts freeze for 1.2 s; thaw, expire and reset verified',
      shadowRecall: shadowChecks, shadowBrowser: 'Moving target, fixed anchor, rewind, recovery, cooldown, duplicate rejection, pause, hit interruption, lost target, reset and repeated casts verified',
      pause: 'verified', flip: 'verified', backgrounds: 'verified', reducedMotion: 'verified',
      responsiveWidths: [1280, 390, 320], downloads: 'HTTP 200', javascriptErrors: errors, assetFailures: failedRequests },
  };
  await writeFile(path.join(root, 'browser-validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
