// The hub's list of cells, merged from three files (no database):
//   data/cells-registry.json   the team registry (a verbatim copy, 2026-11-16): entries marked listed
//   data/factory-sites.json    the site factory's own records: every request whose state is live
//   data/hub-listing.json      exclusions, which factory request is a registry entry (same_as), newer facts
//                              (updates), and the hub's grouping: collection, topics, capabilities
// The registry wins where both describe a cell. An excluded factory request is never listed.
// Used by the page hook (build/pages/hub.mjs), the probe (build/probe-sites.mjs) and the validator.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function listedCells(root) {
  const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));
  const reg = read('data/cells-registry.json');
  const factory = read('data/factory-sites.json');
  const listing = read('data/hub-listing.json');
  const updates = listing.updates || {};
  const ownerOf = (repo) => (repo || '').replace('https://github.com/', '').split('/')[0] || null;

  const cells = reg.cells.filter((c) => c.listed === true).map((c) => ({
    ...c, ...Object.fromEntries(Object.entries(updates[c.id] || {}).filter(([k]) => k !== 'why')),
    source: 'registry', owner: ownerOf(c.repository),
  }));
  const byId = new Map(cells.map((c) => [c.id, c]));

  for (const r of factory.requests) {
    const same = listing.same_as[r.label];
    if (same) {
      const c = byId.get(same);
      if (!c) throw new Error(`data/hub-listing.json: same_as ${r.label} -> ${same}, which is not a listed registry entry`);
      c.request = r.request; c.requested_on = r.requested_on;
      continue;
    }
    if (listing.exclude[r.label]) continue;
    if (r.state !== 'live' || !r.live || r.visibility !== 'public') continue;
    const id = r.live.replace('https://', '').replace(/\.agenticcells\.site$/, '').replace(/\./g, '-');
    if (byId.has(id)) throw new Error(`factory request ${r.request} would reuse id ${id}`);
    const c = {
      id, kind: 'site', status: 'demo', listed: true, source: 'factory',
      name: r.name, what: r.description, live: r.live, repository: r.repository, owner: r.owner,
      request: r.request, requested_on: r.requested_on,
    };
    cells.push(c); byId.set(id, c);
  }

  const featuresFile = join(root, 'data/site-features.json');
  const features = existsSync(featuresFile) ? read('data/site-features.json') : { sites: {} };
  for (const c of cells) {
    const g = listing.cells[c.id];
    if (!g) throw new Error(`data/hub-listing.json: no collection, topics or capabilities for ${c.id}`);
    if (!listing.collections[g.collection]) throw new Error(`data/hub-listing.json: ${c.id} has unknown collection ${g.collection}`);
    for (const t of g.topics) if (!listing.topics[t]) throw new Error(`data/hub-listing.json: ${c.id} has unknown topic ${t}`);
    for (const k of g.capabilities) if (!listing.capabilities[k]) throw new Error(`data/hub-listing.json: ${c.id} has unknown capability ${k}`);
    Object.assign(c, { collection: g.collection, topics: g.topics, capabilities: g.capabilities, seed: g.seed === true, features: features.sites[c.id] || null });
  }
  return cells;
}

// The features the hub can show, each from data/site-features.json (see build/probe-sites.mjs).
export const FEATURES = {
  designs: ['Several designs', 'The home page links two or more designs to choose from.'],
  pt: ['English and Portuguese', 'The home page links a Portuguese version.'],
  llms: ['llms.txt for AI agents', 'The site serves /llms.txt, a plain-text guide for AI agents.'],
  og: ['Link previews', 'Shared links show a preview image.'],
};
export const featureList = (c) => !c.features ? [] : Object.keys(FEATURES).filter((k) => c.features[k]);
