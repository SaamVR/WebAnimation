# CHAPCHITRA C02 — Custom Ink-Swipe Page Transition & Loader

**Status:** Owner creative review candidate; NOT creatively approved. Do not merge into main or deploy to the shared Render service.
**Branch:** feature/chapchitra-c02-ink-sweep-20261111
**Repository:** SaamVR/WebAnimation, exclusively projects/chapchitra/

## Creative interpretation of the supplied reference

The supplied 26.1066-second video was inspected at 2–3.5s, 12.5–14s and 21–22s. The effect uses broad rounded paint masses, flowing openings, strong full-screen color takeover, short full coverage and an organic clearing reveal.

C02 generates new original cubic Bézier ink contours and a temporary teardrop-like negative opening at runtime. The palette is Press Green #293D2D, Deep Forest #172419 and a subtle Terracotta #8A503B edge. The reference website's bright blue and exact shapes were not copied.

The complete **approved original roller illustration** accompanies the traveling paint boundary. Its entire SVG is displayed in a 90-degree CSS orientation so the cylinder is vertical/perpendicular to horizontal travel. Cylinder and handle path geometry do not rotate relative to one another. The roller is deliberately small, not a dominant page element.

## Exact roller-source audit

- The supplied Roller(1).rar contains ONE Roller.svg (2,162 bytes), with a trimmed 1700×1700 viewBox, ROLLER_CYLINDER, Layer_2 and ROLLER_HANDLE_x2B_ROD. The second separately prepared SVG described in the user brief was not present in this archive.
- Byte-exact master: src/assets/c02/roller-original.svg
- Master SHA-256: 1c1226b902299ef7519236b582b5012f5ec918aa7571a2f8091a86db95992d73
- A derived file at dist/assets/c02/roller-prepared.svg changes ONLY the group label Layer_2 to ROLLER_FRAME; all three original vector paths, coordinates, colors and proportions are preserved.
- scripts/build.mjs verifies the checksum before producing delivery files.

## Navigation and loading architecture

- The site remains a multi-page application (MPA), not a newly invented SPA.
- Eligible ordinary same-origin links between all existing internal pages are intercepted, including Home, Shop, Artist's Edit, Journal, About, product details, favorites, bag, account and related destinations.
- Excludes same-document anchors, external origins, file downloads, other-target links, modified clicks, button-only Add to Bag/Favorite operations, artwork transforms and carousels.
- The outgoing page gets a single SVG overlay. Animated covering stroke: ~405 ms. Its final state is an opaque full-screen painted surface.
- A one-use session ticket matches the destination path AND query string. The build inserts an inline prepaint cover into all 22 current HTML entrypoints, stopping white flashes while the next document initializes.
- The incoming document uses the full-cover SVG until its actual application shell is mounted. Artist's Edit also waits for its asynchronous worktable ready status. The reveal takes ~385 ms and softly reduces final opacity.
- Programmed animation time: 790 ms, plus real network/page readiness. There are no fake percentages, generic spinners, or intentional multi-second waits. A faint, slowly breathing ink-pressure shading appears only while genuinely covered and loading, with no roller replay or progress indication.
- Reduced motion takes ordinary native navigation without any C02 overlay.
- Native cross-document View Transitions were evaluated but **automatic snapshot transitions are intentionally disabled** for this review candidate: Linux Chromium QA stranded the outgoing overlay during snapshot handoff. The tested first-paint cover, one-use ticket and manual SVG wipe now provide the same branded motion across Chromium and WebKit. The native feature is not needed for reliable operation.
- Browser Back/Forward uses native history. Session ticket is one-use. BFCache events clean stale overlays. The prepaint cover has an 18-second failure-only guard; the outgoing overlay a 13-second failure-only guard; each animation has a bounded RAF completion fallback so no browser can strand an ink screen.

## Protected systems and source boundary

The C01 service animation, C08 roller-wordmark Lottie, Compact and Long *unnumbered* SVG button components, original Add-to-Bag ink confirmation, sticky navbar, garment assets, and front/back illustrated worktable source are unchanged. The small addition to the build script is after the original source copy and before the existing version-stamped Artist's Edit release step.

## Verification and acceptance gate

- Five focused Node unit tests PASS (original roller SHA and paths, navigation scope and exclusions, geometry, early cover).
- Direct build PASS (22 HTML entrypoints, exact original artwork archive and 43 delivery layers, original Long SVG artwork).
- Linux GitHub Actions run #43092930056 passed ALL THREE jobs: source-integrity, Chromium and WebKit. Each browser engine passed 42/42 desktop, tablet-size and mobile navigation checks (84 total), plus 2/2 slow loader and reduced-motion scenarios on each desktop/tablet simulation (8 more, 92 total). This is evidence for source revision d62ccab; the subsequent ink-breathing style change is limited to the fully covered loader. Review captures are retained as Actions artifacts, not embedded in the public site.
- A browser viewport simulator is NOT a physical iPad test.
- Owner must approve motion shape, timings, ink edge, roller scale/orientation and visual continuity before this module can be marked creatively complete.

## Owner preview and recorded acceptance

- [C02 draft PR #81](https://github.com/SaamVR/WebAnimation/pull/81)
- [Linux CI #43092930056 — Chromium/WebKit source and browser acceptance](https://github.com/SaamVR/WebAnimation/actions/runs/43092930056)
- [Chrome/Chromium original browser videos, tablet/mobile, slow-loading/reduced-motion captures](https://github.com/SaamVR/WebAnimation/actions/runs/43092930056/artifacts/13889911810)
- [WebKit (simulated iPad-size) original browser videos, loader and reduced-motion captures](https://github.com/SaamVR/WebAnimation/actions/runs/43092930056/artifacts/13889976080)
- Browser artifacts have 30-day retention; physical iPad hardware QA remains open.
- Independent visual QA has reviewed actual full-coverage and destination reveal screenshots, along with organic ink edge and small exact-source roller motion frames. **The owner must still decide** whether the temporary aperture and fluid silhouette are expressive enough compared with the reference; this work is not creatively accepted.

## Run locally

1. cd projects/chapchitra
2. npm ci
3. node --test tests/c02-ink-sweep.test.mjs
4. node scripts/build.mjs
5. Set PORT=4272 and run npm run preview, then click ordinary internal page links.

**Release gate: draft PR only; no production merge or shared Render deployment.**
