# THREADS — Three cap image scales + square Orange Duffel gallery

**Status: deployed visual review, creative approval pending.**

## Public preview
https://threads-final-gallery-replacement.onrender.com

This existing isolated gallery-review Render static service is reused because the Hobby workspace has reached **25 services** (creating an additional static service returned HTTP 400). Its existing review branch was fast-forwarded from `faf23b06db231bab50c2f833880362ac6e49b623` to `6fd68deafb5dbcb1b89b333d6c3a8ab67bc51ee8` with no force push/rebase; former state remains in Git. Production and approved T01/T02/T04 preview services remain unchanged.

- Render service: `srv-dbeithnavr4c73b2qbng`.
- New cache-cleared live deploy: `dep-dbejvt3ncjis73eggofg`.
- Application SHA: `6fd68deafb5dbcb1b89b333d6c3a8ab67bc51ee8`.
- Auto-deployment: off.

## Cap scale implementation
- Only images at `f2/`, `hat-01/`, `hat-04/` were modified, four distinct cover/gallery views each.
- Transparent 1100×1100 canvases were tightened around their exact alpha bounding boxes with 4% transparent padding on every side, not CSS zoom.
- The three covers are now 946×687, 885×644, and 873×628; all gallery angles were trimmed independently.
- Original crown, brim, top button, shadows and translucent edges remain. **Decoded visible RGB values and alpha values match the Git originals exactly for all 12**, checked pixel by pixel with Pillow/NumPy. Fully transparent pixels' invisible RGB payload may differ.
- Other hats' assets and all original camera-angle content remain untouched. `object-fit:contain` on homepage, shop, detail and thumbnails remains unchanged.

## Orange Weekender Duffel
- Only `f3` detail markup receives `data-f3-square-gallery`.
- Scoped CSS sets the existing main gallery image frame to `aspect-ratio:1/1`, with contained absolutely positioned image.
- Frame before: desktop 1440px width angle-height variation **604.8 → 630px** and iPad-sized 820px width **360 → 630px**.
- Frame after: all four angles have **657.16×657.16px** desktop and **360.31×360.31px** iPad-sized.
- All four original photos, original order and thumbnails remain unchanged. Surrounding product information no longer changes position when swapping angles.

## Evidence from live Render Chrome and WebKit
- [Short product-details and angle-cycle browser recording](cap-and-duffel-visual.mp4)
- [Sunburst updated detail](cap-sunburst-detail.png)
- [Sky Blue updated detail](cap-sky-blue-detail.png)
- [Sunshine updated detail](cap-sunshine-detail.png)
- [Unchanged reference hat detail](cap-reference-unchanged-detail.png)
- [Homepage cap sizing](homepage-cap-scale.png)
- [Shop/Search Sunburst cap](shop-sunburst-cap.png)
- [Duffel frame cover angle — desktop](chromium-1440-f3-angle-0.png)
- [Duffel frame final angle — desktop](chromium-1440-f3-angle-3.png)
- [Duffel frame cover angle — mobile](chromium-390-f3-angle-0.png)
- [Duffel frame final angle — mobile](chromium-390-f3-angle-3.png)
- [Duffel square image frame — iPad-sized WebKit](webkit-820-f3-angle-3.png)

### Tests
- **48/48 source/contract tests** (46 existing + 2 dedicated regression checks).
- **89/89 actual live-URL cap/duffel visual tests**, including Chrome desktop (1440×900), Chrome mobile (390×844), Linux Playwright WebKit iPad-sized viewport (820×1180). All caps compared against untouched `hat-02` at the same storefront card dimensions. Every cap angle was decoded, and every `f3` angle was checked for perfect square dimensions, contain-fit and unchanged adjacent content.
- **89/89 live full gallery/homepage/search/favorites/cart/checkout regression tests**.
- **7/7 live T01 Spotlight and T02 flying product/real cart regression checks**.
- **69/69 live T04 simulated checkout success/cancel/form/overlay regression checks**.
- **Zero page JavaScript exceptions** in above browser test suites.
- Public cap asset responses HTTP 200 with updated 240674-byte Sunburst cover. No broken mappings.
- **Safari caveat:** Playwright's Linux WebKit at an iPad-sized viewport is not a real physical iPad Safari test. Device-specific iOS browser UI still requires on-device visual inspection.

## Protected versions
- T01 Spotlight source Git blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- T02 Add to Cart source Git blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
- T04 Approved Payment source Git blob: `790088849cc646ffec4553a77cf25a56ff5b0e78`.
- T03 remains static, with no backpack motion restored.
- No changes to `SaamVR/EcomCMS`.

**No production merge. Await owner visual approval.**
