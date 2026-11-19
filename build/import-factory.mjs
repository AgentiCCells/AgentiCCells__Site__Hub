// Copies the site factory's own records into data/factory-sites.json: one entry per request
// in AgentiCCells__Site__Factory (requests/*/site.json and status.json). This is the hub's half of
// FAC-008 (the hub lists factory sites without a hand edit), done here because the factory does not
// publish a sites.json yet. Run it against a local clone of the factory's dev branch:
//   node build/import-factory.mjs /path/to/AgentiCCells__Site__Factory
// It writes only what the factory's files say; whether an entry is listed is decided in
// data/hub-listing.json (exclusions, and which factory request is the same cell as a registry entry).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const factory = process.argv[2];
if (!factory || !existsSync(join(factory, 'requests'))) {
  console.error('usage: node build/import-factory.mjs <path to a clone of AgentiCCells__Site__Factory>');
  process.exit(2);
}
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
const git = (...a) => execFileSync('git', a, { cwd: factory, encoding: 'utf8' }).trim();
// A short commit id: the validator refuses 40-character hex strings as key-shaped.
const commit = git('rev-parse', '--short=12', 'HEAD');
const committed = git('log', '-1', '--format=%cI');

const requests = [];
for (const dir of readdirSync(join(factory, 'requests')).sort()) {
  const m = dir.match(/^(\d{4}-\d{2}-\d{2})__([a-z0-9-]+)$/);
  if (!m) continue;
  const p = join(factory, 'requests', dir);
  if (!existsSync(join(p, 'site.json')) || !existsSync(join(p, 'status.json'))) continue;
  const s = read(join(p, 'site.json'));
  const t = read(join(p, 'status.json'));
  requests.push({
    request: dir,
    label: m[2],
    requested_on: m[1],
    name: s.name,
    description: s.description,
    live: s.domain ? `https://${s.domain}` : null,
    repository: `https://github.com/${s.repo.owner}/${s.repo.name}`,
    owner: s.repo.owner,
    visibility: s.visibility,
    state: t.state,
    state_updated: t.updated || null,
  });
}

const out = {
  _about: 'The site factory\'s own records, one entry per request: name, description, address, repository, state. Copied by build/import-factory.mjs; not edited by hand. Listing decisions are in data/hub-listing.json.',
  copied_from: `https://github.com/AgentiCCells/AgentiCCells__Site__Factory/tree/${commit}/requests`,
  factory_commit: commit,
  factory_committed: committed,
  copied_at: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  requests,
};
writeFileSync(join(root, 'data/factory-sites.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`data/factory-sites.json: ${requests.length} requests from factory ${commit}`);
