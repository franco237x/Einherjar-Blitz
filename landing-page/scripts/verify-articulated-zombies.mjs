import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ZOMBIES, CLIPS, renderZombie, evaluatePose, poseGeometry, footTarget, ZombieAnimator, animationEvents, moveSpeed } from '../public/zombis-vivos/especiales-v4/runtime/zombie-rig.mjs';
const require = createRequire(import.meta.url), sharp = require('sharp');
const arg = (key, fallback) => { const i = process.argv.indexOf(key); return i < 0 ? fallback : process.argv[i + 1]; };
const { createCanvas, loadImage } = require(arg('--canvas-module', '@napi-rs/canvas'));
const { chromium } = require(arg('--playwright-module', 'playwright'));
const root = fileURLToPath(new URL('../public/zombis-vivos/especiales-v4/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const report = { characters: 0, rigidPieces: 0, sourceSheets: 0, primaryClips: 0, primaryFrames: 0, helmetlessClips: 0, helmetlessFrames: 0 };
const near = (a, b, epsilon = 1e-6) => assert(Math.abs(a - b) < epsilon, `${a} != ${b}`);
const degrees = m => Math.atan2(m.b, m.a) * 180 / Math.PI;
const angleDifference = (a, b) => (a - b + 540) % 360 - 180;
for (const c of manifest.characters) {
  const rig = JSON.parse(await readFile(path.join(root, c.rig), 'utf8')), parts = {};
  assert.equal(Object.keys(rig.parts).length, 18); assert.equal(rig.sources.length, 3);
  for (const [name, part] of Object.entries(rig.parts)) {
    const file = path.join(root, 'characters', c.id, part.file), metadata = await sharp(file).metadata();
    assert(metadata.hasAlpha); assert.equal(metadata.width, part.width); assert.equal(metadata.height, part.height); assert(part.scale > 0);
    parts[name] = await loadImage(file); report.rigidPieces++;
  }
  parts.rig = rig;
  for (const sheet of rig.sources) { const metadata = await sharp(path.join(root, sheet.source)).metadata(); assert(metadata.hasAlpha); report.sourceSheets++; }
  const live = ZOMBIES.find(zombie => zombie.id === c.id), canvas = createCanvas(256, 256), ctx = canvas.getContext('2d'); ctx.scale(0.8, 0.8);
  const originalDraw = ctx.drawImage.bind(ctx);
  ctx.drawImage = function(...args) {
    const m = ctx.getTransform(), x = Math.hypot(m.a, m.b), y = Math.hypot(m.c, m.d);
    near(x, y, 1e-8); near(m.a * m.c + m.b * m.d, 0, 1e-8);
    assert.equal(args.length, 3, 'Rigid piece draws must retain their native bitmap aspect ratio.');
    return originalDraw(...args);
  };
  // Regression: torso rotation must carry the shoulder, upper arm, forearm and
  // hand in the same direction. Compare actual drawing transforms at the wrist.
  const jointCanvas = createCanvas(320, 320), joints = jointCanvas.getContext('2d'), placements = {};
  const nativeDraw = joints.drawImage.bind(joints), names = new Map(Object.entries(parts).map(([name, image]) => [image, name]));
  joints.drawImage = function(...args) { placements[names.get(args[0])] = joints.getTransform(); return nativeDraw(...args); };
  for (const clip of ['idle', live.locomotion, live.id === 'bruton' ? 'smash' : 'bite', 'hit']) {
    for (let frame = 0; frame < CLIPS[clip].frames; frame++) {
      const seconds = frame / 30, p = evaluatePose(live, clip, seconds);
      joints.clearRect(0, 0, 320, 320); renderZombie(joints, live, parts, clip, seconds);
      for (const side of ['Back', 'Front']) {
        const name = side.toLowerCase(), upper = placements[`upper-${name}`], forearm = placements[`forearm-${name}`], hand = placements[`hand-${name}`];
        near(angleDifference(degrees(upper) + rig.parts[`upper-${name}`].nativeAngle, p.torso + p[`upper${side}`]), 0, 1e-4);
        near(angleDifference(degrees(forearm) + rig.parts[`forearm-${name}`].nativeAngle, degrees(hand) - p[`hand${side}`]), 0, 1e-4);
      }
    }
  }
  if (live.id === 'bruton') {
    const contact = animationEvents(live, 'smash')[0], fist = createCanvas(320, 320), mask = fist.getContext('2d'), draw = mask.drawImage.bind(mask);
    mask.drawImage = (...args) => { if (args[0] === parts['hand-front']) draw(...args); };
    renderZombie(mask, live, parts, 'smash', contact.time);
    assert(mask.getImageData(...contact.position, 1, 1).data[3] > 64, 'Smash event should land on the extended painted fist.');
  }
  for (const [bare, animations] of [[false, c.animations], [true, c.variants.helmetless?.animations ?? {}]]) {
    for (const [clip, info] of Object.entries(animations)) {
      for (const key of ['atlas', 'data', 'hdAtlas', 'hdData', 'webp', 'gif']) await access(path.join(root, info[key]));
      const data = JSON.parse(await readFile(path.join(root, info.data), 'utf8')), hd = JSON.parse(await readFile(path.join(root, info.hdData), 'utf8'));
      assert.equal(data.frames.length, CLIPS[clip].frames); assert.equal(hd.frames.length, data.frames.length);
      assert.deepEqual(data.meta.animation.events, animationEvents(live, clip).map(e => ({ ...e, frame: Math.ceil(e.time * 30) })));
      assert.equal(info.shoulderPadsVisible, !!c.armor);
      if (bare) { assert.equal(info.helmetVisible, false); assert.equal(info.shoulderPadsVisible, true); }
      const media = await sharp(path.join(root, info.webp), { animated: true }).metadata(); assert(media.hasAlpha);
      assert.equal(media.delay.reduce((sum, duration) => sum + duration, 0), CLIPS[clip].duration * 1000);
      for (const [size, atlasFile] of [[256, info.atlas], [512, info.hdAtlas]]) {
        const image = await sharp(path.join(root, atlasFile)).metadata(); assert(image.hasAlpha); assert.equal(image.width, size * 8); assert.equal(image.height, Math.ceil(info.frames / 8) * size);
      }
      const hashes = new Set();
      for (let frame = 0; frame < info.frames; frame++) {
        ctx.clearRect(0, 0, 320, 320); renderZombie(ctx, live, parts, clip, frame / 30, { armorRatio: bare ? 0 : 1 });
        const pixels = Buffer.from(ctx.getImageData(0, 0, 256, 256).data);
        hashes.add(createHash('sha256').update(pixels).digest('hex'));
        if (clip === 'fall') {
          let bottom = 0;
          for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) if (pixels[(y * 256 + x) * 4 + 3] > 24) bottom = y;
          assert(bottom <= 232, `${c.id} falls through the ground at frame ${frame}`);
          if (frame >= info.frames - 3) assert(Math.abs(bottom - 230.4) < 2.5, `${c.id} corpse floats above the ground`);
        }
      }
      if (clip === live.locomotion) assert(hashes.size >= info.frames - 1, `${c.id}/${clip} should not use held full-body drawings`);
      if (bare) { report.helmetlessClips++; report.helmetlessFrames += info.frames; } else { report.primaryClips++; report.primaryFrames += info.frames; }
    }
  }
  // A planted ankle must remain stationary after applying the actor's world travel.
  for (const [i, side] of ['front', 'back'].entries()) {
    const start = i * 0.5 * CLIPS[live.locomotion].duration, positions = [];
    for (let sample = 0; sample < 20; sample++) {
      const seconds = start + (sample + 0.2) / 20 * live.layout.stance * CLIPS[live.locomotion].duration;
      const pose = evaluatePose(live, live.locomotion, seconds), geometry = poseGeometry(live, pose), leg = geometry.legs[side];
      assert(leg.foot.support); assert(leg.reachError < 1e-7, 'Leg cannot reach its support foot without stretching.');
      positions.push(leg.ankle[0] - moveSpeed(live) * seconds);
      near(Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]), live.layout.legLengths[0]);
      near(Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1]), live.layout.legLengths[1]);
    }
    for (const position of positions) near(position, positions[0]);
  }
  for (const side of ['front', 'back']) {
    const a = footTarget(live, 0, side), b = footTarget(live, 1, side); assert.deepEqual(a, b);
  }
  report.characters++;
}
assert.equal(report.sourceSheets, 6); assert.equal(report.rigidPieces, 36); assert.equal(report.primaryClips, 13); assert.equal(report.primaryFrames, 462);
assert.equal(report.helmetlessClips, 6); assert.equal(report.helmetlessFrames, 192);
assert.deepEqual(animationEvents(ZOMBIES[1], 'armor-break')[0].pieces, ['helmet']);
for (const c of ZOMBIES) {
  const actor = new ZombieAnimator(c, {}); near(actor.update(0.2), -moveSpeed(c) * 0.2);
  actor.setSpeedMultiplier(0); const time = actor.seconds; assert.equal(actor.update(10), 0); assert.equal(actor.seconds, time);
  actor.setSpeedMultiplier(0.5); near(actor.update(0.2), -moveSpeed(c) * 0.1);
  if (c.armor) { const hit = actor.applyDamage(315); assert.equal(hit.armorLost, 300); assert.equal(hit.healthLost, 15); assert.equal(actor.clip, 'armor-break'); actor.update(0.8); assert.equal(actor.clip, 'run'); }
  actor.applyDamage(2000); assert.equal(actor.clip, 'fall'); assert(!actor.play(c.locomotion)); actor.update(2); assert(actor.dead); assert.equal(actor.update(5), 0);
  actor.play('spawn'); assert.equal(actor.health, c.health); assert.equal(actor.armor, c.armor);
}
const strikes = [], actor = new ZombieAnimator(ZOMBIES[0], {}, { onEvent: e => strikes.push(e) });
actor.play('smash'); actor.update(0.69); assert.equal(strikes.length, 0); actor.update(0.02); assert.equal(strikes.length, 1);
actor.update(4); assert.equal(strikes.length, 1); actor.play('smash'); actor.update(0.3); actor.applyDamage(10); actor.update(2); assert.equal(strikes.length, 1);
const bites = [], biter = new ZombieAnimator(ZOMBIES[1], {}, { onEvent: e => bites.push(e) }); biter.play('bite'); biter.update(3.8); assert.equal(bites.length, 4);
let interrupted; interrupted = new ZombieAnimator(ZOMBIES[0], {}, { onEvent: e => { if (e.type === 'smash') interrupted.applyDamage(2000); } });
interrupted.play('smash'); interrupted.update(2); assert(interrupted.dead);
Object.assign(report, { pieceAspectAndFixedBoneLengths: 'verified', plantedFootWorldPosition: 'verified', continuousLocomotionFrames: 'verified',
  torsoArmAndWristHierarchy: 'verified', groundedCorpseWithAndWithoutHelmet: 'verified',
  helmetOnlyLoss: 'verified', preservedShoulderPads: 'verified', combatTimingAndInterruption: 'verified', slowFreezeDeathRespawn: 'verified' });
const url = 'http://127.0.0.1:8765/zombis-vivos/especiales-v4/index.html', errors = [], requests = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal((await page.request.get(new URL('./preview/comparacion-primeros.gif', url).href)).status(), 200);
  const snapshot = () => page.evaluate(async () => (await import('./viewer.mjs')).zombieSnapshot());
  const imageHash = () => page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  for (const c of ZOMBIES) {
    await page.locator(`[data-character="${c.id}"]`).click(); await page.waitForFunction(name => document.querySelector('#character-name').textContent === name, c.name);
    for (const clip of c.clips) {
      await page.locator('[data-clip="spawn"]').click(); await page.locator(`[data-clip="${clip}"]`).click();
      const before = await imageHash(); await page.waitForTimeout(170); assert.notEqual(await imageHash(), before, `${c.id}/${clip} is static`);
      for (const id of ['download-animation', 'download-sprites', 'download-highres', 'download-parts', 'download-rig']) {
        const href = await page.locator(`#${id}`).getAttribute('href'); assert.equal((await page.request.get(new URL(href, url).href)).status(), 200);
      }
    }
  }
  await page.locator('[data-clip="spawn"]').click(); await page.locator('[data-clip="run"]').click();
  for (let i = 0; i < 12; i++) await page.locator('#damage').click();
  assert.equal((await snapshot()).armor, 0); assert.equal((await snapshot()).health, 140);
  await page.waitForTimeout(800); assert.equal((await snapshot()).clip, 'run');
  assert((await page.locator('#download-highres').getAttribute('href')).includes('/helmetless/'));
  await page.locator('#pause').click(); const frozen = await snapshot(); await page.waitForTimeout(170); assert.deepEqual(await snapshot(), frozen);
  await page.locator('#step').click(); const stepped = await snapshot(); assert(stepped.paused); near(stepped.seconds - frozen.seconds, 1 / 30);
  const bare = await imageHash(); await page.locator('#show-rig').check(); assert.notEqual(await imageHash(), bare); await page.locator('#show-rig').uncheck();
  await page.locator('#travel').check(); const position = (await snapshot()).position; await page.locator('#step').click(); assert((await snapshot()).position < position); await page.locator('#travel').uncheck();
  const left = await imageHash(); await page.locator('#flip').check(); assert.notEqual(await imageHash(), left); await page.locator('#flip').uncheck();
  await page.screenshot({ path: path.join(root, 'preview', 'visor-desktop.png'), fullPage: true });
  report.responsiveWidths = [];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    report.responsiveWidths.push(width); if (width === 390) await page.screenshot({ path: path.join(root, 'preview', 'visor-mobile.png'), fullPage: true });
  }
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' }), reduced = await reducedContext.newPage();
  await reduced.goto(url, { waitUntil: 'networkidle' }); assert.equal(await reduced.locator('#pause').textContent(), 'Reanudar'); await reducedContext.close();
  const legacy = await browser.newPage(); await legacy.goto(url.replace('/especiales-v4/', '/especiales-v2/'), { waitUntil: 'networkidle' });
  await legacy.waitForURL('**/especiales-v4/index.html'); await legacy.close();
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  Object.assign(report, { browserClips: 'all 13 animate', frameStepRigOverlayAndFlip: 'verified', reducedMotion: 'starts paused', javascriptErrors: errors, failedRequests: requests });
} finally { await browser.close(); }
await writeFile(path.join(root, 'validation.json'), JSON.stringify({ date: '2026-10-03', checked: report }, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
