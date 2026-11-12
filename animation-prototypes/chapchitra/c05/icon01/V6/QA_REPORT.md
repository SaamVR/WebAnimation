# CHAPCHITRA C05 / Icon 01 — V6 Targeted SVG Integration QA

**Status:** Standalone review candidate; NOT creative-approved or released to main CHAPCHITRA website.

## Changes from V5

- Authoritative source replaced by the supplied `More_than_a_tshirt_Icon_1_PageBacks_Updated(1).svg`, copied byte-for-byte as `More_than_a_tshirt_Icon_1_PageBacks_Updated_ORIGINAL.svg`.
- Page back 1 and page back 2 geometry/color are loaded from their newly updated SVG groups. Page 3 retains V5's exact last-sheet landing to the unchanged `Left_Page_Final` composition (no visible geometric swap).
- Original 1.5× page-turn windows are unchanged: frames 0–13, 13–27, 25–41; 30 FPS.
- Floating shirt native Lottie transform keyframes (position, rotation, scale, anchor) and its existing clipping-mask keyframes are **byte-for-byte structurally identical** to V5.
- Floating shirt opacity is **static 100%**; visible activity begins at frame 60 (2.00s) using layer in-point, not an alpha tween.
- The *printed* `Tshirt_Illustration_On_Page` uses an animated geometric clip to clear beneath the lifting shirt, then restore by the final composition. This is a spatial matte, not opacity animation on the floating shirt.
- No changes to the T-shirt paths, page-turn warp function, color palette, background circle, spine anchors, or book base.

## Evidence and checks

| Test | Status |
| --- | --- |
| Supplied SVG preserved byte-for-byte | PASS |
| New source differs from prior SVG only in `Turning_x5F_Page_x5F_1` and `Turning_x5F_Page_x5F_2` | PASS |
| Native Lottie vector structure / JSON parses | PASS |
| No raster assets in Lottie (`assets=[]`) | PASS |
| Page faces carry constant 100% opacity | PASS |
| Floating shirt has constant opacity 100% | PASS |
| Shirt transforms, interpolation values, easing, timing, and clipping keys equal V5 | PASS |
| Original first/second right-page backs used | PASS |
| Final frame identical to static new SVG target | PASS — zero changed pixels at 640px |
| Chromium rendering of SVG reference and controls | PASS — 12 frame seeks, no page script errors |
| Official Lottie renderer playback (Chromium/WebKit) | **UNVERIFIED** — browser had no accessible Lottie runtime in this sandbox |
| Safari/WebKit native testing | **UNVERIFIED** — WebKit browser not installed |
| Website integration | NOT PERFORMED |

### Source integrity

`More_than_a_tshirt_Icon_1_PageBacks_Updated_ORIGINAL.svg` SHA-256:

`39b23449abf81e0824f9879005d4884bf78c4109e953cbe7f29e269f96a96225`

## Known visual limitation

The physical *printed* shirt artwork is restored gradually after the floating version has separated, to preserve the exact illustrated final image without a one-frame pop. This uses a progressive clipping matte rather than a paper-to-fabric morph. The floating shirt's approved motion is unchanged. This creative handoff must be judged in the rendered preview before final approval.

## Artifacts

- `CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V6.json`
- `CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V6.lottie`
- `C05_Icon01_V6_produce.py` (editable SVG-to-vector Lottie source)
- `More_than_a_tshirt_Icon_1_PageBacks_Updated_ORIGINAL.svg`
- `CHAPCHITRA_C05_Icon01_V6_ISOLATED_PREVIEW.html`
- `CHAPCHITRA_C05_Icon01_V6_MOTION_REVIEW.gif` and `.mp4`
- `CHAPCHITRA_C05_Icon01_V6_STORYBOARD.png`
- `CHAPCHITRA_C05_Icon01_V6_HANDOFF_QA.png`

**Release gate:** Owner creative approval and official Lottie Chromium/WebKit playback QA. Do not merge to the main website or begin Icon 02.