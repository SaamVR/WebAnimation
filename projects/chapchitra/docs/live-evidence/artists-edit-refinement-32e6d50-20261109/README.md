# CHAPCHITRA — Artist’s Edit refinement: live Render visual QA

**Date:** November 9, 2026  
**Feature PR:** [Draft PR #76](https://github.com/SaamVR/WebAnimation/pull/76)  
**Approved-for-review source SHA:** `32e6d50aff357a739023ba6de1f3f5f4ce1d583c`  
**Before source SHA:** `e78a77ca177c790baea973516e0194d81feb80b2`  
**Render deployment:** `dep-dbot4afavr4c73bs1th0` — `live`  
**Review:** https://chapchitra-webanimation.onrender.com/artists-edit/review/32e6d50aff357a739023ba6de1f3f5f4ce1d583c/

## Refined behavior

1. Artist’s Edit now opens directly with a compact single `h1`, 72px desktop and 56px mobile, followed by the existing illustrated worktable. The original oversized route intro, redundant description and visible technical build label are removed; diagnostic errors remain recoverable.
2. Owner-marked Regular Tee A4 and A3 are calibrated in the 2048×1152 stage: common top y≈362 and center x≈1023; A4 ≈223×315 and A3 ≈315×446. Retains the A-series proportions and area ratio ~1.998, neutral semi-transparent stroke, independent actual artwork bounds, proportion-preserving auto-fit and the existing registered other-garment layouts.
3. Artwork tools now prioritize Upload artwork, Artwork size, Reset and Remove. Optional native Print tips contains 300 PPI recommendations and production caveats. A low-resolution uploaded image shows only a one-line nonblocking advisory. Safe enlargement warning and core safeguards remain implemented.

## Before and after

- **Entry:** [Before oversized intro](before-entry-desktop.png) · [After compact header/direct studio](after-entry-desktop.png)
- **Controls:** [Before dense panel](before-artwork-panel-desktop.png) · [After cleaner panel](after-artwork-panel-desktop.png) · [Expanded Print tips](after-artwork-panel-tips-desktop.png)
- **Regular Tee guides:** [A4 reference stage](after-A4-stage-desktop.png) · [A3 reference stage](after-A3-stage-desktop.png) · [Uploaded artwork editor](after-editor-desktop.png)
- **Responsive:** [Tablet entry](after-entry-tablet.png) · [Mobile entry](after-entry-mobile.png) · [Tablet controls](after-artwork-panel-tablet.png) · [Mobile controls](after-artwork-panel-mobile.png)
- **Protected homepage/button:** [C01 live homepage](live-home-c01.png) · [C05 graphite hover](live-c05-hover.png) · [C05 release](live-c05-release.png)

## Public live browser recordings

- [Desktop: upload, four aspect fits, A3/A4 and direct tools](live-desktop-tool-workflow.webm)
- [Tablet: WebKit reference and artwork interaction](live-tablet-tool-workflow.webm)
- [Mobile: Chromium simulated touch interaction](live-mobile-tool-workflow.webm)

## Test results

| Gate | Passes | Failures |
|---|---:|---:|
| Combined Node/source tests | 139 | 0 |
| Live public editor tests (Chrome desktop, WebKit tablet, Chrome mobile) | 137 | 0 |
| Live Chrome touch interactions | 14 | 0 |
| Live WebKit selected-state regression | 6 | 0 |
| Live owner-refinement UI/geometry checks | 18 | 0 |
| Live C01/C08/C05 protected-feature smoke | 12 | 0 |

- [Live editor machine-readable report](live-editor-report.json)
- [Live touch report](live-touch-report.json)
- [Live WebKit selected-state report](live-selected-report.json)
- [Owner visual/geometry report](live-refinement-ux-report.json)
- [Preservation smoke report](live-preservation-report.json)
- [QA script committed in draft PR](../../../scripts/perf/artist-owner-refinement-qa.cjs)

### Precision and boundaries

- The initial **before** captures were taken from the previously deployed `e78a77c` before the review branch was advanced. The **after** captures and functional results are from the public `32e6d50` Render deployment.
- The owner’s red/green annotations were approximate **visible screenshot areas**; a native A-series aspect ratio is preserved rather than stretching those outlines. The A3/A4 guides are **preview references, not manufacturer-calibrated physical print areas**.
- Mobile test input is from Chrome/WebKit browser automation. **No physical iPad Safari test or owner visual approval** has been completed.
- C01/C08/C05 assets, other pages, THREADS, and `main` were not changed by draft PR #76.
- PR #76 remains **draft/unmerged**. This evidence-only branch is separate from the live Render deployment.
