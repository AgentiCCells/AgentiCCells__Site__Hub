# REALITY.md: what is true of this repository, 2026-11-16

A thing not written here does not exist.

## What the hub is

- A catalogue of the cells AgentiCCells has made, built from `data/cells-registry.json`: a copy of conductor@'s registry in AgentiCCells__Website (branch dev), copied 2026-11-16, registry checked 2026-11-16 18:10 UTC. Source and date: `data/cells-registry.source.json`. The copy is verbatim (refreshed 2026-11-16 after conductor@ removed the excluded cell's name from the registry).
- Home page (v0.1.8, after reviewer@'s review): cards for the six cells with a live address and screenshot, in the order riskmandate, orange grower, Gabriel DaCruz, company site, agenticcells.site, hub; then compact rows for parts (site factory, site template) and for proposed cells (email and six specialists); the two factory test runs sit in a closed "Parts and tests" section that opens when a search or filter matches. Search, and filters (behind a Filters button on a phone) by kind, status and address. Thumbnails are a crop of the top 1100 x 480 px of each 1366 px screenshot.
- Statuses are the registry's: live, demo, proposed, test (meanings in its _statuses field). Only proposed and test are not called Demo.
- Versions on cards and pages are read from each live address's own /version.json when the hub is built (date shown on the cell page); the registry value is the fallback. A version is only as fresh as the last release of the hub: nothing rebuilds it on a schedule. The filters need `assets/hub.js`, which is this site's own plain script; without it every card still shows.
- A page per cell at `/cells/<id>/`: what it does, kind, status, live address, repository, version, licence pointer, how to find it, how to copy it, and how to ask for one like it through https://agenticcells.ai.
- Every cell is marked Demo unless the registry says its status is live. On the copy, only the company site, agenticcells.ai, says live.
- No prices anywhere. Consultancy and the four ways to start are linked to https://agenticcells.ai, not described here.
- Versions are the registry's `version_seen`, dated. They are not live readings.
- Names shown are the hub's own choice, in `data/cell-names.json`; the registry holds none.

## Five ways to make a cell yours (from Dinis's article "Fork it", 2026-11-16)

- Every cell page shows five rows. Fork on GitHub (the standard `<repository>/fork` link) and Ask us (https://agenticcells.ai/website-cell/) are links. I could not test the fork link from here (github.com refused unauthenticated requests through the proxy), so it is the standard GitHub address, not a checked one; it works for public repositories only.
- Deploy in one click, Run in your assistant and Take it as a vault are marked Planned on every page. No such button or download exists, and the validator fails the build if a deploy service is named on a cell page or a page does not mark exactly three as planned.
- Paths (start here, then fork that, then add this cell) are planned, not built: only a Paths paragraph on /publish/ says so.
- The cells are not fork-ready for strangers yet (the article says so of the site template); each fork row says to expect changes.

## Screenshots

- Six cells have a live address. Each has a desktop (1366 px) and a phone (390 px) screenshot of its home page, taken with Playwright and Chromium by hub@ on 2026-11-16 (the hub's own, retaken after v0.1.5 went live; times in `data/screenshots.json`), stored as WebP in `assets/shots/`.
- Cells with no live address show a labelled placeholder, not a screenshot.
- To retake: see `data/screenshots.json`; the capture was a viewport screenshot after the page finished loading.

## The excluded client cell

Dinis excluded one client cell (2026-11-16). It is not in the registry and is never listed, linked or named by this hub. `build/check-excluded.mjs` fails the build, and so the release, if its subdomain or repository name appears in any file git knows about or in the built site; the pattern is built from parts and is not printed.  Earlier commits of this repository (before 2026-11-16 evening) mention it in `REALITY.md` and the activity log; history was not rewritten.

## Deployment

- https://hub.agenticcells.site serves from GitHub Pages via `.github/workflows/pages.yml`; every push to dev deploys it and CI sets the next v0.1.N.
- Settings (Pages source, custom domain, environment) stay with Dinis. This session changed none of them.
- The earlier consent records and the "coming" example were removed: the orange grower is now a registry entry marked demo and made-up.
