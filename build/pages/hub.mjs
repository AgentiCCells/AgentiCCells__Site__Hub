// Page hook: the hub. A mix of a code host (owner / repository, version, last build, commit, fork) and a
// community gallery (screenshots first, collections, browse by topic, capability and feature, newest first).
// Pages: / (Explore), /browse/, /collections/<c>/, /topics/<t>/, /capabilities/<k>/, /features/<f>/, /cells/<id>/.
// The list of cells comes from build/cells.mjs (registry + factory records + data/hub-listing.json). No database.
// Nothing is counted that the hub cannot see: no stars, likes or downloads, because none exist.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listedCells, FEATURES, featureList } from '../cells.mjs';

const KINDS = {
  site: ['Site', 'A website made by the team, served at its own address.'],
  factory: ['Factory', 'Makes new site cells from a request file.'],
  template: ['Template', 'A starting point that other cells are copied from.'],
  cell: ['Cell', 'A cell that does a job other than being a website.'],
  specialist: ['Specialist', 'A specialist agent that other teams can bring in for one kind of work.'],
  'factory-test': ['Factory test', 'A test run of the factory pipeline, kept as a record.'],
};
const STATUS = {
  live: ['Live', 'Sells or serves for real.'],
  demo: ['Demo', 'Made and running, to show what a cell can do.'],
  proposed: ['Proposed', 'Described, often in a newsroom article, or with a repository started. Not built yet.'],
  test: ['Test', 'A factory pipeline test run, kept as a record.'],
};
const ASK = 'https://agenticcells.ai';
const ASK_CELL = 'https://agenticcells.ai/website-cell/';
const FACTORY = 'https://github.com/AgentiCCells/AgentiCCells__Site__Factory';
const ICON_REPO = '<svg class="ico" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.71 1.71.75.75 0 0 1-1.06 1.06A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.71A2.5 2.5 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.09a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>';

export default async function (ctx) {
  const { root, esc } = ctx;
  const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
  const src = read('data/cells-registry.source.json');
  const factory = read('data/factory-sites.json');
  const listing = read('data/hub-listing.json');
  const featuresFile = read('data/site-features.json');
  const names = read('data/cell-names.json');
  const texts = read('data/cell-text.json');
  const shots = Object.fromEntries(read('data/screenshots.json').shots.map((s) => [s.id, s]));

  const cells = listedCells(root).map((c) => {
    if (!KINDS[c.kind]) throw new Error(`unknown kind ${c.kind} for ${c.id}`);
    const st = STATUS[c.status];
    if (!st) throw new Error(`unknown status ${c.status} for ${c.id}`);
    const name = c.source === 'registry' ? names[c.id] : c.name;
    if (!name) throw new Error(`no name for ${c.id} (data/cell-names.json)`);
    const [kindLabel, kindText] = KINDS[c.kind];
    return { ...c, name, what: texts[c.id]?.what || c.what, kindLabel, kindText, live_status: st[0], status_text: st[1], path: `/cells/${c.id}/`, shot: shots[c.id] };
  });

  // Version, commit and build time: read from each live address's own /version.json when the hub is built.
  const readOn = new Date().toISOString().slice(0, 10);
  await Promise.all(cells.map(async (c) => {
    c.version = null; c.version_from = null; c.built = null; c.commit = null;
    if (c.live) {
      try {
        const r = await fetch(`${c.live}/version.json`, { signal: AbortSignal.timeout(15000) });
        const j = r.ok ? await r.json() : {};
        if (typeof j.version === 'string' && /^v?\d+\.\d+\.\d+$/.test(j.version)) { c.version = j.version; c.version_from = 'live'; }
        if (typeof j.built === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(j.built)) c.built = j.built.slice(0, 19) + 'Z';
        if (typeof j.commit === 'string' && /^[0-9a-f]{7,40}$/.test(j.commit)) c.commit = j.commit.slice(0, 7);
      } catch { /* fall back below */ }
    }
    if (!c.version && c.version_seen) { c.version = c.version_seen; c.version_from = 'registry'; }
  }));
  // Newest build first; cells with no build time follow, newest request first.
  const byLatest = (a, b) => (b.built || '').localeCompare(a.built || '') || (b.requested_on || '').localeCompare(a.requested_on || '') || a.name.localeCompare(b.name);
  cells.sort(byLatest);

  const day = (iso) => iso.slice(0, 10);
  const link = (u) => `<a href="${esc(u)}">${esc(u)}</a>`;
  const repoPath = (u) => u.replace('https://github.com/', '');
  const repoShort = (u) => repoPath(u).split('/')[1].replace(/^AgentiCCells__|^PrompTugal__/, '');
  const T = listing.topics, K = listing.capabilities, C = listing.collections;
  const count = (pred) => cells.filter(pred).length;
  const owners = [...new Set(cells.map((c) => c.owner))].sort();

  const alt = (c, w) => `Screenshot of the home page of ${c.name} at ${w} pixels wide, taken ${day(c.shot.shots[w].taken_at)}`;
  const thumb = (c) => c.shot
    ? `<img src="${esc(c.shot.thumb.file)}" width="${c.shot.thumb.width}" height="${c.shot.thumb.height}" alt="${esc(alt(c, 1366))}" loading="lazy">`
    : `<span class="noshot">${esc(c.kindLabel)}</span>`;
  const statusTags = (c) => `<span class="kindline">${esc(c.kindLabel)}</span> <span class="tag is-${esc(c.status)}">${esc(c.live_status)}</span>${c.seed ? ' <span class="tag is-seed">First page only</span>' : ''}`;
  const chip = (href, label, n) => `<a class="chip" href="${esc(href)}">${esc(label)}${n !== undefined ? ` <span class="n">${n}</span>` : ''}</a>`;
  const updated = (c) => c.built ? `Updated <time datetime="${esc(c.built)}">${esc(day(c.built))}</time>` : (c.requested_on ? `Made <time datetime="${esc(c.requested_on)}">${esc(c.requested_on)}</time>` : 'No build date');
  const dataAttrs = (c) => [
    `data-id="${esc(c.id)}"`, `data-collection="${esc(c.collection)}"`, `data-owner="${esc(c.owner)}"`, `data-status="${esc(c.status)}"`,
    `data-topics="${esc(c.topics.join(' '))}"`, `data-caps="${esc(c.capabilities.join(' '))}"`, `data-features="${esc(featureList(c).join(' '))}"`,
    `data-built="${esc(c.built || '')}"`, `data-made="${esc(c.requested_on || '')}"`, `data-name="${esc(c.name.toLowerCase())}"`,
    `data-text="${esc([c.name, c.id, c.what, c.kindLabel, c.live_status, c.owner, C[c.collection][0], ...c.topics.map((t) => T[t]), ...c.capabilities.map((k) => K[k])].join(' ').toLowerCase())}"`,
  ].join(' ');
  const card = (c) => `<li class="card" ${dataAttrs(c)}>
<a class="shot" href="${esc(c.path)}" tabindex="-1" aria-hidden="true">${thumb(c)}<span class="peek">${esc(c.what)}</span></a>
<div class="card-body">
<p class="repo">${ICON_REPO}<span class="owner">${esc(c.owner)}</span> / <span>${esc(repoShort(c.repository))}</span></p>
<h3><a class="title" href="${esc(c.path)}">${esc(c.name)}</a></h3>
<p class="tags">${statusTags(c)}</p>
<p class="meta">${updated(c)}${c.version ? ` · <span class="ver">${esc(c.version)}</span>` : ''}</p>
${c.topics.length ? `<p class="chips small">${c.topics.map((t) => `<a class="chip" href="/topics/${esc(t)}/">${esc(T[t])}</a>`).join('')}</p>` : ''}
</div>
</li>`;
  const gallery = (list, id) => `<ul class="gallery"${id ? ` id="${id}"` : ''}>
${list.map(card).join('\n')}
</ul>`;

  const nLive = count((c) => c.live);
  const facet = (key, legend, entries) => `<fieldset class="facet" data-facet="${key}"><legend>${esc(legend)}</legend><div class="opts">${entries.filter(([, , n]) => n).map(([v, label, n]) => `<label class="opt"><input type="checkbox" name="${key}" value="${esc(v)}"><span>${esc(label)} <span class="n">${n}</span></span></label>`).join('')}</div></fieldset>`;
  const topicCounts = Object.keys(T).map((t) => [t, T[t], count((c) => c.topics.includes(t))]).sort((a, b) => b[2] - a[2]);
  const capCounts = Object.keys(K).map((k) => [k, K[k], count((c) => c.capabilities.includes(k))]).sort((a, b) => b[2] - a[2]);
  const featCounts = Object.keys(FEATURES).map((f) => [f, FEATURES[f][0], count((c) => featureList(c).includes(f))]);
  const colCounts = Object.keys(C).map((k) => [k, C[k][0], count((c) => c.collection === k)]);
  const ownerCounts = owners.map((o) => [o, o, count((c) => c.owner === o)]);
  const statusCounts = Object.keys(STATUS).map((s) => [s, STATUS[s][0], count((c) => c.status === s)]);
  const newest = [...cells].filter((c) => c.requested_on && c.shot).sort((a, b) => b.requested_on.localeCompare(a.requested_on) || byLatest(a, b)).slice(0, 8);

  const browseBlocks = `<div class="browse">
<section><h3>Collections</h3><p class="chips">${colCounts.filter(([, , n]) => n).map(([k, l, n]) => chip(`/collections/${k}/`, l, n)).join('')}</p></section>
<section><h3>Topics</h3><p class="chips">${topicCounts.filter(([, , n]) => n).map(([k, l, n]) => chip(`/topics/${k}/`, l, n)).join('')}</p></section>
<section><h3>Capabilities</h3><p class="chips">${capCounts.filter(([, , n]) => n).map(([k, l, n]) => chip(`/capabilities/${k}/`, l, n)).join('')}</p></section>
<section><h3>Features</h3><p class="chips">${featCounts.filter(([, , n]) => n).map(([k, l, n]) => chip(`/features/${k}/`, l, n)).join('')}</p></section>
</div>`;

  const sources = `<p>The list merges two files and one decision. The team registry, <a href="${esc(src.copied_from)}">cells-registry.json</a>, copied here on ${esc(src.copied_on)}. The site factory's own records, <a href="${esc(factory.copied_from)}">one folder per request</a>, copied ${esc(factory.copied_at)}: every request that is live and public is listed. And Dinis Cruz's word of 2026-11-19 that every site is listed unless he says otherwise; one client cell is excluded on his word, and one withdrawn site is left out. A site named after a person or a company is made only after they agree, and that agreement is recorded in its request. Features were checked on each live site at ${esc(featuresFile.checked_at)}. There is no database: these pages are generated from those files.</p>`;

  const index = {
    path: '/',
    title: 'AgentiCCells hub: explore the sites our cells make',
    description: 'Explore every site AgentiCCells cells have made: newest first, by collection, topic, capability or feature, each with screenshots, its repository and version.',
    nav: 1,
    navlabel: 'Explore',
    bodyclass: 'wide',
    script: '/assets/hub.js',
    html: `<section class="explore-hero">
<h1>Explore the sites our cells make</h1>
<p class="lede">Every site AgentiCCells has made, newest first. Look at it, open it, read its repository, fork it. We list; we do not sell. Consultancy: <a href="${ASK}">agenticcells.ai</a>.</p>
<form class="search" id="filters" role="search" aria-label="Find a site" onsubmit="return false">
<label class="visually-hidden" for="q">Search</label><input id="q" type="search" name="q" autocomplete="off" placeholder="Search ${cells.length} cells: a name, a topic, what it does">
</form>
<p class="stats"><span><strong>${cells.length}</strong> cells</span><span><strong>${nLive}</strong> live addresses</span><span><strong>${owners.length}</strong> owners on GitHub</span><span><strong>${colCounts.filter(([, , n]) => n).length}</strong> collections</span></p>
<nav class="chips collections" aria-label="Collections">${colCounts.filter(([, , n]) => n).map(([k, l, n]) => chip(`/collections/${k}/`, l, n)).join('')}</nav>
</section>
<section class="newest" aria-labelledby="newest-h"><div class="sec-head"><h2 id="newest-h">Newest sites</h2><p><small>By the date the factory made them</small></p></div>
<ul class="strip">${newest.map((c) => `<li><a href="${esc(c.path)}"><img src="${esc(c.shot.thumb.file)}" width="${c.shot.thumb.width}" height="${c.shot.thumb.height}" alt="" loading="lazy"><span class="strip-name">${esc(c.name)}</span><span class="strip-date">${esc(c.requested_on)}</span></a></li>`).join('')}</ul>
</section>
<div class="explore">
<details class="facets" id="facets"><summary>Filters <span class="n" id="nfilters"></span></summary>
<div class="facet-list">
${facet('collection', 'Collection', colCounts)}
${facet('topics', 'Topic', topicCounts)}
${facet('caps', 'Capability', capCounts)}
${facet('features', 'Feature', featCounts)}
${facet('owner', 'Owner', ownerCounts)}
${facet('status', 'Status', statusCounts)}
<p><button type="button" class="linkish" id="clear">Clear filters</button></p>
</div>
</details>
<div class="results">
<div class="toolbar"><p id="count" class="count" role="status" aria-live="polite">${cells.length} cells</p>
<p class="sort"><label for="sort">Sort</label> <select id="sort"><option value="latest">Latest update</option><option value="made">Newest site</option><option value="name">A to Z</option></select></p></div>
${gallery(cells, 'grid')}
<p id="none" class="count" hidden>Nothing matches. Clear the search or a filter.</p>
</div>
</div>
<h2>Browse</h2>
${browseBlocks}
<h2>How to read this page</h2>
<ul>
<li><strong>Latest update</strong> is the build time each live site gives in its own version.json, read when this hub was built. The site may have moved on since.</li>
<li><strong>Demo</strong> means we made it and it runs, to show what a cell can do. Prices, people and orders in a demo can be invented, and each demo says so itself. <strong>Live</strong> means it serves or sells for real. <strong>First page only</strong> means the address is made but the site's first version is not built yet.</li>
<li><strong>Topics</strong> and <strong>capabilities</strong> are the hub's reading of what each site says it does. <strong>Features</strong> were checked on each live site (when is under Where this list comes from).</li>
<li>Screenshots are snapshots with the date they were taken. There are no stars, likes or download counts here, because we do not collect any.</li>
</ul>
<p><a href="/publish/">How to find, copy or ask for a cell like one of these.</a></p>
<h2>Where this list comes from</h2>
${sources}`,
  };

  // Browse pages: one per collection, topic, capability and feature, each a gallery, newest first. They work without JavaScript.
  const listPage = (path, kicker, label, intro, list) => ({
    path,
    title: `${label}: ${kicker.toLowerCase()} on the AgentiCCells hub`,
    description: `${list.length} ${list.length === 1 ? 'cell' : 'cells'} on the AgentiCCells hub under ${label}. ${intro}`.slice(0, 300),
    bodyclass: 'wide',
    html: `<p class="crumb"><a href="/">Explore</a> / <a href="/browse/">Browse</a> / ${esc(kicker)}</p>
<h1>${esc(label)}</h1>
<p class="lede">${esc(intro)}</p>
<p class="count">${list.length} ${list.length === 1 ? 'cell' : 'cells'}, latest update first</p>
${gallery(list)}
<p><a href="/browse/">Browse by something else</a></p>`,
  });
  const browsePages = [
    ...colCounts.filter(([, , n]) => n).map(([k, l]) => listPage(`/collections/${k}/`, 'Collection', l, C[k][1], cells.filter((c) => c.collection === k))),
    ...topicCounts.filter(([, , n]) => n).map(([k, l]) => listPage(`/topics/${k}/`, 'Topic', l, `Sites about ${l.toLowerCase()}.`, cells.filter((c) => c.topics.includes(k)))),
    ...capCounts.filter(([, , n]) => n).map(([k, l]) => listPage(`/capabilities/${k}/`, 'Capability', l, `Cells whose job is this: ${l.toLowerCase()}.`, cells.filter((c) => c.capabilities.includes(k)))),
    ...featCounts.filter(([, , n]) => n).map(([k, l]) => listPage(`/features/${k}/`, 'Feature', l, `${FEATURES[k][1]} Checked on each live site at ${featuresFile.checked_at}.`, cells.filter((c) => featureList(c).includes(k)))),
  ];
  const browse = {
    path: '/browse/',
    title: 'Browse the AgentiCCells hub by collection, topic, capability and feature',
    description: 'Every collection, topic, capability and feature on the AgentiCCells hub, with how many sites each holds. Each opens a gallery, newest first.',
    nav: 2,
    navlabel: 'Browse',
    bodyclass: 'wide',
    html: `<h1>Browse</h1>
<p class="lede">Pick a collection, a topic, a capability or a feature. Each opens a gallery of the sites under it, newest first.</p>
${browseBlocks}
<h2>Owners</h2>
<p class="chips">${ownerCounts.map(([o, , n]) => chip(`https://github.com/${o}`, `${o} on GitHub`, n)).join('')}</p>`,
  };

  const cellPages = cells.map((c) => {
    const s = c.shot;
    const stamp = (x) => esc(x.taken_at.replace('T', ' ').replace('Z', ' UTC'));
    const more = (s && s.more ? s.more : []).map((m) => `<h3>${esc(m.label)}</h3>
<p><small>${esc(c.live + m.path)}</small></p>
<div class="shots">
<figure><img src="${esc(m.shots[1366].file)}" width="${m.shots[1366].width}" height="${m.shots[1366].height}" alt="${esc(`Screenshot of ${m.label}, a design of ${c.name}, at 1366 pixels wide, taken ${day(m.shots[1366].taken_at)}`)}" loading="lazy"><figcaption>Desktop, 1366 pixels wide. Taken ${stamp(m.shots[1366])}, when the live site was ${esc(m.version_at_capture)}.</figcaption></figure>
<figure class="phone"><img src="${esc(m.shots[390].file)}" width="${m.shots[390].width}" height="${m.shots[390].height}" alt="${esc(`Screenshot of ${m.label}, a design of ${c.name}, at 390 pixels wide, taken ${day(m.shots[390].taken_at)}`)}" loading="lazy"><figcaption>Phone, 390 pixels wide. Taken ${stamp(m.shots[390])}.</figcaption></figure>
</div>`).join('\n');
    const shotHtml = s ? `<h2 id="screenshots">Screenshots</h2>${s.more ? `\n<h3>${esc(s.main_label || 'Home page')}</h3>` : ''}
<div class="shots">
<figure><img src="${esc(s.shots[1366].file)}" width="${s.shots[1366].width}" height="${s.shots[1366].height}" alt="${esc(alt(c, 1366))}"><figcaption>Desktop, 1366 pixels wide. Taken ${stamp(s.shots[1366])}, when the live site was ${esc(s.version_at_capture || 'of unknown version')}.</figcaption></figure>
<figure class="phone"><img src="${esc(s.shots[390].file)}" width="${s.shots[390].width}" height="${s.shots[390].height}" alt="${esc(alt(c, 390))}"><figcaption>Phone, 390 pixels wide. Taken ${stamp(s.shots[390])}.</figcaption></figure>
</div>
${more}` : `<h2 id="screenshots">Screenshots</h2>
<p>None. This cell has no live address, so there is nothing to photograph. Its repository is the place to look.</p>`;
    const notes = {
      demo: '<p class="note"><strong>Demo.</strong> We made this to show what a cell can do. Anything it says about prices, people or orders may be invented, and the cell says so itself.</p>',
      proposed: '<p class="note"><strong>Proposed, not built yet.</strong> This cell is described, often in a newsroom article, or its repository has only been started. There is nothing to try.</p>',
      test: '<p class="note"><strong>Test run.</strong> A factory pipeline test, kept as a record. It is not a cell to copy.</p>',
    };
    const seedNote = c.seed ? '<p class="note"><strong>First page only.</strong> The address and repository are made, but the site still shows the factory\'s first page: its first version is not built yet.</p>' : '';
    const feats = featureList(c);
    const fact = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
    const versionText = !c.version ? 'No version yet'
      : c.version_from === 'live' ? `${esc(c.version)}<br><small>From its version.json, read ${esc(readOn)}</small>`
      : `${esc(c.version)}<br><small>From the registry (checked ${esc(src.registry_checked.slice(0, 16))} UTC)</small>`;
    const about = `<aside class="about" aria-label="About ${esc(c.name)}">
<h2 class="about-h">About</h2>
<p>${esc(c.what)}</p>
${c.live ? `<p class="about-link"><a href="${esc(c.live)}">${esc(c.live.replace('https://', ''))}</a></p>` : ''}
${c.topics.length ? `<p class="chips small">${c.topics.map((t) => `<a class="chip" href="/topics/${esc(t)}/">${esc(T[t])}</a>`).join('')}</p>` : ''}
<dl class="facts">
${fact('Collection', `<a href="/collections/${esc(c.collection)}/">${esc(C[c.collection][0])}</a>`)}
${c.capabilities.length ? fact('Capability', c.capabilities.map((k) => `<a href="/capabilities/${esc(k)}/">${esc(K[k])}</a>`).join(', ')) : ''}
${feats.length ? fact('Features', feats.map((f) => `<a href="/features/${esc(f)}/">${esc(FEATURES[f][0])}</a>`).join(', ')) : ''}
${fact('Version', versionText)}
${c.built ? fact('Last built', `<time datetime="${esc(c.built)}">${esc(c.built.replace('T', ' ').replace('Z', ' UTC'))}</time>`) : ''}
${c.commit ? fact('Commit', `<a href="${esc(c.repository)}/commit/${esc(c.commit)}"><code>${esc(c.commit)}</code></a>`) : ''}
${c.request ? fact('Made', `${esc(c.requested_on)}, by the <a href="${FACTORY}/tree/dev/requests/${esc(c.request)}">site factory</a>`) : ''}
${fact('Owner', `<a href="https://github.com/${esc(c.owner)}">${esc(c.owner)}</a>`)}
${fact('Licence', 'See the LICENSE file in the repository')}
</dl>
</aside>`;
    return {
      path: c.path,
      bodyclass: 'wide',
      image: s ? `/assets/og/${c.id}.jpg` : '/assets/og/home.jpg',
      imageAlt: s ? alt(c, 1366) : 'AgentiCCells hub: the ACC mark and hub.AgentiCCells.site',
      ogdescription: c.what,
      title: `${c.name}: ${c.kindLabel.toLowerCase()} on the AgentiCCells hub`,
      description: `${c.name}: ${c.what} ${c.live_status} ${c.kindLabel.toLowerCase()}, with its repository, version and how to copy it.`.slice(0, 300),
      html: `<p class="crumb"><a href="/">Explore</a> / <a href="/collections/${esc(c.collection)}/">${esc(C[c.collection][0])}</a></p>
<div class="repo-head">
<p class="repo-path">${ICON_REPO}<a href="https://github.com/${esc(c.owner)}">${esc(c.owner)}</a> / <a href="${esc(c.repository)}"><strong>${esc(repoPath(c.repository).split('/')[1])}</strong></a></p>
<h1>${esc(c.name)}</h1>
<p class="tags">${statusTags(c)}</p>
<p class="actions">${c.live ? `<a class="button" href="${esc(c.live)}">Open the site</a>` : ''}<a class="button ghost" href="${esc(c.repository)}">Repository</a><a class="button ghost" href="${esc(c.repository)}/fork">Fork</a></p>
<nav class="tabs" aria-label="On this page"><a href="#screenshots">Screenshots</a><a href="#yours">Make it yours</a><a href="#copy">Copy it</a></nav>
</div>
<div class="repo-grid">
<div class="repo-main">
${notes[c.status] || ''}
${seedNote}
${shotHtml}
<h2 id="yours">Five ways to make it yours</h2>
<p>From Dinis Cruz, <a href="https://newsroom.sgit.ai/articles/fork-it.html">Fork it</a> (newsroom, 2026-11-16). Two work today. Three are planned and are not built: nothing below pretends otherwise.</p>
<ul class="ways">
<li><span class="way-name">1. Fork on GitHub</span> <span class="tag is-works">Works today</span><p><a class="button" href="${esc(c.repository)}/fork">Fork ${esc(repoPath(c.repository))}</a></p><p><small>The standard GitHub fork link. It works for a public repository; if the repository is private, GitHub will refuse it. This cell is not yet built to be forked by a stranger: it may carry our team's settings and rules, so expect to change things after you fork.</small></p></li>
<li><span class="way-name">2. Deploy in one click</span> <span class="tag">Planned</span><p>Not built. There is no deploy button for this cell yet.</p></li>
<li><span class="way-name">3. Run in your assistant</span> <span class="tag">Planned</span><p>Not built. There is no ready-made way to run this cell inside an assistant yet.</p></li>
<li><span class="way-name">4. Take it as a vault</span> <span class="tag">Planned</span><p>Not built. This cell has no vault download yet.</p></li>
<li><span class="way-name">5. Ask us</span> <span class="tag is-works">Works today</span><p><a class="button" href="${ASK_CELL}">Ask us to make one like it</a></p><p><small>Goes to agenticcells.ai, where the cell is described. This hub gives no prices.</small></p></li>
</ul>
<h2 id="copy">How to find and copy it</h2>
<ol class="steps">
<li>${c.live ? `Open the live address: ${link(c.live)}.` : 'It has no live address. Start from its repository.'}</li>
<li>Read the repository: ${link(c.repository)}. Its <code>README.md</code> and <code>REALITY.md</code> say what is true of it today.</li>
<li>Check its LICENSE file and keep its notices. The team's own rule is code under Apache-2.0 and text and images under CC BY 4.0, but the file is what counts.</li>
<li>Clone it: <code>git clone ${esc(c.repository)}.git</code>. If the clone is refused, the repository is not public yet; ask for access (below).</li>
<li>${c.kind === 'site' || c.kind === 'template' ? 'Change the text, pictures and address, and say where your copy came from.' : 'Read its README for how to run it, then change what you need and say where your copy came from.'}</li>
</ol>
<h2>How to ask for one like it</h2>
<p>Ask the AgentiCCells team through <a href="${ASK}">agenticcells.ai</a>. This hub gives no prices and takes no orders.</p>
<h2>Details</h2>
<div class="table-wrap"><table><tbody>
<tr><th scope="row">Kind</th><td>${esc(c.kindLabel)}. ${esc(c.kindText)}</td></tr>
<tr><th scope="row">Status</th><td>${esc(c.live_status)}. ${esc(c.status_text)}</td></tr>
<tr><th scope="row">Live address</th><td>${c.live ? link(c.live) : 'None. It is not served as a website.'}</td></tr>
<tr><th scope="row">Repository</th><td>${link(c.repository)}</td></tr>
<tr><th scope="row">Listing</th><td>${c.source === 'factory' ? `From the site factory's records (request ${esc(c.request)}), copied ${esc(factory.copied_at)}. A site that names a person or a company is made only after they agree.` : `From the team registry, copied ${esc(src.copied_on)}, listed with its owner's consent.`}</td></tr>
</tbody></table></div>
<p><a href="/">Back to Explore</a></p>
</div>
${about}
</div>`,
    };
  });

  return [index, browse, ...browsePages, ...cellPages];
}
