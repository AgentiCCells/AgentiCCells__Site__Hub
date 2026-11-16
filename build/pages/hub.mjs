// Page hook: the hub's index and one page per listed site, generated from registry/*.json
// and data/coming.json. A registry file holds a verbatim copy of the site's own hub.json
// (key hub_json) with the date it was copied and the owner's consent. No database.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export default async function (ctx) {
  const { root, esc } = ctx;

  const sites = readdirSync(join(root, 'registry')).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const entry = JSON.parse(readFileSync(join(root, 'registry', f), 'utf8'));
    const h = entry.hub_json;
    const m = h.repository.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)$/);
    if (!m) throw new Error(`registry/${f}: repository is not a github.com owner/repo address`);
    const path = `/${m[1].toLowerCase()}/${m[2].toLowerCase()}/`;
    return { file: f, entry, h, path };
  });
  const { coming } = JSON.parse(readFileSync(join(root, 'data/coming.json'), 'utf8'));

  // The version is read from each site's own version.json at build time; if it cannot be read, the page says so.
  const versions = {};
  for (const { h } of sites) {
    try {
      const r = await fetch(h.version_from, { signal: AbortSignal.timeout(15000) });
      const v = r.ok ? (await r.json()).version : null;
      versions[h.version_from] = typeof v === 'string' && /^v?\d+\.\d+\.\d+$/.test(v) ? v : null;
    } catch { versions[h.version_from] = null; }
  }
  const readOn = new Date().toISOString().slice(0, 10);
  const versionText = (h) => versions[h.version_from] ? `${versions[h.version_from]} (read on ${readOn}, when this page was built; the live site may have moved on)` : 'Not readable when this page was built';

  const link = (u) => `<a href="${esc(u)}">${esc(u)}</a>`;

  const cards = sites.map(({ h, path }) =>
    `<li class="site-card"><h3><a href="${esc(path)}">${esc(h.name)}</a></h3><p>${esc(h.what_it_does)}</p><table><tbody><tr><th scope="row">Address</th><td>${link(h.live_address)}</td></tr><tr><th scope="row">Licence</th><td>Code ${esc(h.licence.code)}, text ${esc(h.licence.text)}</td></tr><tr><th scope="row">Version</th><td>${esc(versionText(h))}</td></tr></tbody></table></li>`).join('\n');

  const comingCards = coming.map((c) =>
    `<li class="site-card coming"><h3>${esc(c.name)} <span class="tag">Coming. Made-up example</span></h3><p>${esc(c.what)}</p><p><small>Kind: ${esc(c.kind)} · ${esc(c.played_by)} · ${esc(c.status)}</small></p></li>`).join('\n');

  const index = {
    path: '/',
    title: 'AgentiCCells hub: agentic sites you can find and copy',
    description: 'A list of agentic websites, each with its owner, team, live address, repository and licence, and a guide to publishing a site here or copying one.',
    nav: 1,
    navlabel: 'Sites',
    html: `<h1>Agentic sites, listed by consent</h1>
<p>A hub for small websites built by agentic teams. Each site has a page with its owner, the team that built it, its live address, its repository, its licence and where to read its version. Sites are listed only if their owner agrees. <a href="/publish/">How to publish a site here, and how to copy one.</a></p>
<h2>Listed now</h2>
<ul class="site-list">
${cards}
</ul>
<h2>Coming</h2>
<p>These are made-up examples, not real customers or sites. They show what a listing will look like.</p>
<ul class="site-list">
${comingCards}
</ul>
<h2>How the hub works</h2>
<p>There is no database. Each site carries a small <code>hub.json</code> file, the hub keeps a copy of it in a registry, and every page here is generated from those copies. This hub is a proposal at its first version: it has no search, no screenshots and no sgit vaults yet.</p>`,
  };

  const sitePages = sites.map(({ h, entry, path }) => {
    const vault = Object.keys(h).filter((k) => /vault/i.test(k)).length ? 'See the site' : 'None yet';
    return {
      path,
      title: `${h.name}: ${h.owner}`,
      description: `${h.name} on the AgentiCCells hub: owner, team, live address, repository, licence and version.`,
      html: `<h1>${esc(h.name)}</h1>
<p>${esc(h.what_it_does)}</p>
<div class="table-wrap"><table>
<tbody>
<tr><th scope="row">Owner</th><td>${esc(h.owner)}</td></tr>
<tr><th scope="row">Team</th><td>${esc(h.team)}</td></tr>
<tr><th scope="row">Live address</th><td>${link(h.live_address)}</td></tr>
<tr><th scope="row">Repository</th><td>${link(h.repository)}</td></tr>
<tr><th scope="row">Vault</th><td>${esc(vault)}</td></tr>
<tr><th scope="row">Licence</th><td>Code: ${esc(h.licence.code)}. Text: ${esc(h.licence.text)}.</td></tr>
<tr><th scope="row">Version</th><td>${esc(versionText(h))}. Source: ${link(h.version_from)}</td></tr>
<tr><th scope="row">Template</th><td>Not marked as a template. To copy it, read its licence first, then follow <a href="/publish/">how to copy a site</a>.</td></tr>
</tbody></table></div>
<h2>Listing record</h2>
<p>Copied from <a href="${esc(entry.copied_from)}">the site's own hub.json</a> on ${esc(entry.copied_on)}. Consent given on ${esc(entry.consent.given)} by ${esc(entry.consent.by)}. The owner can ask for the entry to be removed at any time.</p>
<p><a href="/">Back to the hub</a></p>`,
    };
  });

  return [index, ...sitePages];
}
