// Page hook: the hub's home page (search, filters, one card per cell) and one page per cell,
// generated from data/cells-registry.json (a verbatim copy of conductor@'s registry, with its
// source and date in data/cells-registry.source.json), data/cell-names.json and data/screenshots.json.
// No database. Statuses come from the registry: live, demo, proposed (not built yet), test (a pipeline test run).
// Every cell is a demo unless the registry says otherwise.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
// Cells people can open and look at come first, in this order; the rest follow in registry order.
const ORDER = ['riskmandate-at-websummit', 'algarve-orange-grower', 'gabriel-dacruz', 'agenticcells-ai', 'agenticcells-site', 'hub'];
const ASK = 'https://agenticcells.ai';
const ASK_CELL = 'https://agenticcells.ai/website-cell/';

export default async function (ctx) {
  const { root, esc } = ctx;
  const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
  const reg = read('data/cells-registry.json');
  const src = read('data/cells-registry.source.json');
  const names = read('data/cell-names.json');
  const shots = Object.fromEntries(read('data/screenshots.json').shots.map((s) => [s.id, s]));

  const cells = reg.cells.filter((c) => c.listed === true).map((c) => {
    const [kindLabel, kindText] = KINDS[c.kind] || [c.kind, ''];
    const name = names[c.id];
    if (!name) throw new Error(`data/cell-names.json: no name for ${c.id}`);
    if (!KINDS[c.kind]) throw new Error(`cells-registry.json: unknown kind ${c.kind} for ${c.id}`);
    const st = STATUS[c.status];
    if (!st) throw new Error(`cells-registry.json: unknown status ${c.status} for ${c.id}`);
    return { ...c, name, kindLabel, kindText, live_status: st[0], status_text: st[1], path: `/cells/${c.id}/`, shot: shots[c.id] };
  }).sort((a, b) => {
    const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  // Versions: read each live address's own /version.json when the page is built; fall back to the registry's.
  const readOn = new Date().toISOString().slice(0, 10);
  for (const c of cells) {
    c.version = null; c.version_from = null;
    if (c.live) {
      try {
        const r = await fetch(`${c.live}/version.json`, { signal: AbortSignal.timeout(15000) });
        const v = r.ok ? (await r.json()).version : null;
        if (typeof v === 'string' && /^v?\d+\.\d+\.\d+$/.test(v)) { c.version = v; c.version_from = 'live'; }
      } catch { /* fall back below */ }
    }
    if (!c.version && c.version_seen) { c.version = c.version_seen; c.version_from = 'registry'; }
  }
  const day = (iso) => iso.slice(0, 10);
  const link = (u) => `<a href="${esc(u)}">${esc(u)}</a>`;
  const repoName = (u) => u.replace('https://github.com/', '');
  const versionText = (c) => !c.version ? 'No version yet'
    : c.version_from === 'live' ? `${c.version}, read from its own version.json on ${readOn}, when this page was built; the live site may have moved on`
    : `${c.version}, from the registry (checked ${src.registry_checked.slice(0, 16)} UTC); the live address could not be read when this page was built`;

  const alt = (c, w) => `Screenshot of the home page of ${c.name} at ${w} pixels wide, taken ${day(c.shot.shots[w].taken_at)}`;
  const preview = (c) => `<img src="${esc(c.shot.thumb.file)}" width="${c.shot.thumb.width}" height="${c.shot.thumb.height}" alt="${esc(alt(c, 1366))}" loading="lazy">`;

  const kindCounts = Object.keys(KINDS).map((k) => [k, cells.filter((c) => c.kind === k).length]).filter(([, n]) => n);

  const dataAttrs = (c) => `data-kind="${esc(c.kind)}" data-status="${esc(c.status)}" data-live="${c.live ? 'yes' : 'no'}" data-text="${esc([c.name, c.id, c.what, c.kindLabel, c.live_status].join(' ').toLowerCase())}"`;
  const tags = (c) => `<span class="tag">${esc(c.kindLabel)}</span> <span class="tag is-${esc(c.status)}">${esc(c.live_status)}</span>`;
  const card = (c) => `<li class="cell-card" ${dataAttrs(c)}>
<a class="preview" href="${esc(c.path)}" tabindex="-1" aria-hidden="true">${preview(c)}</a>
<div class="body"><p class="tags">${tags(c)}</p>
<h3><a class="title" href="${esc(c.path)}">${esc(c.name)}</a></h3>
<p>${esc(c.what)}</p>
<p class="meta"><small>${esc(c.live.replace('https://', ''))} · ${esc(c.version || 'no version')}</small></p></div>
</li>`;
  const row = (c) => `<li class="cell-row" ${dataAttrs(c)}><a class="title" href="${esc(c.path)}">${esc(c.name)}</a> <span class="tags">${tags(c)}</span><span class="what">${esc(c.what)}</span></li>`;
  const withAddr = cells.filter((c) => c.live && c.shot);
  const parts = cells.filter((c) => !(c.live && c.shot) && (c.status === 'demo' || c.status === 'live'));
  const proposed = cells.filter((c) => c.status === 'proposed');
  const tests = cells.filter((c) => c.status === 'test');
  const orphan = cells.filter((c) => ![...withAddr, ...parts, ...proposed, ...tests].includes(c));
  if (orphan.length) throw new Error(`cells not placed on the home page: ${orphan.map((c) => c.id).join(', ')}`);
  const statusCounts = Object.keys(STATUS).map((k) => [k, cells.filter((c) => c.status === k).length]).filter(([, n]) => n);

  const index = {
    path: '/',
    title: 'AgentiCCells hub: find the cells we have made',
    description: 'A catalogue of the cells AgentiCCells has made: sites, factories, templates and specialists, each with screenshots, a live address, its repository and how to copy or ask for one like it.',
    nav: 1,
    navlabel: 'Cells',
    bodyclass: 'wide',
    script: '/assets/hub.js',
    html: `<h1>Find a cell</h1>
<p class="lede">The cells AgentiCCells has made, with screenshots and how to copy them. We list; we do not sell. Consultancy: <a href="${ASK}">agenticcells.ai</a>.</p>
<form class="filters" id="filters" role="search" aria-label="Find a cell" onsubmit="return false">
<div class="f-q"><label for="q">Search</label><input id="q" type="search" name="q" autocomplete="off" placeholder="Name, kind or what it does"></div>
<details class="f-more" id="fmore"><summary>Filters</summary><div class="f-grid">
<div><label for="kind">Kind</label><select id="kind" name="kind"><option value="">All kinds (${cells.length})</option>${kindCounts.map(([k, n]) => `<option value="${esc(k)}">${esc(KINDS[k][0])} (${n})</option>`).join('')}</select></div>
<div><label for="status">Status</label><select id="status" name="status"><option value="">All statuses</option>${statusCounts.map(([k, n]) => `<option value="${esc(k)}">${esc(STATUS[k][0])} (${n})</option>`).join('')}</select></div>
<div><label for="where">Address</label><select id="where" name="where"><option value="">With or without</option><option value="yes">Has a live address</option></select></div>
</div></details>
</form>
<p id="count" class="count" role="status" aria-live="polite">${cells.length} cells</p>
<ul class="cell-grid" id="grid">
${withAddr.map(card).join('\n')}
</ul>
<section id="sec-parts"><h2>Parts</h2><p>Parts the cells are made from. They have no address to open.</p><ul class="cell-rows">
${parts.map(row).join('\n')}
</ul></section>
<section id="sec-proposed"><h2>Proposed, not built yet</h2><p>Described in a newsroom article, or with a repository started. Nothing to try yet.</p><ul class="cell-rows">
${proposed.map(row).join('\n')}
</ul></section>
<details class="tests" id="sec-tests"><summary>Parts and tests: factory pipeline test runs (${tests.length})</summary><ul class="cell-rows">
${tests.map(row).join('\n')}
</ul></details>
<p id="none" class="count" hidden>No cell matches. Clear the search or choose another kind.</p>
<h2>How to read this page</h2>
<ul>
<li><strong>Demo</strong> means we made it and it runs, to show what a cell can do. Prices, people and orders in a demo can be invented, and each demo says so itself. Every cell is a demo unless it says otherwise.</li>
<li><strong>Live</strong> means the registry says it serves or sells for real.</li>
<li><strong>Proposed</strong> means it is described, often in a newsroom article, or its repository is started, but it is not built.</li>
<li><strong>Test</strong> means a factory pipeline test run, kept as a record.</li>
<li>Screenshots are snapshots with the date they were taken. The site may have changed since.</li>
<li>Versions are read from each live address's own version.json when the hub is built (the date is on each cell page), so they can be behind the live site. Cells with no address show the registry's value.</li>
</ul>
<p><a href="/publish/">How to find, copy or ask for a cell like one of these.</a></p>
<h2>Where this list comes from</h2>
<p>The list is the registry kept by the AgentiCCells conductor: <a href="${esc(src.copied_from)}">cells-registry.json</a>, copied here on ${esc(src.copied_on)}. A cell is listed only if its owner agrees. There is no database: the pages are generated from that file.</p>`,
  };

  const cellPages = cells.map((c) => {
    const s = c.shot;
    const shotHtml = s ? `<h2>Screenshots</h2>
<div class="shots">
<figure><img src="${esc(s.shots[1366].file)}" width="${s.shots[1366].width}" height="${s.shots[1366].height}" alt="${esc(alt(c, 1366))}"><figcaption>Desktop, 1366 pixels wide. Taken ${esc(s.shots[1366].taken_at.replace('T', ' ').replace('Z', ' UTC'))}, when the live site was ${esc(s.version_at_capture || 'of unknown version')}.</figcaption></figure>
<figure class="phone"><img src="${esc(s.shots[390].file)}" width="${s.shots[390].width}" height="${s.shots[390].height}" alt="${esc(alt(c, 390))}"><figcaption>Phone, 390 pixels wide. Taken ${esc(s.shots[390].taken_at.replace('T', ' ').replace('Z', ' UTC'))}.</figcaption></figure>
</div>` : `<h2>Screenshots</h2>
<p>None. This cell has no live address, so there is nothing to photograph. Its repository is the place to look.</p>`;
    const notes = {
      demo: '<p class="note"><strong>Demo.</strong> We made this to show what a cell can do. Anything it says about prices, people or orders may be invented, and the cell says so itself.</p>',
      proposed: '<p class="note"><strong>Proposed, not built yet.</strong> This cell is described, often in a newsroom article, or its repository has only been started. There is nothing to try. Treat the repository as a starting point at most.</p>',
      test: '<p class="note"><strong>Test run.</strong> A factory pipeline test, kept as a record. It is not a cell to copy.</p>',
    };
    const demo = notes[c.status] || '';
    return {
      path: c.path,
      title: `${c.name}: ${c.kindLabel.toLowerCase()} on the AgentiCCells hub`,
      description: `${c.name}: ${c.what} ${c.live_status} ${c.kindLabel.toLowerCase()}, with its repository, version and how to copy it.`.slice(0, 300),
      html: `<p class="crumb"><a href="/">All cells</a></p>
<h1>${esc(c.name)}</h1>
<p class="tags">${tags(c)}</p>
<p class="lede">${esc(c.what)}</p>
${demo}
${shotHtml}
<h2>Details</h2>
<div class="table-wrap"><table><tbody>
<tr><th scope="row">Kind</th><td>${esc(c.kindLabel)}. ${esc(c.kindText)}</td></tr>
<tr><th scope="row">Status</th><td>${esc(c.live_status)}. ${esc(c.status_text)}</td></tr>
<tr><th scope="row">Live address</th><td>${c.live ? link(c.live) : 'None. It is not served as a website.'}</td></tr>
<tr><th scope="row">Repository</th><td>${link(c.repository)}</td></tr>
<tr><th scope="row">Version</th><td>${esc(versionText(c))}.</td></tr>
<tr><th scope="row">Licence</th><td>See the LICENSE file in the repository. The team's own rule is code under Apache-2.0 and text and images under CC BY 4.0, but the file is what counts.</td></tr>
<tr><th scope="row">Listing</th><td>Listed with its owner's consent. Registry copied ${esc(src.copied_on)}.</td></tr>
</tbody></table></div>
<h2>Five ways to make it yours</h2>
<p>From Dinis Cruz, <a href="https://newsroom.sgit.ai/articles/fork-it.html">Fork it</a> (newsroom, 2026-11-16). Two work today. Three are planned and are not built: nothing below pretends otherwise.</p>
<ul class="ways">
<li><span class="way-name">1. Fork on GitHub</span> <span class="tag is-works">Works today</span><p><a class="button" href="${esc(c.repository)}/fork">Fork ${esc(repoName(c.repository))}</a></p><p><small>The standard GitHub fork link. It works for a public repository; if the repository is private, GitHub will refuse it. This cell is not yet built to be forked by a stranger: it may carry our team's settings and rules, so expect to change things after you fork.</small></p></li>
<li><span class="way-name">2. Deploy in one click</span> <span class="tag">Planned</span><p>Not built. There is no deploy button for this cell yet.</p></li>
<li><span class="way-name">3. Run in your assistant</span> <span class="tag">Planned</span><p>Not built. There is no ready-made way to run this cell inside an assistant yet.</p></li>
<li><span class="way-name">4. Take it as a vault</span> <span class="tag">Planned</span><p>Not built. This cell has no vault download yet.</p></li>
<li><span class="way-name">5. Ask us</span> <span class="tag is-works">Works today</span><p><a class="button" href="${ASK_CELL}">Ask us to make one like it</a></p><p><small>Goes to agenticcells.ai, where the cell is described. This hub gives no prices.</small></p></li>
</ul>
<h2>How to find it</h2>
<ol class="steps">
<li>${c.live ? `Open the live address: ${link(c.live)}.` : 'It has no live address. Start from its repository.'}</li>
<li>Read the code and files in the repository: ${link(c.repository)}.</li>
<li>Its <code>README.md</code> and <code>REALITY.md</code> say what is true of it today.</li>
</ol>
<h2>How to copy it</h2>
<ol class="steps">
<li>Check the repository's LICENSE file and keep its notices.</li>
<li>Clone it: <code>git clone ${esc(c.repository)}.git</code>. If the clone is refused, the repository is not public yet; ask for access (below).</li>
<li>${c.kind === 'site' || c.kind === 'template' ? 'Change the text, pictures and address, and say where your copy came from.' : 'Read its README for how to run it, then change what you need and say where your copy came from.'}</li>
</ol>
<h2>How to ask for one like it</h2>
<p>Ask the AgentiCCells team through <a href="${ASK}">agenticcells.ai</a>, where the consultancy and the four ways to start are described. This hub gives no prices and takes no orders.</p>
<p><a href="/">Back to all cells</a></p>`,
    };
  });

  return [index, ...cellPages];
}
