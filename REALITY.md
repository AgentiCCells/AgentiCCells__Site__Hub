# REALITY.md: what is true of this repository, 2026-11-16

A thing not written here does not exist.

## What the hub is

- A catalogue of the cells AgentiCCells has made, built from `data/cells-registry.json`: a copy of conductor@'s registry in AgentiCCells__Website (branch dev), copied 2026-11-16, registry checked 2026-11-16 18:10 UTC. Source and date: `data/cells-registry.source.json`. One field of the copy (`_decision`) is removed, see below.
- Home page: one card per listed cell (17 on the copy), with a preview, search, and filters by kind, status and whether the cell has a live address. The filters need `assets/hub.js`, which is this site's own plain script; without it every card still shows.
- A page per cell at `/cells/<id>/`: what it does, kind, status, live address, repository, version, licence pointer, how to find it, how to copy it, and how to ask for one like it through https://agenticcells.ai.
- Every cell is marked Demo unless the registry says its status is live. On the copy, only the company site, agenticcells.ai, says live.
- No prices anywhere. Consultancy and the four ways to start are linked to https://agenticcells.ai, not described here.
- Versions are the registry's `version_seen`, dated. They are not live readings.
- Names shown are the hub's own choice, in `data/cell-names.json`; the registry holds none.

## Screenshots

- Six cells have a live address. Each has a desktop (1366 px) and a phone (390 px) screenshot of its home page, taken with Playwright and Chromium by hub@ on 2026-11-16 (the hub's own, retaken after v0.1.5 went live; times in `data/screenshots.json`), stored as WebP in `assets/shots/`.
- Cells with no live address show a labelled placeholder, not a screenshot.
- To retake: see `data/screenshots.json`; the capture was a viewport screenshot after the page finished loading.

## The excluded client cell

Dinis excluded one client cell (2026-11-16). It is not in the registry and is never listed, linked or named by this hub. `build/check-excluded.mjs` fails the build, and so the release, if its subdomain or repository name appears in any file git knows about or in the built site; the pattern is built from parts and is not printed. The registry copy had its `_decision` field removed because that field quoted a sentence naming the cell. Earlier commits of this repository (before 2026-11-16 evening) mention it in `REALITY.md` and the activity log; history was not rewritten.

## Deployment

- https://hub.agenticcells.site serves from GitHub Pages via `.github/workflows/pages.yml`; every push to dev deploys it and CI sets the next v0.1.N.
- Settings (Pages source, custom domain, environment) stay with Dinis. This session changed none of them.
- The earlier consent records and the "coming" example were removed: the orange grower is now a registry entry marked demo and made-up.
