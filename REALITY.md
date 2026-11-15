# REALITY.md: what is true of this repository, 2026-11-15

A thing not written here does not exist.

- The source builds to `site/` and passes the validator and the leak scan locally. It has an index, a page explaining how to publish and copy, and one listed site page.
- Listed: AgentiCCells' own site (agenticcells.ai), by its owner's consent. Nothing else is listed. Dinis's newsroom demo vaults are not listed yet: that needs their pages and Dinis's go-ahead for this hub.
- Coming: one made-up example, the Algarve orange grower, marked as such.
- No sgit vaults exist for any listed site, so none is shown. No search, screenshots or kinds.
- Deployed: the first release (v0.1.0, commit 826f02b) built, passed the gates in CI and deployed to GitHub Pages. http://hub.agenticcells.site/ served it on 2026-11-15.
- Not working: https://hub.agenticcells.site/ failed certificate verification on 2026-11-15 (the certificate does not name this host).

## Deployment

Settings only Dinis can change, and which this session did not change:

- On AgentiCCells__Site__Hub, Settings, Pages: source GitHub Actions, custom domain hub.agenticcells.site, and "Enforce HTTPS" once the certificate has been issued. The HTTPS certificate error above suggests the custom domain is not set or its certificate is still being issued. Pages did accept the deploy, so the source is probably set.
- The github-pages environment must allow the dev branch. The first deploy succeeded, so it appears to.
