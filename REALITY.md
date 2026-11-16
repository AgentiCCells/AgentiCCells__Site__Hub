# REALITY.md: what is true of this repository, 2026-11-15

A thing not written here does not exist.

- The source builds to `site/` and passes the validator and the leak scan locally. It has an index, a page explaining how to publish and copy, and one listed site page.
- Listed: AgentiCCells' own site (agenticcells.ai), by its owner's consent. Nothing else is listed. Dinis's newsroom demo vaults are not listed yet: that needs their pages and Dinis's go-ahead for this hub.
- Coming: one made-up example, the Algarve orange grower, marked as such.
- No sgit vaults exist for any listed site, so none is shown. No search, screenshots or kinds.
- Deployed: v0.1.1 serves https://hub.agenticcells.site/ (reviewer@, 2026-11-16: https answers, http redirects). A release on 2026-11-16 (reviewer's fixes) is the next version.
- Header: short nav labels ("Sites", "Publish or copy"), the teal "C" mark and the script-free Menu, all taken from agenticcells.ai's template (AgentiCCells__Website, dev, 2026-11-16).
- "Listed now" cards show address, licence and version. The version is read from the site's own version.json when the page is built; if it cannot be read, the card says so. It is a build-time snapshot, not live.
- Footer links to agenticcells.ai and agenticcells.site.

## Deployment

The earlier HTTPS certificate problem (2026-11-15) is gone: https works. Settings stay with Dinis: Pages source GitHub Actions, custom domain hub.agenticcells.site, and the github-pages environment allowing dev. This session changed none of them.
