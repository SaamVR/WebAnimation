# THREADS T01 — Cinematic spotlight search, verified browser checkpoint

**Scope:** `SaamVR/WebAnimation`, standalone static Threads demo only.
**Base:** 2026-10-18 preview SHA `5f4ba99d0cc48859e9f058db13e61d3fa80386d6` (39 products, 119 Batch 2 gallery alternates).
**T02, T03, T04:** Unmodified. `SaamVR/EcomCMS`: Unmodified.

## Implementation

- Existing left-expanding header search preserved; width/opacity timing refined to 300/250 ms. Icon X/Y remains fixed while the input expands leftward.
- Header Enter navigates to `/search/?q=` with the query preserved. Existing catalog search is the only source of results and all result cards retain normal product links.
- `site/threads/t01-spotlight.mjs`: separate aria-hidden pointer-transparent fixed SVG/DOM actor, locally vendored **GSAP 3.14.2 + MotionPathPlugin**. Curved motion paths depart from measured real search-icon geometry, scan up to 2 other visible real cards (1 on mobile), discover a deterministic best-scored visible match, and return along a different path.
- Warm-gold radial lighting and viewport-sized mask briefly subdue surrounding content, while the chosen card lifts ~3.5%. Header icon and normal card styles restore fully after the sequence.
- Geometry comes from `getBoundingClientRect` after results render and double RAF; resize, scroll, route/pagehide, visibility change, and new searches terminate the timeline and clear the layer.
- **Important interruption fix:** the active sequence is detached before `timeline.kill()` so the synchronous GSAP onInterrupt callback cannot recursively tear down and leave an orphaned overlay.
- `prefers-reduced-motion:reduce` shows an outline around a real relevant card rather than animated travel; empty searches have no animation.
- Spotlight does **not** shrink product photos, mutate the cart, or implement payment motions. Search results keep `data-t01-card` hooks for future refinement; `data-t02-*` and `data-t04-*` remain intact.
- All GSAP assets are vendored under `site/threads/vendor/` to avoid external playback-time network dependencies.

## Verified before live promotion

- `node --test ...`: **36 passed, 0 failed**, covering legacy layout, Batch 1 covers, Batch 2 gallery manifest and T01 contracts.
- Chromium desktop (1440×900): header icon remains anchored, expanded input focused, real **Backpack** query returns 4 cards; magnifying glass appears, scans and highlights genuine `bag-01`, returns and removes overlay; no browser script errors.
- Chromium mobile (390×844): same route works with shorter scan count, correct header input expansion and no layout shift.
- **Rapid query changes:** Cap → Backpack → Vintage Sneakers while motion is running leaves only the latest real results and at most one animated layer. Completed timeline clears, no stuck icon or overlay.
- **Interactive results:** clicking `bag-01` while T01 is in flight navigates to the product detail page and loads its real image.
- **Escape:** closes inline header search and restores keyboard focus to the header search button.
- Reduced-motion: real Cap result briefly outlined; **no animated layer**. Empty query result: **no invented product or animation**.
- Authored timeline ~3.87s at GSAP `timeScale(1.16)` = ~3.34s on desktop; mobile scans fewer cards.
- Visual evidence consists of *actual headless Chromium captures*, not illustration mockups. The MP4 is assembled from sequential browser screenshot frames, so playback has reduced capture frame rate.

## Captures

- [Desktop departure](desktop-departure.png)
- [Desktop mid-scan](desktop-scan.png)
- [Desktop genuine discovery](desktop-discovery.png)
- [Desktop return](desktop-return.png)
- [Mobile discovery](mobile-discovery.png)
- [Desktop browser sequence MP4](desktop-browser-capture.mp4)

## Remaining release distinction

This document initially certifies code-based local Chromium QA. Record a separate actual Render deployment and public-URL browser pass before claiming public T01 readiness. Batch 2 galleries are preserved. Genuine alternative views still missing for older `f1`, `f3`, `f4` products; those pages remain cover-only and functional.


## Live mobile screenshot

[View real browser discovery](mobile-live-discovery-verified.png).
