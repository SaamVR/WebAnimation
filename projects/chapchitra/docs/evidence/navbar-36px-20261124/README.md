# CHAPCHITRA — 36px Dark Navbar Circle QA

**OWNER VISUAL APPROVAL REQUIRED — DO NOT MERGE OR DEPLOY.**

Source branch: `fix/chapchitra-dark-navbar-36px-20261124`  
Exact implementation HEAD: `43ec434de1d5ca3f14d6641a95e5b562acc25ab3`  
Unchanged shared staging HEAD: `36adff3c1c66f6ca169aaf92fd9fb6b8b6053482`  
Staging: https://chapchitra-webanimation.onrender.com/

## Correction
- Dark Search, Favorites, Account and Bag have **36 × 36px visible Cream discs** using the existing `var(--color-cream)` (`#F4EBE4`) token.
- Four existing interactive controls retain independent **44 × 44px hitboxes**; decorative pseudo-elements have `pointer-events:none`.
- All original owner SVG paths, strokes, paints and proportions untouched. Icon alignment remains centered. Bag badge, hover, sticky header and light theme preserved.
- Action gaps match the light-mode responsive geometry: **5px above 600px**, **0px at 431–600px**; this eliminates the original 12px/10px horizontal toggle jump without changing any illustrated-toggle code or artwork.
- No SVGs, C-series motion, global palette, production/main or deployment configuration changed.

## Actual-browser evidence — candidate CSS only, NOT deployed
- Chromium desktop: 1920/1440/1366; WebKit 834px tablet; responsive 600/431; Chromium mobile 390/320; WebKit mobile 390; light/dark variants.
- **158/158 assertions PASS across 12 profiles**, including measured disc/hitbox diameters, SVG loading, icon centering, toggle position, mobile visibility, zero overflow, hover and sticky navbar.
- **314/314 native Node tests PASS**, and `node scripts/build.mjs` PASS, after normalizing an isolated Windows checkout to the original Git LF bytes (unaltered asset checksums).
- An additional **10/10 interaction checks PASS**, covering desktop and mobile Search open/close, Bag, Favorites and Account navigation. See `navigation-interaction-qa.json`.
- `browser-qa-report.json` records computed dimensions and individual checks.
- PNG evidence captured from real browsers at **2× device pixel ratio**, while preserving actual CSS layout dimensions. Compare `baseline-current-staging-44px-closeup.png` against `chromium-1920-dark-closeup.png`. Additional full navbar desktop, WebKit tablet, 600/431 breakpoint and 390/320 mobile screenshots included.

**Limit:** The separately described owner-annotated screenshot was not accessible in the current conversation files; therefore no pixel-exact comparison to that annotation is claimed. Existing deployed 44px styling is the baseline reference.

Keep independent C08 cloth-loading PR #151 untouched. Await owner visual approval before any shared-staging integration.
