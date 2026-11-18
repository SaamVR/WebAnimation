# ZESTRY F01 — Broth Visibility Regression, Root Cause and Corrective Release

**Date:** 18 November 2026  
**Target:** Existing Render service `srv-dbtkitifngtc73bpc8f0` (NOTE: service ID corrected below)  
**Actual service:** `srv-dbtkitifngtc73cua2p0`  
**Scope:** `projects/restaurant-demo/` only; F01 artwork, choreography and all other animations unchanged.

## Root cause — proven in a real browser

The F01 Lottie JSON contains the original vector Broth layer (`ind=28`) and an animated rising liquid-fill mask (frames 138–150). The runtime also sets `broth.hasMask=true` before loading. Therefore, the disappearance was **not missing artwork or deleted keyframes**.

The website clones the entire animated SVG `defs` into a separate wood-tabletop SVG, then inserts that SVG before the foreground. That duplicates the source ids `__lottie_element_2`, `__lottie_element_7`, and notably **`__lottie_element_88`**, which the broth foreground references via `clip-path="url(#__lottie_element_88)"`.

Duplicate IDs in one document make fragment references ambiguous and can resolve the foreground clip against the background SVG's definitions. The BROTH_ROOT_CAUSE_PROBE showed no broth contribution at the final frame. A separate controlled on-live-assets browser preview showed the original was either invisible or severely clipped, while unique IDs restored the correct broth without changing F01 source.

## Narrow fix

When creating the cloned wood-background SVG, assign a `zestry-wood-` namespace to **only** cloned element IDs and rewrite local `url(#id)` and `href="#id"` references. Leave the **original foreground** SVG's IDs and animated masks exactly as authored.

The original wood vector is retained; the fixed 1.755x foreground animation, circle size, yellow accent, ingredient trajectories, all Lottie keyframes/timing and F02–F07 functionality are not changed. The source F01, derived F01 V16, F03, F04 SHA256 fingerprints are checked at packaging and QA.

## Predeployment Chromium acceptance

Rebuilt the actual ZESTRY Render ZIP, served it locally, and measured the broth layer's *visible pixel contribution* (difference with only that layer hidden) in the hero at real frames.

| Frame | Desktop broth pixels | Mobile broth pixels |
| --- | ---: | ---: |
| 0 | 0 | 0 |
| 142 | 27,010 | 6,106 |
| 149 | 73,018 | 16,361 |
| 160 | 55,659 | 12,559 |
| 225 | 30,784 | 7,086 |
| 260 — final hold | **30,784** | **7,086** |

- **0 duplicated element IDs** at every sampled frame and viewport.
- **1.755x foreground fixed scale** throughout.
- Original wood backdrop remains; no horizontal overflow or JavaScript exceptions.
- Screenshot evidence, before-deploy JSON report and source-level QA script are available beside this README.
- Controlled live-asset browser proof: `https://github.com/SaamVR/WebAnimation/actions/runs/44267755422`.
- Predeployment rebuilt-ZIP proof: `https://github.com/SaamVR/WebAnimation/actions/runs/44268238542`.

## Release gate

Do not mark this fix as fully delivered until the existing Render service serves the exact new merged SHA and a live native-browser test proves broth visible at frame 260. Do not create a new service or modify CHAPCHITRA/THREADS. F01 must hold its final frame and must not zoom. 
