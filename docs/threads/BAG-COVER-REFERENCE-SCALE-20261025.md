# THREADS — Everyday backpack and Burgundy duffel cover scale (2026-10-25)

This correction changes **only transparent cover canvas bounds**, not product artwork, card layout, cover selection, or gallery angle photographs.

## Scope / reference selection
- `bag-01` Forest Everyday Backpack → compare unchanged `bag-04` Mustard City Backpack cover.
- `bag-02` Olive Utility Backpack → compare unchanged `bag-04` Mustard City Backpack cover.
- `bag-04` Mustard City Backpack → **unchanged**, reference image.
- `bag-05` Burgundy Weekender Duffel → compare the median transparent-canvas occupancy of unchanged `bag-06` Graphite Travel Duffel and `bag-07` Cobalt Campus Duffel.
- `bag-03` Navy Gold Trek Pack is a technical hiking style, not an everyday backpack reference; its photography remains unchanged. Orange Weekender Duffel `f3` remains unchanged.

## Exact pixel-preserving updates

| Cover | Previous canvas | New canvas | Subject coverage (width × height) |
| --- | --- | --- | --- |
| Forest Everyday Backpack | 1100 × 1100 | **750 × 946** | **94.13% × 94.19%** (matched Mustard) |
| Olive Utility Backpack | 1100 × 1100 | **760 × 899** | **94.21% × 94.22%** (matched Mustard) |
| Burgundy Weekender Duffel | 1100 × 1100 | **754 × 643** | **97.21% × 96.11%** (matched Graphite/Cobalt) |

The tool `scripts/threads_bag_cover_reference_trim_20261025.py` reads the reference covers, measures their existing alpha silhouettes and centers only the three selected crops into lossless WebP canvases of the correct proportions. Every visible RGB value and every original alpha value is checked for identity. All natural handles, straps, edges and product shadows remain intact. The script is idempotent.

**No CSS zoom, changed card dimensions, generated photographs, cover swaps, or non-cover gallery changes.** The approved recent cap scaling, f3 gallery square rule, Burnt Orange sneaker profile cover, T01, T02, T04 and static T03 stay unchanged. `SaamVR/EcomCMS` was never accessed.

## Local verification
- **53/53** source/catalog/animation contracts passed.
- **169/169** local Chrome desktop 1440, Chrome mobile 390 and Linux WebKit iPad-style 820 touch browser checks passed: all eight Bags-category card covers, fixed card frame dimensions, `object-fit: contain`, correct product default, all gallery angles decode and remain distinct, existing homepage cover references, zero browser errors.
- Public Render review preview will be separately validated after deployment.
- Physical iPad Safari testing remains outstanding because the available WebKit environment runs on Linux, not an iPad.

Deployment continues on the existing isolated Render gallery review service, without enabling a paid hosting resource or overwriting production. PR remains draft until owner visual review.
