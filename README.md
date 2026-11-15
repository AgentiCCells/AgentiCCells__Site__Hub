# AgentiCCells__Site__Hub

The source of https://hub.agenticcells.site, a hub that lists agentic sites by their owners' consent. There is no database: `registry/*.json` holds one entry per listed site (a verbatim copy of the site's own `hub.json`, with the copy date and the owner's consent), and `build/pages/hub.mjs` generates the index and a page at `/<owner>/<site>/` for each. `data/coming.json` holds made-up "coming" examples, which the validator requires to be marked as such.

Build and check: `node build/build.mjs && node build/validate.js && node build/leak-scan.mjs`. Release: `team/release.sh` (pushes to `dev`; CI deploys and sets the version).

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
