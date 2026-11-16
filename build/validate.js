// The release gate. Must print OK. Checks content/, data/ and the built site/.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const scanned = [...walk(join(root, 'content'), text), ...walk(join(root, 'data'), text), ...walk(join(root, 'registry'), text), ...walk(join(root, 'site'), text), ...walk(join(root, 'assets'), text)];

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

// Registry (ACC-024, ACC-028): one entry per listed site, a verbatim hub.json plus the copy date and the owner's consent.
// Only sites whose owner has agreed may be listed: today AgentiCCells' own site (listed by its owner, who owns this hub).
const consented = new Set(['AgentiCCells']);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
try {
  const files = walk(join(root, 'registry'), ['.json']);
  if (!files.length) fail('registry/: no entries');
  const builtIndex = existsSync(join(root, 'site/index.html')) ? readFileSync(join(root, 'site/index.html'), 'utf8') : '';
  for (const f of files) {
    try {
      const e = JSON.parse(readFileSync(f, 'utf8'));
      const h = e.hub_json || {};
      for (const k of ['name', 'what_it_does', 'owner', 'team', 'live_address', 'repository', 'version_from']) {
        if (typeof h[k] !== 'string' || !h[k].trim()) fail(`${rel(f)}: hub_json.${k} must be a non-empty string`);
      }
      if (!h.licence || typeof h.licence.code !== 'string' || typeof h.licence.text !== 'string') fail(`${rel(f)}: hub_json.licence needs code and text`);
      if (!isoDate.test(e.copied_on || '')) fail(`${rel(f)}: copied_on must be a date (YYYY-MM-DD)`);
      if (!/^https:\/\/raw\.githubusercontent\.com\//.test(e.copied_from || '')) fail(`${rel(f)}: copied_from must be the site's own hub.json on raw.githubusercontent.com`);
      if (!e.consent || !isoDate.test(e.consent.given || '') || !String(e.consent.by || '').trim()) fail(`${rel(f)}: consent needs by and given (a date)`);
      if (!consented.has(h.owner)) fail(`${rel(f)}: owner ${h.owner} has no recorded consent to be listed`);
      if (!/^https:\/\/[a-z0-9.-]+$/.test(h.live_address || '')) fail(`${rel(f)}: live_address must be an https origin`);
      if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(h.repository || '')) fail(`${rel(f)}: repository must be a github.com owner/repo address`);
      if (h.version_from !== `${h.live_address}/version.json`) fail(`${rel(f)}: version_from must be ${h.live_address}/version.json`);
      for (const k of Object.keys(h)) if (/vault/i.test(k)) fail(`${rel(f)}: vault field "${k}" not allowed until a vault exists and its owner gives it`);
      const m = (h.repository || '').match(/github\.com\/([\w.-]+)\/([\w.-]+)$/);
      if (m && !existsSync(join(root, 'site', m[1].toLowerCase(), m[2].toLowerCase(), 'index.html'))) fail(`${rel(f)}: no built page for this entry`);
      if (h.licence && !builtIndex.includes(h.licence.code)) fail(`${rel(f)}: licence not shown on the index card`);
      if (!/<th scope="row">Version<\/th>/.test(builtIndex)) fail(`${rel(f)}: no version row on the index card`);
      if (h.name && !builtIndex.includes(h.name)) fail(`${rel(f)}: not shown on the index page`);
    } catch (err) { fail(`${rel(f)}: ${err.message}`); }
  }
} catch (e) { fail(`registry: ${e.message}`); }

// Coming entries: made-up examples, each marked as such in the data and on the built index page.
try {
  const { coming } = JSON.parse(readFileSync(join(root, 'data/coming.json'), 'utf8'));
  const builtIndex = existsSync(join(root, 'site/index.html')) ? readFileSync(join(root, 'site/index.html'), 'utf8') : '';
  for (const c of coming || []) {
    if (c.made_up !== true) fail(`data/coming.json: ${c.name} must have made_up: true`);
    if (!builtIndex.includes(c.name) || !/Coming\. Made-up example/.test(builtIndex)) fail(`site/index.html: "${c.name}" not shown as a coming, made-up example`);
  }
} catch (e) { fail(`data/coming.json: ${e.message}`); }

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
