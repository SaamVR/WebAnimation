# THREADS — Shop merchandise and image containment QA (2026-10-19)

## Defects reproduced and fixed
- **Actual browser cause:** the old `.store-product-card__media` had a fixed 160px stage but its CSS grid auto-min sizing let a 395×518 backpack image render at **196.8×258.1px**, overflowing and being cut by `overflow:hidden`. Merely setting `object-fit:contain` was insufficient.
- **Solution:** keep the existing editorial card stage but place the image absolutely (`position:absolute;inset:0;width:100%;height:100%;max-width/height:100%;object-fit:contain;object-position:center`) with internal padding, and anchor the card text/footer in a flex layout.
- **Order:** removed the category-cycling `curateShopProducts` algorithm and its privileged mixed-category featured row. Shop displays four contiguous sections in this order: Sneakers → Hats/Caps → Backpacks/Bags → Accessories. Within each category sort by subtype then name; color variants stay adjacent. CSS Grid retains native row-major placement and headers span grid columns.
- Search query relevance, filtered category routes, homepage, cart, checkout, order and future T01–T04 animation hooks were preserved.

## Source integrity audit
Original 29 owner-cropped RGBA-derived WebP assets audited in the extracted Batch 1 source package. All 29 images have a nonempty alpha bounding box and transparent margin, so content is not truncated at the exported image boundary. The displayed product clipping came from the card stage rather than the extracted product content. No images generated, stretched, flipped or replaced.

## QA — actual Chromium on samvr, checked against branch code before deployment
- Commit under review: `12e57dc31a18f85436521510765dda1939681d5f`.
- Node source contracts: **31 passed, 0 failed**.
- Real Chrome headless browser at 1440×950 (4 columns), 768×900 (3 columns), and 390×844 (2 columns).
- At **all three sizes**, every one of **39** Shop products was checked for decoded image dimensions, `object-fit:contain`, centered placement, and image DOM bounds within the card stage; no image failures.
- Verified deterministic section order and normal grid `grid-auto-flow:row` at every size.
- Verified complete bags and accessories rows visually; no cropped backpack, belt, bottle, or smartwatch.
- Search queries: Cap=7, Backpack=4, Accessories=8, Vintage Sneakers=10. Filters: Sneakers=16, Hats=7, Bags=8, Accessories=8.
- Checked PDP image decode for bag-01–04 and acc-01–07. All successful.
- Desktop/tablet/mobile browser screenshots below represent real pages served from the target source, not mocks.

## Evidence screenshots
| Viewport | First Shop rows | Backpacks / bags | Accessories |
| --- | --- | --- | --- |
| Desktop 1440px | [Shop](./2026-10-19-shop-grid-corrected-shop-top-1440.png) | [Bags](./2026-10-19-shop-grid-corrected-bags-1440.png) | [Accessories](./2026-10-19-shop-grid-corrected-accessories-1440.png) |
| Tablet 768px | [Shop](./2026-10-19-shop-grid-corrected-shop-top-768.png) | [Bags](./2026-10-19-shop-grid-corrected-bags-768.png) | [Accessories](./2026-10-19-shop-grid-corrected-accessories-768.png) |
| Mobile 390px | [Shop](./2026-10-19-shop-grid-corrected-shop-top-390.png) | [Bags](./2026-10-19-shop-grid-corrected-bags-390.png) | [Accessories](./2026-10-19-shop-grid-corrected-accessories-390.png) |

## Hold points
Live Render deployment and public-url checks must be recorded after promotion; this initial report is branch-browser evidence. No alternate-angle images exist for Batch 2; do not fabricate them or mark multi-angle galleries complete. No changes to EcomCMS.
