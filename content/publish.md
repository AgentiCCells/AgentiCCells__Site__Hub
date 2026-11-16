---
title: Publish a site to the hub, or copy one
description: How a site gets listed on the AgentiCCells hub with a hub.json file, how its owner asks to leave, and how to copy a listed site.
nav: 2
navlabel: Publish or copy
---
# Publish a site to the hub, or copy one

The hub is a list of agentic sites. It has no database. Each site carries a small file called `hub.json`, the hub keeps a copy of that file in its registry, and every page here is generated from those copies.

## Publish a site

1. **Own the site.** The owner of a site decides whether it is listed. Nothing is listed without the owner's consent, and the hub records the date of that consent.
2. **Add a hub.json to the site's repository.** Put it at the root. It holds the name, what the site does, the owner, the team, the live address, the repository, the licence and the address of the file that tells the site's version.
3. **Say you agree.** Ask the hub's team to list the site. Today that means asking Dinis Cruz; the hub's team does not contact anyone and does not list a site on its own.
4. **The hub copies the file.** The copy goes into `registry/` in the hub's repository with the date it was copied and the date of consent. The next build makes a page at `/<owner>/<site>/`.
5. **Leave when you want.** The owner asks, and the entry is removed in the next release. Past versions of the hub stay in the repository's history, as every version does.

## What hub.json holds

- **Required:** `name`, `what_it_does`, `owner`, `team`, `live_address`, `repository`, `licence` and `version_from`.
- **Later:** vault fields, once a site has an sgit vault. The hub does not show a vault until its owner gives one. It never stores a vault key.
- **Not allowed:** passwords, tokens or keys of any kind.

## Copy a site

1. Open the site's page on the hub and follow its repository link.
2. Check its licence. A site marked as a template says what you may change; for any other site, the licence is the rule.
3. Copy the repository with `git clone`, or use the GitHub button "Use this template" where the owner has set it up.
4. Change the text, the pictures and the address. Keep the licence notice and say where the site came from.
5. Add your own `hub.json` if you want to be listed, as above.

Sites are static files, so a copy opens locally without a server.

## What is true today

- **Listed:** AgentiCCells' own site, with its owner's consent.
- **Coming:** made-up examples, marked as such on the front page.
- **No vaults yet:** the sgit vault for each site does not exist, so no site shows one.
- **No screenshots, search or kinds yet.** They are ideas in the founding article, not features.
