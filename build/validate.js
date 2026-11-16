// The release gate. Must print OK. Checks content/, data/ and the built site/.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);

function walk(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, ext) : (!ext || ext.some((e) => n.endsWith(e)) ? [p] : []);
  });
}
const rel = (p) => p.slice(root.length + 1);
const text = ['.md', '.json', '.html', '.css', '.js', '.mjs', '.yml'];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const scanned = [...walk(join(root, 'content'), text), ...walk(join(root, 'data'), text), ...walk(join(root, 'site'), text), ...walk(join(root, 'assets'), text)];

if (!existsSync(join(root, 'site/index.html'))) fail('site/index.html missing: run the build first');
if (!existsSync(join(root, 'CNAME')) || readFileSync(join(root, 'CNAME'), 'utf8').trim() !== 'hub.agenticcells.site') fail('CNAME must contain hub.agenticcells.site');

const keyShapes = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\b[A-Fa-f0-9]{40,}\b/,
  /\b[A-Za-z0-9+\/]{40,}={0,2}(?![A-Za-z0-9+\/])/,
];
for (const f of scanned) {
  const t = readFileSync(f, 'utf8');
  if (t.includes('—')) fail(`${rel(f)}: em dash found`);
  for (const re of keyShapes) if (re.test(t)) fail(`${rel(f)}: key-shaped string (${re.source.slice(0, 20)}...)`);
  if (/\.(md|html)$/.test(f) || f.endsWith('.json')) {
    t.split('\n').forEach((line, i) => {
      if (/[£$€]\s?\d/.test(line) && !/first proposal/i.test(line)) fail(`${rel(f)}:${i + 1}: price not marked "first proposal"`);
    });
  }
}

// Every content page has title and description.
for (const f of walk(join(root, 'content'), ['.md'])) {
  const m = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const fm = m ? m[1] : '';
  if (!/^title:\s*\S/m.test(fm)) fail(`${rel(f)}: no title`);
  if (!/^description:\s*\S/m.test(fm)) fail(`${rel(f)}: no description`);
}
// Every built page has title and description.
for (const f of walk(join(root, 'site'), ['.html'])) {
  const t = readFileSync(f, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(t)) fail(`${rel(f)}: empty title`);
  if (!/<meta name="description" content="[^"]+"/.test(t)) fail(`${rel(f)}: empty description`);
  // Links resolve.
  for (const m of t.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|#)/.test(u)) continue;
    const path = u.split('#')[0].split('?')[0];
    if (!path) continue;
    let target = path.startsWith('/') ? join(root, 'site', path) : resolve(dirname(f), path);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) fail(`${rel(f)}: broken link ${u}`);
  }
}
// No page loads a script or stylesheet from another host: everything is served from this site.
const ownHosts = new Set(['hub.agenticcells.site']);
const foreign = (u) => {
  const m = u.trim().match(/^(?:[a-z][a-z0-9+.-]*:)?\/\/([^/?#:]+)/i);
  if (m) return !ownHosts.has(m[1].toLowerCase());
  return /^[a-z][a-z0-9+.-]*:/i.test(u.trim()); // data:, javascript: and the like
};
for (const f of walk(join(root, 'site'), ['.html'])) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/<script\b[^>]*>/gi)) {
    const src = m[0].match(/\ssrc\s*=\s*["']?([^"'\s>]+)/i);
    if (src && foreign(src[1])) fail(`${rel(f)}: script from another host: ${src[1]}`);
  }
  for (const m of t.matchAll(/<link\b[^>]*>/gi)) {
    const relAttr = (m[0].match(/\srel\s*=\s*["']?([^"'>]+)/i) || [])[1] || '';
    if (!/\b(stylesheet|preload|modulepreload)\b/i.test(relAttr)) continue;
    const href = m[0].match(/\shref\s*=\s*["']?([^"'\s>]+)/i);
    if (href && foreign(href[1])) fail(`${rel(f)}: ${relAttr.trim()} from another host: ${href[1]}`);
  }
  for (const m of t.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)) if (foreign(m[1])) fail(`${rel(f)}: @import from another host: ${m[1]}`);
}
for (const f of walk(join(root, 'site'), ['.css'])) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)/gi)) if (foreign(m[1])) fail(`${rel(f)}: @import from another host: ${m[1]}`);
}

// Wording: no hype words in content/ or in the built pages (page hooks included).
const hype = /\b(revolutionary|cutting[- ]edge|seamless(?:ly)?|world[- ]class|game[- ]changing)\b/gi;
for (const f of [...walk(join(root, 'content'), ['.md']), ...walk(join(root, 'site'), ['.html'])]) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(hype)) fail(`${rel(f)}:${i + 1}: hype word "${m[1]}"`);
  });
}

// Registry: the hub lists every entry of data/cells-registry.json (a verbatim copy, source and date in
// data/cells-registry.source.json). Each gets a card and a page; every cell is a demo unless the registry says live.
try {
  const reg = JSON.parse(readFileSync(join(root, 'data/cells-registry.json'), 'utf8'));
  const src = JSON.parse(readFileSync(join(root, 'data/cells-registry.source.json'), 'utf8'));
  if (!isoDate.test(src.copied_on || '') || !/^https:\/\/raw\.githubusercontent\.com\//.test(src.copied_from || '')) fail('data/cells-registry.source.json: needs copied_from (raw.githubusercontent.com) and copied_on (a date)');
  const shots = JSON.parse(readFileSync(join(root, 'data/screenshots.json'), 'utf8')).shots;
  const builtIndex = existsSync(join(root, 'site/index.html')) ? readFileSync(join(root, 'site/index.html'), 'utf8') : '';
  const kinds = new Set(['site', 'factory', 'template', 'cell', 'specialist', 'factory-test']);
  const ids = new Set();
  const listed = reg.cells.filter((c) => c.listed === true);
  if (!listed.length) fail('registry: no listed cells');
  for (const c of listed) {
    if (ids.has(c.id)) fail(`registry: duplicate id ${c.id}`);
    ids.add(c.id);
    if (!kinds.has(c.kind)) fail(`registry: ${c.id} has unknown kind ${c.kind}`);
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(c.repository || '')) fail(`registry: ${c.id} repository must be a github.com owner/repo address`);
    if (c.live !== null && !/^https:\/\/[a-z0-9.-]+$/.test(c.live || '')) fail(`registry: ${c.id} live must be null or an https origin`);
    const pf = join(root, 'site/cells', c.id, 'index.html');
    if (!existsSync(pf)) { fail(`registry: no built page for ${c.id}`); continue; }
    const pg = readFileSync(pf, 'utf8');
    const want = { live: 'Live', demo: 'Demo', proposed: 'Proposed', test: 'Test' }[c.status];
    if (!want) { fail(`registry: ${c.id} has unknown status ${c.status}`); continue; }
    if (!new RegExp(`class="tag is-${c.status}">${want}</span>`).test(pg)) fail(`site/cells/${c.id}: must be marked ${want}`);
    if (c.status !== 'demo' && /class="tag is-demo"/.test(pg)) fail(`site/cells/${c.id}: marked Demo but the registry says ${c.status}`);
    if (c.status !== 'live' && /class="tag is-live">Live/.test(pg)) fail(`site/cells/${c.id}: marked live but the registry does not say live`);
    if (!builtIndex.includes(`href="/cells/${c.id}/"`)) fail(`site/index.html: no card for ${c.id}`);
    // Five ways to make it yours: a real fork link, the ask link, and the three unbuilt ways marked Planned (no invented deploy buttons).
    if (!pg.includes(`href="${c.repository}/fork"`)) fail(`site/cells/${c.id}: no fork link`);
    if (!pg.includes('href="https://agenticcells.ai/website-cell/"')) fail(`site/cells/${c.id}: no ask-us link`);
    if ((pg.match(/<span class="tag">Planned<\/span>/g) || []).length !== 3) fail(`site/cells/${c.id}: the three unbuilt ways must each be marked Planned`);
    if (/netlify|vercel|pages\.dev|deploy\.cloudflare/i.test(pg.replace(/Netlify, Vercel/g, ''))) fail(`site/cells/${c.id}: a deploy link or service is named that does not exist yet`);
    if (c.live) {
      const s = shots.find((x) => x.id === c.id);
      for (const w of ['1366', '390']) {
        if (!s || !s.shots[w] || !/^\d{4}-\d{2}-\d{2}T/.test(s.shots[w].taken_at || '')) fail(`data/screenshots.json: ${c.id} needs a ${w} px screenshot with taken_at`);
        else if (!existsSync(join(root, s.shots[w].file.slice(1)))) fail(`data/screenshots.json: ${s.shots[w].file} missing`);
      }
      if (s && s.thumb && !existsSync(join(root, s.thumb.file.slice(1)))) fail(`data/screenshots.json: ${s.thumb.file} missing`);
      if (!pg.includes('<img ')) fail(`site/cells/${c.id}: has a live address but shows no screenshot`);
    }
  }
  if (!/id="q"/.test(builtIndex) || !/id="kind"/.test(builtIndex)) fail('site/index.html: search and kind filter missing');
  if (!/<script src="\/assets\/hub\.js" defer>/.test(builtIndex)) fail('site/index.html: hub.js not loaded');
} catch (e) { fail(`registry: ${e.message}`); }

// The excluded client cell must not appear anywhere (separate script so its pattern stays out of this file).
try {
  execFileSync(process.execPath, [join(root, 'build/check-excluded.mjs')], { stdio: 'pipe' });
} catch (e) { fail(String(e.stderr || e.message).trim()); }

// Selling basics (V3): canonical and Open Graph on every indexable page, sitemap, robots, 404, favicon.
{
  const cname = readFileSync(join(root, 'CNAME'), 'utf8').trim();
  for (const f of ['site/404.html', 'site/robots.txt', 'site/sitemap.xml', 'site/assets/favicon.svg']) if (!existsSync(join(root, f))) fail(`${f} missing`);
  const sitemap = existsSync(join(root, 'site/sitemap.xml')) ? readFileSync(join(root, 'site/sitemap.xml'), 'utf8') : '';
  if (existsSync(join(root, 'site/robots.txt')) && !readFileSync(join(root, 'site/robots.txt'), 'utf8').includes(`Sitemap: https://${cname}/sitemap.xml`)) fail('site/robots.txt: Sitemap line missing or wrong host');
  for (const f of walk(join(root, 'site'), ['.html'])) {
    const t = readFileSync(f, 'utf8');
    for (const k of ['og:title', 'og:description']) if (!t.includes(`property="${k}"`)) fail(`${rel(f)}: no ${k}`);
    if (/<meta name="robots" content="noindex">/.test(t)) continue;
    const url = '/' + rel(f).slice('site/'.length).replace(/(^|\/)index\.html$/, '$1');
    if (!t.includes(`<link rel="canonical" href="https://${cname}${url}">`)) fail(`${rel(f)}: canonical missing or wrong (want https://${cname}${url})`);
    if (!sitemap.includes(`<loc>https://${cname}${url}</loc>`)) fail(`${rel(f)}: not in sitemap.xml`);
  }
}

if (errors.length) { console.error(errors.join('\n')); console.error(`FAILED (${errors.length})`); process.exit(1); }
console.log('OK');
