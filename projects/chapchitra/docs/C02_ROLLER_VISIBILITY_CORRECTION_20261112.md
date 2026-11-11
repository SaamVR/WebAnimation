# CHAPCHITRA C02 — Original Roller Visibility, Direction & Color Correction

**Status:** Technically implemented; creative approval still required. **No merge to main and no shared Render deploy.**

## Exact problem observed

The prior C02 preview combined a `rotate(90deg)` roller orientation, an arbitrary `size*.38` positioning offset, early/late visibility thresholds, and a teardrop-shaped even-odd negative-space aperture. Its graphite handle extended back across the printed ink and the aperture looked like a white roller silhouette.

## Isolated correction

Only `src/motion/c02/ink-sweep.mjs`, `src/motion/c02/ink-shapes.mjs`, their focused tests, and test/evidence tooling change.

- Original roller source **is displayed directly** from `/assets/c02/roller-original.svg`; it is not recolored, regenerated, masked, filtered or converted to a monochrome silhouette.
- Entire image is screen-space horizontally mirrored via `scaleX(-1) rotate(90deg)`. The Press Green cylinder remains perpendicular to the left-to-right ink travel, and the Graphite rod/handle extends **to the right**, into the unprinted page.
- Position is based on the ORIGINAL cylinder's measured Illustrator bounding geometry (Chromium and WebKit `getBBox()` agree): viewBox 1700×1700; cylinder `y=48.7199`, `height=273.2201`, frame extends to `y=1656.8203`. The cylinder's true outer contact is aligned within 2px of the advancing *outer* Forest ink contour, rather than by a center-box guess.
- Wrapper is modestly larger: `clamp(106px,11vw,150px)`. Original aspect ratio and internal artwork are preserved.
- The roller moves at 100% opacity from entry through exit; it no longer waits for `p>.065` and no longer fades out from `p>.92`. It moves naturally offscreen with the expanding edge.
- Native original vector is prewarmed as a 2KB image to avoid a visible late decode. It is isolated at z-index 2, filter none, normal blending.
- Removed `organicWindow()`, the negative-space white oval. The approved main cubic organic sweep, two ink layers, and terracotta edge remain unchanged.

## What remains exactly as before

- Coverage 405 ms; destination reveal 385 ms. No new simulated loading delay in normal navigation.
- Real document/page readiness holds the fully opaque green cover. The 2.2s and 4.5s waits are isolated demo pages only.
- Navigation URL/history, browser Back/Forward, modified-click/download exclusions, keyboard, rapid click, reduced motion, BFCache cleanup.
- C01, C08, Compact & Long unnumbered SVG buttons, Add to Bag ink feedback, navbar/sticky behavior, Artist's Edit front/back worktable and original garments.

## Original source-integrity evidence

- Git blob SHA (unchanged across both the baseline and corrected branch): `5fbbe95db12963aeff01ee89e5c815582e2d4a24`.
- SHA-256: `1c1226b902299ef7519236b582b5012f5ec918aa7571a2f8091a86db95992d73`.
- Exactly 3 original paths. Chromium and WebKit measured cylinder bounds `(x=343.1075, y=48.7199, w=1032.2653, h=273.2201)`; frame bounds `(x=230.6395,y=177.7733,w=1238.7205,h=1479.0470)`.
- SVG colors are unmodified `#293D2D` and `#232323`; browser canvas confirms both original color pixel groups.

## Visual QA and owner acceptance

Reproducible `scripts/c02-roller-visual-qa.cjs`:

- Stages **entrance**, approximately **25%**, **50%**, **75%**, **full cover**, plus the actual slow-loader hold/reveal.
- Compares an earlier published C02 preview with the corrected candidate.
- Audits actual decoded vector colors in browser canvas; CSS image filter/blending; fully rendered roller mid-sweep; true cylinder contact vs organic edge; positive screen-right handle direction.
- Captures normal-speed WebM videos covering Home→Shop, a *simulated* 4.5s loader, and reduced-motion native navigation, on desktop and an iPad-size **simulated** viewport.
- Local visual suite: Chromium 24/24; WebKit desktop 12/12 and tablet 12/12 after moving the WebKit virtual-time before/after screenshots to independent pages. This is browser simulation, **not** physical-iPad evidence.
- Full Linux source/browser CI must independently pass on the final SHA. GitHub Actions workflow uploads before/after PNGs and real-time WebM files for owner download.

Review this subtle real-world visibility point: on dark unprinted hero content, the original `#232323` handle is inherently low contrast. Its fill remains unchanged by design. Decide whether the corrected scale and placement provide sufficient visibility before approval.

**Owner gate:** visually judge colored cylinder visibility, handle direction, organic silhouette and motion flow; do not merge or deploy until accepted.
