// Takes the hub's screenshots of each listed live address (or the ids given): the top of the home page,
// one viewport at 1366x768 and one at 390x844, with Playwright and Chromium. Writes PNGs and a record
// to the folder given as the first argument; build/shots/finish.py turns them into WebP, thumbnails and
// link-preview images and updates data/screenshots.json.
//   node build/shots/take.mjs /tmp/shots [id ...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { listedCells } from '../cells.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [outDir, ...only] = process.argv.slice(2);
if (!outDir) { console.error('usage: node build/shots/take.mjs <out dir> [id ...]'); process.exit(2); }
mkdirSync(outDir, { recursive: true });
const cells = listedCells(root).filter((c) => c.live && (!only.length || only.includes(c.id)));

const browser = await chromium.launch();
const record = [];
const sizes = { 1366: { width: 1366, height: 768 }, 390: { width: 390, height: 844 } };
async function one(c) {
  const r = { id: c.id, source: c.live, shots: {} };
  let version = null;
  try {
    const v = await fetch(`${c.live}/version.json`, { signal: AbortSignal.timeout(15000) });
    if (v.ok) version = (await v.json()).version || null;
  } catch {}
  r.version_at_capture = version;
  for (const [w, vp] of Object.entries(sizes)) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    let errors = 0;
    page.on('console', (m) => { if (m.type() === 'error') errors++; });
    page.on('pageerror', () => { errors++; });
    try {
      await page.goto(`${c.live}/`, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const file = join(outDir, `${c.id}-${w}.png`);
      await page.screenshot({ path: file });
      r.shots[w] = { taken_at: new Date().toISOString().slice(0, 19) + 'Z', viewport: `${vp.width}x${vp.height}`, console_errors_on_source: errors, png: file };
    } catch (e) { r.error = String(e.message || e).split('\n')[0]; }
    await page.close();
  }
  record.push(r);
  console.log(c.id, Object.keys(r.shots).join(','), r.error || '');
}
const queue = [...cells];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await one(queue.shift()); }));
await browser.close();
writeFileSync(join(outDir, 'record.json'), JSON.stringify(record, null, 2));
