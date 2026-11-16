# AgentiCCells__Site__Hub

The source of https://hub.agenticcells.site, a catalogue of the cells AgentiCCells has made (Hugging Face and GitHub style: search, filters, a page per cell with screenshots, repository, version and how to copy it). There is no database: `data/cells-registry.json` is a copy of the team's registry (source and date in `data/cells-registry.source.json`), and `build/pages/hub.mjs` generates the home page and `/cells/<id>/` from it, with `data/cell-names.json` and `data/screenshots.json`.

Build and check: `node build/build.mjs && node build/validate.js && node build/leak-scan.mjs && node build/check-excluded.mjs`. Release: `team/release.sh` (pushes to `dev`; CI deploys and sets the version). Screenshots in `assets/shots/` are taken with Playwright and Chromium; their times are in `data/screenshots.json`.

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
