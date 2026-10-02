import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url), flag = process.argv.indexOf('--playwright-module');
const { chromium } = require(flag >= 0 ? process.argv[flag + 1] : 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext();
  // A controlled slow frame clock reproduces mismatched timing under playback speed > 1.
  await context.addInitScript(() => {
    let now = 0;
    window.requestAnimationFrame = callback => setTimeout(() => { now += 120; callback(now); }, 40);
    window.cancelAnimationFrame = id => clearTimeout(id);
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/plantas-vivas/index.html?archivo=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Velaria');
  await page.locator('#reset-shadow').click();
  await page.locator('#speed').evaluate(element => { element.value = 1.5; element.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.evaluate(async () => {
    const { PlantAnimator } = await import('/plantas-vivas/runtime/plant-rig.mjs');
    const update = PlantAnimator.prototype.update;
    PlantAnimator.prototype.update = function(seconds) {
      const result = update.call(this, seconds);
      window.lastPose = { clip: this.clip, seconds: this.seconds, delta: seconds };
      return result;
    };
    new MutationObserver(() => {
      if (document.querySelector('#shadow-returns').textContent === '1' && !window.returnPose) window.returnPose = { ...window.lastPose };
    }).observe(document.querySelector('#shadow-returns'), { childList: true });
  });
  await page.locator('[data-clip="seal"]').click();
  await page.waitForFunction(() => Boolean(window.returnPose));
  const result = await page.evaluate(() => window.returnPose);
  assert.equal(result.clip, 'recall');
  assert(Math.abs(result.seconds - 0.36) < 0.01, `Return must align with the animated pull: ${result.seconds}.`);
  assert.equal(result.delta, 0.1, 'The animator and world mechanic must receive the same bounded step.');
  assert.deepEqual(errors, []);
  const root = fileURLToPath(new URL('../public/plantas-vivas/', import.meta.url));
  const reportFile = path.join(root, 'browser-validation.json');
  const report = JSON.parse(await readFile(reportFile, 'utf8'));
  report.checked.shadowClock = 'Simulated 120 ms frame gaps at 1.5× playback: world rewind and animated pull align at 0.36 s';
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ shadowClock: report.checked.shadowClock, returnPose: result, javascriptErrors: errors }));
} finally { await browser.close(); }
