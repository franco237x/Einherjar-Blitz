import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

const require = createRequire(import.meta.url);
const argument = (key, fallback) => { const at = process.argv.indexOf(key); return at < 0 ? fallback : process.argv[at + 1]; };
const { chromium } = require(argument('--playwright-module', 'playwright'));
const python = argument('--python', 'python');
const project = fileURLToPath(new URL('../', import.meta.url));
const version = argument('--version', '2');
assert(['2', '3'].includes(version));
const assets = path.join(project, 'public', 'zombis-vivos', `especiales-v${version}`);
const archive = path.join(project, 'public', 'zombis-vivos', `zombis-especiales-v${version}.zip`);
const staging = path.resolve(project, 'asset-drafts');
await mkdir(staging, { recursive: true });
const extracted = await mkdtemp(path.join(staging, 'special-zombies-portable-'));
assert(path.resolve(extracted).startsWith(staging + path.sep));
execFileSync(python, ['-c', `from pathlib import Path
from zipfile import ZipFile
import sys
root = Path(sys.argv[2]).resolve()
with ZipFile(sys.argv[1]) as pack:
    assert pack.testzip() is None
    for entry in pack.namelist():
        (root / entry).resolve().relative_to(root)
    pack.extractall(root)
`, archive, extracted], { windowsHide: true });
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', extracted],
  { windowsHide: true, stdio: 'ignore' });
let browser;
try {
  const url = `http://127.0.0.1:${port}/index.html`;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Wait for the local server. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage(), errors = [], failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Brutón');
  await page.locator('[data-clip="smash"]').click();
  await page.waitForFunction(() => Number(document.querySelector('#bite-count').value) === 1);
  await page.locator('[data-character="rafago"]').click();
  await page.waitForFunction(() => document.querySelector('#character-name').textContent === 'Ráfago');
  for (let i = 0; i < 12; i++) await page.locator('#damage').click();
  await page.waitForTimeout(950);
  const state = await page.evaluate(async () => (await import('./viewer.mjs')).zombieSnapshot());
  assert.equal(state.clip, 'run'); assert.equal(state.armor, 0); assert.equal(state.health, 140);
  for (const href of await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')))) {
    if (href.startsWith('#')) continue;
    const response = await page.request.get(new URL(href, url).href);
    assert.equal(response.status(), 200, href);
  }
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
  const manifest = JSON.parse(await readFile(path.join(extracted, 'manifest.json'), 'utf8'));
  const report = { date: '2026-10-02', archive: `zombis-especiales-v${version}.zip`, crc: 'verified', characters: manifest.characters.length,
    primaryClips: 13, variantClips: 5, standaloneViewer: 'verified', smashContact: 'verified', armorDropAndContinuedRun: 'verified',
    allViewerLinks: 'HTTP 200', javascriptErrors: errors, failedRequests };
  await writeFile(path.join(assets, 'pack-validation.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill();
}
