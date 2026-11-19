# AgentiCCells__Site__Hub

The source of https://hub.agenticcells.site: every site the AgentiCCells cells have made, as a mix of a code host (owner / repository, version, last build, commit, fork) and a community gallery (screenshots first, newest first, collections, browse by topic, capability and feature). There is no database: `build/cells.mjs` merges `data/cells-registry.json` (a copy of the team registry), `data/factory-sites.json` (the site factory's own records) and `data/hub-listing.json` (Dinis's decision, exclusions and the hub's grouping), and `build/pages/hub.mjs` generates every page from them.

Build and check: `node build/build.mjs && node build/validate.js && node build/leak-scan.mjs && node build/check-excluded.mjs`. Release: `team/release.sh` (pushes to `dev`; CI deploys and sets the version). The footer's contact address comes from the repository variable `HUB_CONTACT`.

Refresh the listing: clone AgentiCCells__Site__Factory (dev), then `node build/import-factory.mjs <clone>`, add any new cell to `data/hub-listing.json`, `node build/probe-sites.mjs`, `node build/shots/take.mjs <tmp> [id ...]` and `python3 -I build/shots/finish.py <tmp>`, then release.

Licences: code Apache-2.0 (see LICENSE); text and images CC BY 4.0.

## Where each file came from

All from https://github.com/AgentiCCells/AgentiCCells__Website (branch `dev`), read 2026-11-15, then adapted. Same licences as that repository.

- `CLAUDE.md`: copied unchanged.
- `build/leak-scan.mjs`, `build/check-commits.mjs`: copied unchanged.
- `build/build.mjs`: copied, then the ladder, stack, seven-step diagram and home-page hero code removed; site name set to "AgentiCCells hub". The CNAME file sets the address, as in the original.
- `build/validate.js`: copied, then CNAME and own host set to hub.agenticcells.site, the cells check and the old hub.json check removed, registry and coming checks added. Every other check is kept as it was.
- `team/release.sh`: copied, then the `board/abp` check removed (this site has no abp). `team/log.sh`: copied unchanged.
- `.github/workflows/pages.yml`: copied, then the abp step removed.
- `assets/style.css`, `assets/favicon.svg`: copied; the key, ladder and diagram styles removed, hub card styles added.
- `registry/agenticcells__website.json`: the `hub_json` object is the main site's `hub.json` (dev, 2026-11-15).
- `.gitignore`: replaced. The inherited Python template ignored `build/`.
- Not taken: the console and abp hooks, checks and data, which this site does not have.

The hub's idea and first-version scope come from Dinis Cruz, "A hub for agentic sites", newsroom.sgit.ai, 2026-11-15.

- 2026-11-16 (v0.2): registry replaced by `data/cells-registry.json` from AgentiCCells__Website (dev); `build/check-excluded.mjs`, `assets/hub.js` and the catalogue styles are new.
- 2026-11-19 (Explore, hub.b@AgentiCCells.dinis): every live factory site listed; Explore, Browse and code-host style cell pages. `build/cells.mjs`, `build/import-factory.mjs`, `build/probe-sites.mjs` and `build/shots/` are new and this repository's own.
