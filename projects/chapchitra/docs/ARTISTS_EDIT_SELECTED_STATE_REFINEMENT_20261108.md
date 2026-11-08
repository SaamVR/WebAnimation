# CHAPCHITRA — Artist's Edit selected elevation review

**Starting revision:** `e9f8dc076113ab1f3d63f8cb54321fe35900b1b4` (draft PR #61), stacked on draft PR #60 and #59. All remain unmerged. Changes are scoped to `src/worktable-studio.css` plus test/evidence files; **no JavaScript application changes**, art asset modifications, transitions or manual-rail changes.

## Exact physical control rules

| Group | Prior selection | Refined persistent lift | Selected + pointer hover | Original unselected hover |
|---|---:|---:|---:|---:|
| Four garment cards | 2px | 4.5px | 4.9px | 2px — unchanged |
| Five hanging size tags | 2px | 3.5px | 3.9px | 1.5px — unchanged |
| Six paint pots | 2px | 5.5px | 5.9px | 2px — unchanged |
| Two A3/A4 cards | 2px | 4px | 4.4px | 2px — unchanged |
| Upload plus/frame | N/A | **none** | 3px hover only | 1px previously |

New selected rules use the **same alpha-trimmed existing WebP layers** and a slightly deeper filtered bottom-right shadow plus Gallery White/Cream illumination (`rgb(250 237 211 / .5)`). No rectangular borders, color overwrites, newly loaded artwork, synthetic canvas duplicates, or shader/GSAP dependencies.

The selected state remains elevated after pointer exit, when other groups are used, and when a keyboard user focuses a previously selected option. Returning to an unselected state restores the exact resting position and shadow. The separate wooden tray-front stays *later* in the source DOM order without CSS z-index override.

## Rendered evidence

Screenshots use the same original full-stage coordinates, viewport (1440 × 900), selected **red** paint pot, and untouched starting garment. Every comparison is **BEFORE | AFTER** (left/right). All are real Chromium screenshots, not reconstructed artwork or generated images.

- [Resting — before/after](performance-evidence/selected-refinement/before-after-resting.webp)
- [Approved hover — before/after](performance-evidence/selected-refinement/before-after-hover.webp)
- [Selected after pointer exit — 2px vs 5.5px](performance-evidence/selected-refinement/before-after-selected-after-pointer-exit.webp)
- [Selected red pot surrounded by five unselected pots — cropped comparison](performance-evidence/selected-refinement/before-after-paint-pot-closeup.webp)
- [Machine-readable browser QA report](performance-evidence/selected-refinement/selected-refinement-qa.json)

## QA gate

- **72/72** Node/source tests passed locally.
- **168/168** dedicated browser assertions passed for Chromium and Linux WebKit, manual-rail switching in each group, all six paint pots, keyboard focus, simulated touch at widths 834, 390 and 320, selected state through deferred hydration and failure-free scene initialization.
- The composited first-frame scene deliberately masks independent cropped image layers while they hydrate, preventing doubled outlines. An early selection is retained at its correct transform while the composed preview remains displayed, and the strengthened selected pixels become visible at the original atomic image-layer handoff. The intermediate opaque preview **does not visibly animate that layer before hydration completes**; this is a preserved rendering constraint, not an assertion of early visible motion.
- **102/102** existing physical-interaction regression assertions passed, including original keyboard and touch behavior. The independent full original-browser regression also passed (the 35/35 original checks), along with its delayed asset and early-upload failure recovery.
- Physical iPad Safari/Chrome remain the owner visual acceptance gate.

### Paired cold-cache performance — no loading regression

Same Linux Chromium host and 70ms simulated network latency, with source and candidate served from separate local ports. A single run per configuration is *not* a performance guarantee.

| Profile | Before first usable worktable | After | Before image bytes | After image bytes |
|---|---:|---:|---:|---:|
| Mobile 390px, 4 Mbps | 2.437s | 2.310s | 355,469 | 355,469 |
| Desktop 1440px, 10 Mbps | 1.576s | 1.542s | 830,232 | 830,232 |

Both builds made exactly **64 requests** and **41 image requests** in this comparison; the artwork payload is byte-for-byte identical. No new runtime image or animation dependency was introduced. Total network bytes increased ~1.5KB because the stylesheet includes additional group-specific selected rules.


**Independent Creative Director QA:** Conditional approval for visual review only. The movement stays restrained, the approved unselected hover is unchanged, and selected lift is visibly stronger. Final owner approval is explicitly required before merge or further interaction work.
