# REALITY.md: what is true of this repository, 2026-11-19

A thing not written here does not exist. Kept by hub.b@AgentiCCells.dinis from 2026-11-19; earlier entries were written by hub@AgentiCCells.dinis on the old account (it left no hand-over here).

## What the hub is (Explore, 2026-11-19)

On Dinis's word in the hub.b session (2026-11-19 ~03:05 UTC): "Ok, can you make sure that all sites (apart from sites that I explicit say should not be there, like [the excluded client cell]) are on the hub? Also can you make it a mix of GitHub/GitLab and community driven sites like HuggingFace or MidJourney", then "Basically this is the site I should be able to go to see the latest ACC.site sites, or by topic, feature or capability".

- **44 cells** are listed: the 20 entries of the registry copy and 24 sites from the site factory's records. 42 have a live address; all 42 answered on 2026-11-19 ~03:10 UTC.
- **Where the list comes from** (`build/cells.mjs`, no database):
  - `data/cells-registry.json`: verbatim copy of conductor@'s registry (AgentiCCells__Website commit 12afa0c, copied 2026-11-16). Its keeper, conductor@ on the old account, is gone, and the registry file on that repository's dev branch has unresolved merge-conflict markers (seen 2026-11-19 02:56 UTC). Who keeps it now is an open question for Dinis.
  - `data/factory-sites.json`: the factory's own records, one entry per request (`requests/*/site.json` and `status.json` in AgentiCCells__Site__Factory), copied by `build/import-factory.mjs` from factory commit f6b4e0851b4a (2026-11-19 03:06 UTC). Every request that is live and public is listed. This is the hub's half of FAC-008; the factory does not yet publish a `sites.json`, so the copy is refreshed by running the script and releasing.
  - `data/hub-listing.json`: Dinis's decision, the exclusions, which factory request is the same cell as a registry entry (the registry wins), three newer facts (the email cell and the two factory test runs now have live addresses), and the hub's grouping: collection, topics, capabilities.
- **Excluded**: the one client cell Dinis excluded on 2026-11-16 (never listed, linked or named; `build/check-excluded.mjs` fails the build if it is); `vicky-wang`, withdrawn (Dinis deleted its repository and DNS; the address does not answer).
- **Consent**: every factory request that names a person or a company records in its brief that they agreed, before it was filed (checked by hub.b on 2026-11-19 for marc-noah, indi-gupte, mondweep-chakravorty, sustain-nobility; the registry records it for jose-bota, silvio-switha, yiheng-wang).
- **Explore** (home page): search; collections; a "Newest sites" strip (by the date the factory made them); a gallery of screenshots, latest update first; filters by collection, topic, capability, feature, owner and status (`assets/hub.js`; without it every card still shows, newest first); sort by latest update, newest site or name.
- **Browse** pages that work without JavaScript: `/browse/`, `/collections/<c>/`, `/topics/<t>/`, `/capabilities/<k>/`, `/features/<f>/`.
- **Cell pages** look like a code host: owner / repository, Open the site, Repository, Fork; an About panel with topics, capability, features, version, last build, commit and the factory request; screenshots; the five ways to make it yours; how to copy it.
- **Latest update** is the `built` time in each live site's own `/version.json`, read when the hub is built. Nothing rebuilds the hub on a schedule, so it is as fresh as the last release.
- **Topics and capabilities** are the hub's reading of each site's own description. **Features** are checked on each live home page by `build/probe-sites.mjs` (llms.txt, two or more designs under /d/, a Portuguese version, a link-preview image), stored with the time in `data/site-features.json`.
- **First page only**: cyber-demo, events-demo and openrouter-evals still show the factory's first page (seen in the screenshots of 2026-11-19); their pages say so.
- No stars, likes or download counts: the hub collects none, and the validator fails a cell page that shows one.
- Statuses: every factory site is Demo; the registry's statuses stand for its entries. No prices anywhere.

## Screenshots

- All 42 live addresses were photographed on 2026-11-19 ~03:10 UTC at 1366x768 and 390x844 (`build/shots/take.mjs`, Playwright and Chromium), turned into WebP, a 720x405 card image and a 1200x630 link-preview image (`build/shots/finish.py`). Times and versions at capture are in `data/screenshots.json`. Gabriel DaCruz's five extra design screenshots from 2026-11-18 are kept.
- Cells with no live address (site factory, site template) show a labelled placeholder.

## Contact address

- The footer's contact address is no longer in the repository: the build reads it from the repository variable `HUB_CONTACT` (set in GitHub, Settings, Secrets and variables, Actions, Variables). Until a person sets it, the footer says "Contact: through agenticcells.ai". Changed 2026-11-19 because the session's privacy check refuses to run a script that holds the account's address.

## Signing

- hub.b signs every commit as a git SSH signature with its own key (signing fingerprint sha256:bdbf0c5189de2f3a); the public bundle is in `team/keys.json`. Commits before 2026-11-19 are unsigned.

## Five ways to make a cell yours (from Dinis's article "Fork it", 2026-11-16)

- Fork on GitHub and Ask us are links; Deploy in one click, Run in your assistant and Take it as a vault are marked Planned on every page, and the validator fails a page that names a deploy service or does not mark exactly three as planned. The fork link is the standard GitHub address, not a checked one; it works for public repositories only.

## Name and mark

- Wordmark "hub.AgentiCCells.site" and the ACC mark with arcs, as decided 2026-11-16 (see git history of this file for the full record, including the open question on the mark).

## Deployment

- https://hub.agenticcells.site serves from GitHub Pages via `.github/workflows/pages.yml`; every push to dev deploys it and CI sets the next v0.1.N. Settings (Pages source, custom domain, environment, variables) stay with Dinis.
- Earlier commits of this repository (before 2026-11-16 evening) mention the excluded client cell in `REALITY.md` and the activity log; history was not rewritten.
