# THREADS — Bag cover scale: deployed visual QA (2026-10-25)

**Live isolated review:** https://threads-final-gallery-replacement.onrender.com/search/?category=Bags

## Exact correction

The source investigation found that the newly uploaded `bag-01`, `bag-02` and `bag-05` cover assets remained on **1100×1100 canvases** with excess empty transparent space. They therefore appeared smaller than reference backpacks and duffels despite identical CSS cards. Screenshots confirmed the imbalance.

Applied only these three lossless cover canvas adjustments:

| Cover product | Canvas before → after | Reference | Visible bounds target |
|---|---|---|---|
| Forest Everyday Backpack (`bag-01`) | 1100×1100 → **750×946** | Mustard City Backpack `bag-04` | 94.13% width × 94.19% height |
| Olive Utility Backpack (`bag-02`) | 1100×1100 → **760×899** | Mustard City Backpack `bag-04` | 94.21% × 94.22% |
| Burgundy Weekender Duffel (`bag-05`) | 1100×1100 → **754×643** | Median of Graphite `bag-06` and Cobalt `bag-07` | 97.21% × 96.11% |

Each edit crops the **existing owner photograph's alpha bounding box** and pads it symmetrically to match an unchanged reference. The fully visible source RGB pixels and all alpha values were checked against the pre-edit originals with NumPy/Pillow: they are **identical**. Handles, buckles, straps, natural shadows, shape and colors remain intact. Image processing is repeatable/idempotent.

**Unmodified:** `bag-04` Mustard reference, technical trekking `bag-03`, `bag-06`, `bag-07`, `f3` Orange Weekender, all non-cover gallery angles, thumbnails, all CSS, all category/card dimensions and positioning. `object-fit: contain` continues to apply via the unchanged approved storefront stylesheet. Existing corrected hats, Orange Duffel square Product Detail frame, and sho-04 profile cover are preserved.

## Deployment / repository
- Code commit: `15254a1a09a1edc1bbda24f57da3f8521972ee11`
- Review Render static service: `srv-dbeithnavr4c73b2qbng`
- Live public deployment: `dep-dbem1bcs728c73cm130g`; manual trigger; autoDeploy off.
- Existing owner gallery-review service was updated using a fast-forward branch; previous commit remains recoverable. No new paid Render service and **no production changes**.
- Only six new/changed source files: three cover WebPs, a bounded-crop source script, one 3-test regression contract, and an implementation report.

## Real public-URL browser QA
- **53/53 source/contract tests passed**
- **169/169 bag-specific tests passed** on desktop Chrome (1440×900), mobile Chrome (390×844), Linux Playwright WebKit with iPad-sized viewport (820×1180): all 8 Bags category cards present with consistent unchanged media dimensions, correct cover URLs, image centering and contain-fit; 4 affected Product Details retain their original distinct gallery views and decode successfully; homepage cover references stay correct; no JS errors.
- **89/89 additional existing gallery/storefront browser regressions passed**
- **7/7 T01 Spotlight Search / T02 actual cart flight regressions passed**
- **69/69 T04 demo checkout regressions passed**
- **0 JavaScript errors** in those public browser suites

### Visual screenshots
- [**Updated actual Bags category — desktop Chrome**](desktop-bags-category.png)
- [**Updated actual Bags category — iPad-sized WebKit**](ipad-webkit-bags-category.png)
- [Side-by-side grouping of backpacks and duffels using original Shop cards — desktop](desktop-bag-size-comparison.png)
- [Side-by-side grouping using original Shop cards — iPad-sized WebKit](ipad-webkit-bag-size-comparison.png)
- [Before correction: desktop category screenshot](baseline-desktop-bags-category.png)
- [Before correction: desktop comparison](baseline-desktop-bag-size-comparison.png)
- [Source asset cover metrics](bag-cover-metrics.json)
- [Public bag browser check results](QA-browser.json)

**Screenshot methodology:** Category screenshots show the actual deployed /search page. Side-by-side grouping screenshots reorder DOM cards only in test browser, with the original storefront CSS and original product content; deployed site layout is unchanged.

**Safari limit:** WebKit testing used Linux Playwright with an 820-pixel tablet-like viewport; it is *not* a physical iPad Safari session. Direct hardware visual review is still needed.

## Protected work
T01 blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`; T02 blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`; approved T04 blob `790088849cc646ffec4553a77cf25a56ff5b0e78` all unchanged. T03 remains static/on hold, no `SaamVR/EcomCMS` modifications. PR stays draft and unmerged pending owner approval.
