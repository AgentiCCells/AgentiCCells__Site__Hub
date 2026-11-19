// Checks each listed live address for a few features a visitor can verify, and writes
// data/site-features.json with the time of the check. Run by hand before a release that refreshes
// the listing: node build/probe-sites.mjs. The build reads the file; it does not probe.
// Each feature is a plain test of the live home page or one file, so the hub claims nothing it did not see:
//   llms   /llms.txt answers 200 with text (not an HTML page)
//   designs  the home page links two or more design pages under /d/<name>/
//   pt     the home page links a Portuguese version (hreflang="pt", /pt/ or lang="pt")
//   og     the home page has a link-preview image (og:image)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listedCells } from './cells.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cells = listedCells(root).filter((c) => c.live);

async function get(u) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'AgentiCCells-hub-probe' } });
    return { status: r.status, text: r.ok ? await r.text() : '' };
  } catch { return { status: 0, text: '' }; }
}

const sites = {};
await Promise.all(cells.map(async (c) => {
  const home = await get(`${c.live}/`);
  const llms = await get(`${c.live}/llms.txt`);
  const designs = [...new Set([...home.text.matchAll(/href="(\/d\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))];
  sites[c.id] = {
    home: home.status,
    llms: llms.status === 200 && llms.text.length > 50 && !/<html/i.test(llms.text.slice(0, 300)),
    designs: designs.length >= 2 ? designs.length : 0,
    pt: /hreflang="pt|href="\/pt\/|lang="pt/.test(home.text),
    og: /property="og:image"/.test(home.text),
  };
}));
const out = {
  _about: 'Features seen on each live home page by build/probe-sites.mjs (see the tests at the top of that file). A snapshot: the live site may have changed since.',
  checked_at: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  sites: Object.fromEntries(Object.entries(sites).sort()),
};
writeFileSync(join(root, 'data/site-features.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`data/site-features.json: ${cells.length} live addresses checked`);
