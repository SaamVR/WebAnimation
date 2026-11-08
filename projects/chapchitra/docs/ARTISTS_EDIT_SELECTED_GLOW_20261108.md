# CHAPCHITRA — selected-only illustrated glow

**Starting source:** `04e581e9c5daf8bf6c00b06db3f3d5e4bad3607d` (owner's previously approved hover/elevated selection, draft PR #62). This refinement is a separate draft PR, stacked on #62. No merges or changes outside the Artist's Edit worktable.

## What changed

**One runtime CSS declaration** in `projects/chapchitra/src/worktable-studio.css`: the persistent selected state's existing `filter` gets a slightly brighter, still restrained soft warm alpha-silhouette glow:

- Small cream edge catch: `drop-shadow(0 0 1.9px rgb(255 249 232 / .66))`
- Diffuse outer wash: `drop-shadow(0 0 4.6px rgb(248 237 214 / .32))`
- The existing warm-brown bottom-right depth shadow remains unchanged.

The two CSS drop shadows are automatically computed from each existing alpha-trimmed transparent WebP image's silhouette, **not from any rectangular hitbox or element border**. No background or original PNG/WebP pixels, group animation logic, focus behaviour, JS, API, network assets, or CSS animation dependency is altered.

### Explicit locks

- **Resting state** remains unchanged. The added cream halo exists in `.is-selected` only.
- **Approved hover**, including selected+hover and upload-plus hover, is byte-for-byte unchanged.
- **Persistent selected lift** remains **4.5px garment, 3.5px hanging tag, 5.5px pot, 4px A3/A4**. Selection stays raised after pointer exit; switching via the manual rail drops the old illustration to rest.
- **Keyboard focus**, mobile touch, reduced motion, upload target, progress hydration and the original wooden paint-tray front-panel occlusion remain unchanged. There is no neon/rectangle/ink recoloring.
- Physical Safari/Chrome on the owner's iPad is an independent acceptance gate; automated Linux WebKit and touch emulation are not the physical device.

## Actual browser screenshots

Each visual composite is **before (left) | after (right)**, in the same 1440px Chromium stage and with exactly matching selected controls:

- [Close-up: selected red pot beside five unselected pots](performance-evidence/selected-glow/before-after-selected-red-pot.webp)
- [Full illustrated worktable with red paint pot selected after pointer exit](performance-evidence/selected-glow/before-after-selected-worktable.webp)
- [All four control groups selected: garment, hanging size, red pot and print-size paper](performance-evidence/selected-glow/before-after-four-groups-selected.webp)
- [Machine-readable Chromium/WebKit/touch QA results](performance-evidence/selected-glow/selected-glow-qa-report.json)

The paint-tray front panel remains above all six paint pots in source stacking order. No selected pot z-index override was introduced.

## Validation

- 75/75 Node tests pass, including unchanged lift values/hover declarations and selected-only glow assertions.
- 159/159 isolated visual/browser assertions pass: Chromium desktop (1440), WebKit desktop (1440), WebKit touch-tablet (834), Chromium touch-mobile (390 and 320), exact computed selected glows, untouched hover computed filters across all five visual groups, deselection to resting state, focus/occlusion and no page errors.
- Prior 168-assertion elevation/selection progressive hydration test and general original-browser/early-upload regression run independently in CI.
- Selected filter transition remains the original 190ms. Screenshots were taken after transforms and filter interpolation settled.
- Paired Linux Chromium cold-cache benchmark (70ms simulated network latency): mobile 390px/4Mbps first useful stage **2.557s before vs 2.464s after**; desktop 1440px/10Mbps **1.708s before vs 1.733s after**. Both versions request exactly **41 images, 355,469 mobile image bytes / 830,232 desktop image bytes** and 64 total requests. A single measured run per profile cannot prove identical browser performance, but shows no meaningful change in network work or first-screen readiness. No canvas/image is duplicated and no new dependencies ship.

**Independent visual QA:** Conditional PASS for owner visual review; the halo is present but intentionally restrained. No production merge or approval inferred. Stop after deploying to the existing Render review service.
