// Page hook: the hub's home page (search, filters, one card per cell) and one page per cell,
// generated from data/cells-registry.json (a verbatim copy of conductor@'s registry, with its
// source and date in data/cells-registry.source.json), data/cell-names.json and data/screenshots.json.
// No database. Every cell is a demo unless the registry says its status is "live".
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
    return { ...c, name, kindLabel, kindText, live_status: c.status === 'live' ? 'Live' : 'Demo', path: `/cells/${c.id}/`, shot: shots[c.id] };
  });
  const day = (iso) => iso.slice(0, 10);
  const link = (u) => `<a href="${esc(u)}">${esc(u)}</a>`;
  const repoName = (u) => u.replace('https://github.com/', '');
  const versionText = (c) => c.version_seen ? `${c.version_seen}, seen ${src.registry_checked.slice(0, 10)}` : 'No version yet';

  const alt = (c, w) => `Screenshot of the home page of ${c.name} at ${w} pixels wide, taken ${day(c.shot.shots[w].taken_at)}`;
  const preview = (c) => c.shot
    ? `<img src="${esc(c.shot.shots[1366].file)}" width="${c.shot.shots[1366].width}" height="${c.shot.shots[1366].height}" alt="${esc(alt(c, 1366))}" loading="lazy">`
    : `<span class="noshot" aria-hidden="true">${esc(c.kindLabel)}</span><span class="visually-hidden">No screenshot: this cell has no live address.</span>`;

  const kindCounts = Object.keys(KINDS).map((k) => [k, cells.filter((c) => c.kind === k).length]).filter(([, n]) => n);

  const card = (c) => `<li class="cell-card" data-kind="${esc(c.kind)}" data-status="${esc(c.live_status.toLowerCase())}" data-text="${esc([c.name, c.id, c.what, c.kindLabel, c.live_status].join(' ').toLowerCase())}">
<a class="preview" href="${esc(c.path)}" tabindex="-1" aria-hidden="true">${preview(c)}</a>
<div class="body"><p class="tags"><span class="tag">${esc(c.kindLabel)}</span> <span class="tag ${c.live_status === 'Live' ? 'is-live' : 'is-demo'}">${esc(c.live_status)}</span></p>
<h3><a href="${esc(c.path)}">${esc(c.name)}</a></h3>
<p>${esc(c.what)}</p>
<p class="meta"><small>${c.live ? esc(c.live.replace('https://', '')) : 'No live address'} · ${esc(c.version_seen || 'no version')}</small></p></div>
</li>`;

  const index = {
    path: '/',
    title: 'AgentiCCells hub: find the cells we have made',
    description: 'A catalogue of the cells AgentiCCells has made: sites, factories, templates and specialists, each with screenshots, a live address, its repository and how to copy or ask for one like it.',
    nav: 1,
    navlabel: 'Cells',
    bodyclass: 'wide',
    script: '/assets/hub.js',
    html: `<h1>Find a cell</h1>
<p class="lede">Every cell AgentiCCells has made, in one place: a page for each with screenshots, what it does, where it runs, its repository, its version and how to copy it. Every cell here is a <strong>demo</strong> unless its card says <em>Live</em>. This hub lists; it does not sell. For consultancy and the four ways to start, see <a href="${ASK}">agenticcells.ai</a>.</p>
<form class="filters" id="filters" role="search" aria-label="Find a cell" onsubmit="return false">
<div><label for="q">Search</label><input id="q" type="search" name="q" autocomplete="off" placeholder="Name, kind or what it does"></div>
<div><label for="kind">Kind</label><select id="kind" name="kind"><option value="">All kinds (${cells.length})</option>${kindCounts.map(([k, n]) => `<option value="${esc(k)}">${esc(KINDS[k][0])} (${n})</option>`).join('')}</select></div>
<div><label for="status">Status</label><select id="status" name="status"><option value="">Demo and live</option><option value="demo">Demo</option><option value="live">Live</option></select></div>
<div><label for="where">Address</label><select id="where" name="where"><option value="">With or without</option><option value="yes">Has a live address</option></select></div>
</form>
<p id="count" class="count" role="status" aria-live="polite">${cells.length} cells</p>
<ul class="cell-grid" id="grid">
${cells.map((c) => card(c).replace('<li class="cell-card"', `<li class="cell-card" data-live="${c.live ? 'yes' : 'no'}"`)).join('\n')}
</ul>
<p id="none" class="count" hidden>No cell matches. Clear the search or choose another kind.</p>
<h2>How to read this page</h2>
<ul>
<li><strong>Demo</strong> means we made it to show what a cell can do. Prices, people and orders in a demo can be invented, and each demo says so itself.</li>
<li><strong>Live</strong> means the registry says it runs for real.</li>
<li>Screenshots are snapshots with the date they were taken. The site may have changed since.</li>
<li>Versions are the ones seen on ${esc(src.registry_checked)}, as recorded in the registry. They are not live readings.</li>
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
    const demo = c.live_status === 'Demo' ? '<p class="note"><strong>Demo.</strong> We made this to show what a cell can do. Anything it says about prices, people or orders may be invented, and the cell says so itself.</p>' : '';
    return {
      path: c.path,
      title: `${c.name}: ${c.kindLabel.toLowerCase()} on the AgentiCCells hub`,
      description: `${c.name}: ${c.what} ${c.live_status} ${c.kindLabel.toLowerCase()}, with its repository, version and how to copy it.`.slice(0, 300),
      html: `<p class="crumb"><a href="/">All cells</a></p>
<h1>${esc(c.name)}</h1>
<p class="tags"><span class="tag">${esc(c.kindLabel)}</span> <span class="tag ${c.live_status === 'Live' ? 'is-live' : 'is-demo'}">${esc(c.live_status)}</span></p>
<p class="lede">${esc(c.what)}</p>
${demo}
${shotHtml}
<h2>Details</h2>
<div class="table-wrap"><table><tbody>
<tr><th scope="row">Kind</th><td>${esc(c.kindLabel)}. ${esc(c.kindText)}</td></tr>
<tr><th scope="row">Status</th><td>${esc(c.live_status)}${c.live_status === 'Demo' ? ' (not a paid or production cell)' : ''}</td></tr>
<tr><th scope="row">Live address</th><td>${c.live ? link(c.live) : 'None. It is not served as a website.'}</td></tr>
<tr><th scope="row">Repository</th><td>${link(c.repository)}</td></tr>
<tr><th scope="row">Version</th><td>${esc(versionText(c))}. Source: the registry, not a live reading.</td></tr>
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
