# CHAPCHITRA Artist's Edit — A4 / Compact flip visual evidence

**Scope:** Control visual refinement only. The A3/A4 geometry and pointer/keyboard algorithms remain unchanged.

## Captured frames

- [Desktop Chromium front](desktop-front.svg) — 1440×900 browser viewport (captured at 2× and scaled for review).
- [iPad-sized WebKit front](ipad-front.svg) — 834×1112 browser viewport, A4 move SVG and compact View back.
- [iPad-sized WebKit back](ipad-back.svg) — same viewport after garment flip, compact View front.

The SVG files above contain **faithful JPEG captures from actual automated browser screenshots**, embedded for portable GitHub review. No generative/redrawn illustration is used.

## Test matrix

- Dedicated renderer browser QA: **41 passed / 0 failed**, no page errors, no failed HTTP responses.
- Desktop Chromium, WebKit iPad-sized viewport, mobile Chromium. Tests include actual A4 pointer drag, fixed 44px handle, four-direction SVG shape, approved compact SVG hydration, accessible front/back flip, selected A4 containment within A3, and uploaded artwork preservation.
- Native Node regression tests: `tests/worktable-control-refinement.test.mjs` plus the existing repository test suite.
- Both modified source assets (`src/worktable-studio.mjs`, `src/worktable-studio.css`) were substituted into the existing Render site by Playwright route interception **before staging promotion**. All other application assets/code were from the verified existing staging. These are authentic candidate-code QA captures, **not claims of an already published staging revision**.
- A later post-merge GitHub Actions gate and Render commit verification establish deployment separately.
- **Physical iPad Safari hardware not tested**; automated WebKit is not a substitute.

## Preservation rules

No modifications to `worktable-print-placement.mjs`, its tests, A3/A4 geometry, C02 motion, garments, pricing, invoice or Total tag. The Compact SVG original asset, runtime and global shared CSS are unchanged.
