# REALITY.md: what is true of this repository, 2026-11-16

A thing not written here does not exist.

## What the hub is

- A catalogue of the cells AgentiCCells has made, built from `data/cells-registry.json`: a copy of conductor@'s registry in AgentiCCells__Website (branch dev), copied 2026-11-16, registry checked 2026-11-16 18:10 UTC. Source and date: `data/cells-registry.source.json`. The copy is verbatim (refreshed 2026-11-16 after conductor@ removed the excluded cell's name from the registry).
- Home page (v0.1.14): cards for the 15 cells with a live address and screenshot (riskmandate, orange grower, Gabriel DaCruz, company site, agenticcells.site, hub first, then the three new personal sites and the six specialist sites); then compact rows for parts (site factory, site template) and for the one proposed cell (email); the two factory test runs sit in a closed "Parts and tests" section that opens when a search or filter matches. Search, and filters (behind a Filters button on a phone) by kind, status and address. Thumbnails are a crop of the top 1100 x 480 px of each 1366 px screenshot.
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

## Name and mark (v0.1.9)

- On a relayed, cut-off message from Dinis ("the logo should be ACC with ...", relayed by cells@, 2026-11-16 ~21:30 UTC) the header mark is now "ACC" in a teal rounded box (also the favicon) and the name reads "AgentiCCells.site" with "hub" as a label. This is my reading of a truncated sentence: it needs Dinis's confirmation. No design specialist input had reached this session when it was made; the wider look of the hub is unchanged.

## Design review applied (v0.1.10)

specialist-design@ reviewed v0.1.8 (relayed 2026-11-16 ~21:30 UTC; a proposal, not an instruction). Applied: search and filters on one row from 44 rem, Filters button only below that; card title first with a muted "Kind · Status" line; Live as a filled accent pill; intro capped at the text measure; screenshot edge line; dimmed screenshots in dark mode; the repeated sentence dropped from the Proposed rows. Not applied: the arc-style mark (it resembles the Creative Commons symbol; waits for Dinis's answer, so the header keeps the plain letters ACC in a square tile), phone cards as rows, footer contact.
- The registry still lists the design and UX specialists as proposed; the review says they are live sites now. The registry is conductor@'s to update.

## Wordmark and mark (v0.1.13)

- Wordmark: "hub.AgentiCCells.site", "hub." regular and muted, the rest bold (Dinis's choice B, "I like", relayed by cells@, ~21:38 UTC).
- Mark: an A and two open arcs ("ACC with today's arcs", option 2 by specialist-design@, CC BY 4.0), as header mark and favicon. The Creative Commons trademark question (researcher@ S4, designer@ D7) had no answer until cells@ asked Dinis, ~22:45 UTC, "Ship the mark now (you accept the risk, or judge that the A and the arcs keep it clearly apart from the Creative Commons logo), or ship the wordmark only for now?" and relayed his answer: "yes and also continue with the hub work". The question offered two choices, so "yes" is ambiguous; cells@ and I read it as yes to shipping the mark. Dinis has not been asked directly by me. If he meant the wordmark only, the previous header (plain letters ACC in a square tile) is in the v0.1.11 commit and can be restored.

## Gabriel DaCruz entry (v0.1.12)

On a request from site@AgentiCCells.gabriel-dacruz (Dinis's go, relayed by cells@, 2026-11-16 ~21:40 UTC): name "Gabriel DaCruz"; the longer description is in `data/cell-text.json` (it replaces the registry's short line on the hub; the registry copy stays verbatim, so conductor@'s registry still holds the old line). Screenshots of three designs (The Studio at /, The Score at /d/score/, The Signal Chain at /d/signal/) at 1366 and 390 px, taken 2026-11-16 ~22:45 UTC when the live site was v0.1.6, replace the older home-page shots. I could not read the repository's hub.json (github.com is refused from here, and the live site serves none at /hub.json); the text is as the site's agent gave it. No audience numbers.

## Registry refresh (v0.1.14)

Copy now pinned to commit 12afa0c of AgentiCCells__Website (the dev address still served the old 17-entry file): 20 entries. New: Yiheng Wang, Silvio Switha and José Bota personal sites, each with a consent line in the registry (Dinis, relayed by cells@, ~22:45 UTC; this hub did not check it). The six specialists are now demos with live addresses. Nine new cells have 1366 and 390 px screenshots taken 2026-11-16 ~22:55 UTC. Their live home pages were checked for the excluded client cell's name: none.

## Screenshots

- Fifteen cells have a live address (six at first, nine added in v0.1.14). Each has a desktop (1366 px) and a phone (390 px) screenshot of its home page, taken with Playwright and Chromium by hub@ on 2026-11-16 (the hub's own, retaken after v0.1.5 went live; times in `data/screenshots.json`), stored as WebP in `assets/shots/`.
- Cells with no live address show a labelled placeholder, not a screenshot.
- To retake: see `data/screenshots.json`; the capture was a viewport screenshot after the page finished loading.

## The excluded client cell

Dinis excluded one client cell (2026-11-16). It is not in the registry and is never listed, linked or named by this hub. `build/check-excluded.mjs` fails the build, and so the release, if its subdomain or repository name appears in any file git knows about or in the built site; the pattern is built from parts and is not printed.  Earlier commits of this repository (before 2026-11-16 evening) mention it in `REALITY.md` and the activity log; history was not rewritten.

## Deployment

- https://hub.agenticcells.site serves from GitHub Pages via `.github/workflows/pages.yml`; every push to dev deploys it and CI sets the next v0.1.N.
- Settings (Pages source, custom domain, environment) stay with Dinis. This session changed none of them.
- The earlier consent records and the "coming" example were removed: the orange grower is now a registry entry marked demo and made-up.
