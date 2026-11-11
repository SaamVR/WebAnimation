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
- A one-use session ticket matches the destination path AND query string. The build inserts an inline prepaint cover into all 20 current HTML entrypoints, stopping white flashes while the next document initializes.
- The incoming document uses the full-cover SVG until its actual application shell is mounted. Artist's Edit also waits for its asynchronous worktable ready status. The reveal takes ~385 ms and softly reduces final opacity.
- Programmed animation time: 790 ms, plus real network/page readiness. There are no fake percentages, generic spinners, or intentional multi-second waits.
- Reduced motion takes ordinary native navigation without any C02 overlay.
- The modern cross-document View Transition API is an enhancement in supported browsers; the manual cover/reveal session-ticket flow is the fallback for older browsers including WebKit variants.
- Browser Back/Forward uses native history. Session ticket is one-use. BFCache events clean stale overlays. The prepaint cover has an 18-second failure-only guard; the outgoing overlay a 13-second failure-only guard.

## Protected systems and source boundary

The C01 service animation, C08 roller-wordmark Lottie, Compact and Long *unnumbered* SVG button components, original Add-to-Bag ink confirmation, sticky navbar, garment assets, and front/back illustrated worktable source are unchanged. The small addition to the build script is after the original source copy and before the existing version-stamped Artist's Edit release step.

## Verification and acceptance gate

- Five focused Node unit tests PASS (original roller SHA and paths, navigation scope and exclusions, geometry, early cover).
- Direct build PASS (20 HTML entrypoints, exact original artwork archive and 43 delivery layers, original Long SVG artwork).
- Chromium/WebKit desktop, iPad-size and mobile acceptance, slow-loading/failed-resource demonstrations and recorded visuals must be separately verified. Do not call a static test a passing browser test.
- A browser viewport simulator is NOT a physical iPad test.
- Owner must approve motion shape, timings, ink edge, roller scale/orientation and visual continuity before this module can be marked creatively complete.

## Run locally

1. cd projects/chapchitra
2. npm ci
3. node --test tests/c02-ink-sweep.test.mjs
4. node scripts/build.mjs
5. Set PORT=4272 and run npm run preview, then click ordinary internal page links.

**Release gate: draft PR only; no production merge or shared Render deployment.**
