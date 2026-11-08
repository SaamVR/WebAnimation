# CHAPCHITRA C01 — Owner-requested wide spacing correction (Nov 8, 2026)

**Scope:** only C01 layout CSS and dynamic connector re-registration when viewport width changes. All original Lottie JSON assets, names, subtitles, reference sequence, durations and 10.27s timeline remain byte-identical. Neither Artist's Edit nor other homepage sections or sites are modified.

## Problem and solution

Owner-provided iPad screenshot / 12.7s playback showed the four C01 icons in a centered 910px container, leaving excessive empty margins. The homepage already has an approved 1160px maximum `.wrap` content width. Remove C01's extra 910px cap and give the first/fourth circles an equal outward offset while proportionally distributing second/third icons. Move the icon and copy children only — **never the grid cell itself**, to avoid a 1194px horizontal scrolling regression. Keep the standard site gutters and exact 72px desktop icons. The 680px and lower vertical mobile layout is unchanged.

Resize events now always update the existing connector-path geometry, including when the parent `.wrap` width is capped but the responsive offset still changes. This does not modify the shared playback clock, Lottie keyframes or connector animation timing.

## Browser measurements

| Viewport | Before icon 1→4 | Corrected icon 1→4 | Outer text margins | Connector length |
|---|---:|---:|---:|---:|
| 1408px desktop / owner screenshot | 696px | 1012px (+45%) | 103px each | 257px each |
| 1194px iPad landscape CSS width | 696px (old capped layout) | 943px | 30px each | ~234px each |
| 834px tablet | 609px | 609px (preserved) | 20px each | ~123px each |
| 430px mobile | vertical | vertical unchanged | responsive | existing vertical alignment |

**QA:** 98/98 repository source tests passed (Node 22); targeted real Chromium and Linux WebKit checks of 1408/1280px both confirm 4 original Lottie SVGs, three longer registered connector paths, symmetric margins and no horizontal overflow. Chromium also verified 1194/1024/834/680/430px, including the formerly overflowing 1194px breakpoint. Separate video demonstrates actual synchronized Lottie playback, not a recreated animation.

**Visual evidence:** `docs/c01-evidence/c01-wide-1408.png`, `c01-wide-1194.png`, `c01-wide-430.png` and `c01-wide-synchronized-lottie.webm`. Local screenshots and video were captured from the new layout before deployment.

**Performance:** No new requests, dependencies, images, videos in the deployed website, or changed original JSON; only two small C01 controller/CSS revisions. The full-fidelity Delivery V2 cold-load caveat from the original integration report remains. No additional physical-iPad performance measurement is claimed.

**Release gate:** keep C01 PR #67 draft and unmerged. Deploy to the existing isolated Render review branch based on its current head, **without rolling back concurrent Artist's Edit editorial-panel review**. Stop after public validation for owner visual approval. Do not merge or publish production.
