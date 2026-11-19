// Turns content/, registry/ and data/ into site/ (the hub's pages come from build/pages/hub.mjs). Node only, no dependencies.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');
// Set by CI only (see .github/workflows/pages.yml); local builds say 'local'.
const version = process.env.SITE_VERSION || 'local';
// The team's contact address (Dinis, 2026-11-15) is not kept in the repository: CI passes it from the
// repository variable HUB_CONTACT (see .github/workflows/pages.yml). Without it the footer points to agenticcells.ai.
const contact = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(process.env.HUB_CONTACT || '') ? process.env.HUB_CONTACT : '';

// The site's address comes from CNAME, so a domain change needs no edit here.
const origin = existsSync(join(root, 'CNAME')) ? `https://${readFileSync(join(root, 'CNAME'), 'utf8').trim()}` : '';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdown(body) {
  const lines = body.split('\n');
  const html = [];
  let para = [], list = [], olist = [];
  const flush = () => {
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    if (olist.length) html.push(`<ol class="steps">${olist.map((l) => `<li>${inline(l)}</li>`).join('')}</ol>`);
    // A list whose every item starts with a **bold lead** is a set of points: shown as cards (D2).
    if (list.length) html.push(`<ul${list.every((l) => /^\*\*[^*]+\*\*/.test(l)) ? ' class="points"' : ''}>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
    para = []; list = []; olist = [];
  };
  for (const line of lines) {
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flush(); html.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if ((m = line.match(/^[-*]\s+(.*)$/))) { if (para.length || olist.length) flush(); list.push(m[1]); }
    // Numbered steps ("1. ...") become an ordered list (D2).
    else if ((m = line.match(/^\d+\.\s+(.*)$/))) { if (para.length || list.length) flush(); olist.push(m[1]); }
    else if (line.trim() === '') flush();
    else { if (list.length || olist.length) flush(); para.push(line.trim()); }
  }
  flush();
  return html.join('\n');
}

// The site nav: every page with a `nav:` number in its front matter (or returned
// by a page hook), in that number's order. Pages without one stay out of the nav.
const MARK = '<svg class="mark" viewBox="0 0 53 32" width="46" height="28" role="img" aria-label="ACC" focusable="false"><g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 26 L11 6 L18.5 26 M6.4 19.5 H15.6"/><path d="M35.5 6.5 A10.5 10.5 0 1 0 35.5 25.5" opacity=".6"/><path d="M48.25 9.5 A10.5 10.5 0 1 0 48.25 22.5"/></g></svg>';
// Every nav page is a primary link, labelled by `navlabel` (front matter or hook) or else its title.
function navList(items, current) {
  return items.map((n) => `<li><a href="${esc(n.url)}"${n.url === current ? ' aria-current="page"' : ''}>${esc(n.label || n.title)}</a></li>`).join('');
}
function navHtml(nav, current) {
  if (!nav.length) return '';
  const items = navList(nav, current);
  return `<nav class="wide" aria-label="Site"><ul>${items}</ul></nav><details class="menu"><summary>Menu</summary><nav aria-label="Site (menu)"><ul>${items}</ul></nav></details>`;
}

// Link previews (Open Graph and Twitter card). The image is 1200x630, absolute, from this site's own files.
// The og description is kept between 110 and 150 characters (cut at a word, or padded with a fixed tail).
const OG_TAIL = ' Screenshots, repository and how to copy it, on the AgentiCCells hub.';
function ogDescription(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length < 110) t = (t + OG_TAIL).trim();
  if (t.length > 150) {
    t = t.slice(0, 147);
    t = t.slice(0, t.lastIndexOf(' ')).replace(/[\s,;:.]+$/, '') + '...';
  }
  if (t.length < 110) t = t + ' ' + OG_TAIL.trim().slice(0, 110 - t.length - 1);
  return t;
}
function ogTags(meta, current) {
  const image = `${origin}${meta.image || '/assets/og/home.jpg'}`;
  const alt = meta.imageAlt || 'AgentiCCells hub: the ACC mark and hub.AgentiCCells.site';
  const desc = ogDescription(meta.ogdescription || meta.description);
  const title = meta.title || '';
  return [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="AgentiCCells hub">',
    '<meta property="og:locale" content="en_GB">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    origin ? `<meta property="og:url" content="${esc(origin + current)}">` : '',
    origin ? `<meta property="og:image" content="${esc(image)}">` : '',
    origin ? '<meta property="og:image:type" content="image/jpeg">' : '',
    origin ? '<meta property="og:image:width" content="1200">' : '',
    origin ? '<meta property="og:image:height" content="630">' : '',
    origin ? `<meta property="og:image:alt" content="${esc(alt)}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    origin ? `<meta name="twitter:image" content="${esc(image)}">` : '',
    origin ? `<meta name="twitter:image:alt" content="${esc(alt)}">` : '',
  ].filter(Boolean).join('\n');
}

function page(meta, content, nav = [], current = '') {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title || '')}</title>
<meta name="description" content="${esc(meta.description || '')}">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
${meta.noindex ? '<meta name="robots" content="noindex">\n' : ''}${origin && !meta.noindex ? `<link rel="canonical" href="${esc(origin + current)}">\n` : ''}${ogTags(meta, current)}
</head>
<body${meta.bodyclass ? ` class="${esc(meta.bodyclass)}"` : ''}>
<header><a class="brand" href="/">${MARK}<span class="wordmark"><span class="label">hub.</span>AgentiCCells.site</span></a>${navHtml(nav, current)}</header>
<main>
${content}
</main>
<footer><p>Contact: ${contact ? `<a href="mailto:${esc(contact)}">${esc(contact)}</a>` : 'through <a href="https://agenticcells.ai">agenticcells.ai</a>'}</p><p>Code under Apache-2.0. Text and images under CC BY 4.0.</p><p>Consultancy and the four ways to start: <a href="https://agenticcells.ai">agenticcells.ai</a>. Also: <a href="https://agenticcells.site">agenticcells.site</a>.</p><p class="version">Version ${esc(version)}</p></footer>
${meta.script ? `<script src="${esc(meta.script)}" defer></script>\n` : ''}</body>
</html>
`;
}

// A site path such as "/", "/console/" or "/console/2026-11-15/" (or "/x.html")
// becomes a file under site/. A path that would leave site/ is refused.
function fileFor(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) throw new Error(`page path must start with "/": ${path}`);
  let f = path.slice(1);
  if (f === '' || f.endsWith('/')) f += 'index.html';
  else if (!f.endsWith('.html')) f += '/index.html';
  if (f.split(/[\\/]/).some((part) => part === '..' || part === '.')) throw new Error(`page path leaves site/: ${path}`);
  return normalize(f);
}
const urlFor = (file) => '/' + file.replace(/(^|\/)index\.html$/, '$1');

// site/ is cleared first, so page hooks may also write their own files under ctx.out.
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'assets'), { recursive: true });

// Pages from content/*.md.
const pages = [];
for (const f of readdirSync(join(root, 'content')).filter((f) => f.endsWith('.md')).sort()) {
  const { meta, body } = frontMatter(readFileSync(join(root, 'content', f), 'utf8'));
  const path = f === 'index.md' ? '/' : `/${f.replace(/\.md$/, '')}/`;
  pages.push({ path, title: meta.title, description: meta.description, nav: meta.nav, navlabel: meta.navlabel, html: markdown(body), source: `content/${f}` });
}

// Page hooks: build/pages/*.mjs, each `export default async function (ctx)` returning
// [{ path, title, description, html, nav? }]. `path` is a site path such as "/console/";
// `html` is the inside of <main>. Each page gets the same template, nav and footer.
// ctx.out is site/, already cleared; a hook may also return extra files through ctx.files.
const hookDir = join(root, 'build', 'pages');
const ctx = { root, out, version, contact, esc, inline, markdown, frontMatter, pages: pages.map(({ path, title }) => ({ path, title })), files: [] };
if (existsSync(hookDir)) {
  for (const f of readdirSync(hookDir).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(join(hookDir, f)).href);
    if (typeof mod.default !== 'function') throw new Error(`build/pages/${f}: no default export function`);
    const got = await mod.default(ctx);
    if (!Array.isArray(got)) throw new Error(`build/pages/${f}: must return an array of pages`);
    for (const p of got) {
      for (const k of ['path', 'title', 'description', 'html']) {
        if (typeof p?.[k] !== 'string') throw new Error(`build/pages/${f}: page ${p?.path ?? '?'} has no ${k}`);
      }
      pages.push({ ...p, source: `build/pages/${f}` });
    }
  }
}

const seen = new Map();
for (const p of pages) {
  p.file = fileFor(p.path);
  if (seen.has(p.file)) throw new Error(`${p.source} and ${seen.get(p.file)} both write ${p.path}`);
  seen.set(p.file, p.source);
}
const nav = pages
  .filter((p) => p.nav !== undefined && p.nav !== '' && Number.isFinite(Number(p.nav)))
  .sort((a, b) => Number(a.nav) - Number(b.nav) || String(a.title).localeCompare(String(b.title)))
  .map((p) => ({ url: urlFor(p.file), title: p.title, label: p.navlabel }));

// 404 page (GitHub Pages serves site/404.html for unknown paths). Not indexed, not in the nav.
if (!seen.has('404.html')) pages.push({
  path: '/404.html', file: '404.html', title: 'Page not found', noindex: true,
  description: 'This page does not exist. Use the menu or go back to the home page.',
  html: '<h1>Page not found</h1>\n<p>There is nothing at this address. Try the menu above, or go to the <a href="/">home page</a>.</p>',
});

for (const p of pages) {
  mkdirSync(dirname(join(out, p.file)), { recursive: true });
  writeFileSync(join(out, p.file), page(p, p.html, nav, urlFor(p.file)));
}
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
if (existsSync(join(root, 'CNAME'))) copyFileSync(join(root, 'CNAME'), join(out, 'CNAME'));
// Extra files from page hooks (ctx.files: [{ path, content }], path under site/), written after site/ is cleared.
for (const { path, content } of ctx.files) {
  const file = normalize(String(path).replace(/^\/+/, ''));
  if (file.split(/[\\/]/).some((part) => part === '..' || part === '.')) throw new Error(`hook file leaves site/: ${path}`);
  mkdirSync(dirname(join(out, file)), { recursive: true });
  writeFileSync(join(out, file), content);
}
// robots.txt and sitemap.xml (every indexable page; no dates, since the build holds none that are true).
const indexable = pages.filter((p) => !p.noindex).map((p) => urlFor(p.file)).sort();
if (origin) {
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((u) => `<url><loc>${esc(origin + u)}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
}
writeFileSync(join(out, 'version.json'), JSON.stringify({ version }) + '\n');
console.log(`built site/ (${version}, ${pages.length} pages)`);
