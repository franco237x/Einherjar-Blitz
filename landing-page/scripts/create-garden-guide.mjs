import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), flag = process.argv.indexOf('--canvas-module');
const { createCanvas } = require(flag >= 0 ? process.argv[flag + 1] : '@napi-rs/canvas');
// Layout reference only. Final artwork is generated with ImageGen.
const canvas = createCanvas(2320, 1390), ctx = canvas.getContext('2d');
ctx.fillStyle = '#dce7cb'; ctx.fillRect(0, 0, 2320, 1390);
ctx.fillStyle = '#b29163'; ctx.fillRect(0, 190, 180, 1150);
ctx.fillStyle = '#c9b890'; ctx.fillRect(1980, 190, 340, 1150);
ctx.fillStyle = '#826847'; ctx.fillRect(0, 1340, 2320, 50);
for (let row = 0; row < 5; row++) for (let column = 0; column < 9; column++) {
  ctx.fillStyle = (row + column) % 2 ? '#8daf60' : '#9abd6c';
  ctx.fillRect(180 + column * 200, 190 + row * 230, 200, 230);
}
const directory = fileURLToPath(new URL('../asset-drafts/', import.meta.url));
await mkdir(directory, { recursive: true });
await writeFile(directory + 'jardin-yggdrasil-guide.png', canvas.toBuffer('image/png'));
console.log('Geometry guide: 2320×1390; lawn 180,190 → 1980,1340.');
