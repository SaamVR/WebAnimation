# THREADS — cap image scale / Orange Duffel fixed-square gallery (2026-10-25)

**Scope:** Exactly three owner-supplied cap photo sets and the Orange Weekender Duffel (`f3`) image frame. The previous full gallery replacement remains intact, including all separate original viewing angles.

## Cap visual scale
- Assets changed only under `site/threads/assets/products/{f2,hat-01,hat-04}/` (four files each: cover/front/profile/rear).
- Previous files were 1100×1100 with substantial transparent gutters and presented smaller than unchanged cap products (`hat-02`, `hat-03`, `hat-05`, `hat-06`).
- Follow-up refinement: each of the four camera-angle cutouts is bounded using the original alpha channel then centered in a transparent canvas **matching the median nontransparent silhouette occupancy of unchanged reference hats** (`hat-02`, `hat-03`, `hat-05`, `hat-06`). This replaces the earlier one-size-fits-all 4% margin. Covers now fill **~97% of canvas width**, compared with ~92.6% before refinement, while retaining brim, top button, shadows and semitransparent fringes.
- The images were **not resampled, recolored or recreated**. They were saved as lossless WebP and alpha/visible-pixel compared against their immediate source: **all visible RGB values and all alpha values match** (12/12). Transparent pixels' hidden RGB payload is allowed to differ without changing appearance.
- Assets are not cropped by CSS and existing Homepage, Shop, Product Detail and thumbnail `object-fit:contain` continue unchanged.
- Reproduction script: `scripts/threads_cap_padding_trim_20261025.py`. Previous versions remain recoverable in Git history.

## Duffel
- Only `f3` detail receives `data-f3-square-gallery`; all other product page markup and styling stays the same.
- Scoped CSS applies a true `aspect-ratio:1 / 1` and absolutely fits the current image with `object-fit:contain;object-position:center` inside the static square frame.
- Before: Chrome main frame heights across cover/front/side/angled were 605/630/630/630 px at 1440 wide and 360/480/630/619 px at 820 wide, despite stable width.
- After: all four at 1440 have **657.16×657.16 px**; all four at 820 have **360.31×360.31 px**. No surrounding heading/purchase reflow between perspectives.
- Original `f3` photographs, colors, gallery order and thumbnails are unchanged.

## QA
- Source tests: **50/50** (including two focused sneaker contracts and two cap/duffel contracts).
- Chrome 1440 and 390 / Linux WebKit iPad-sized 820×1180: **89/89** visual-layout tests passing; compares new cap Shop-card image scale against unchanged `hat-02`, tests all twelve cap gallery views, each Duffel angle/1:1 frame, surrounding info position and unrelated gallery isolation.
- Real physical iPad Safari keyboard/toolbar and rendering were not directly exercised: **WebKit iPad viewport emulation, not hardware testing**.
- T01 `46c96964f6757b3a99f9e7ee873fdffaca1f55ff` and T02 `f4813a8e6bb01d03f51a2a2b487d068fd95d719b` untouched. Approved T04 and static T03 untouched. No `SaamVR/EcomCMS` modifications.
- Existing checkout state and galleries remain intact, preserving favorites/cart/checkout functionality.

**Isolated review-only PR; no production merge or replacement of approved preview services.**
