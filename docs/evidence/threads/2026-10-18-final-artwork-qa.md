# THREADS — Four Artwork Replacements — Final Browser QA

**Date:** October 18, 2026
**Repository:** SaamVR/WebAnimation
**Working branch:** feat/threads-layout-only-20261017
**Code SHA tested:** 0112c2bcd46f95e857ca649d606a9c5456dbc13c
**Live preview:** https://threads-standalone-layout-review-20261017.onrender.com/index.html?v=0112c2bc

## Requested artwork and implemented mapping

1. **Featured Products:** Four independently cropped, transparent owner-supplied pictures in the existing cards, in order: green runner, blue THREADS cap, red backpack, black over-ear headphones. Product names, illustrative Tk prices and categories now agree with displayed artwork; card layout, shadow, CTA and favorites remain.
2. **New Arrivals / bottom row:** Orange/cream/black running shoe, lime running shoe, black/turquoise shoe. Existing top row remains exactly unchanged, including the three original source image paths.
3. **Built for a Brighter Everyday:** The original 2048x1536 upload has black cinematic bands above and below the actual 2048x635 photograph. Only these black bands were trimmed (rows 402 through 1036 retained). No horizontal crop in the *stored* image; products on the right are protected with object-position:right on desktop. At phone widths the whole image is displayed in a natural-aspect full-width media stage, with the original far-left-aligned heading/body/CTA immediately below to preserve the photograph without cropping/overlap.
4. **Deal of the Week:** Owner-provided new 1920x1080 transparent image cropped to its alpha content bounds, converted to efficient WebP preserving transparency. The pre-approved one-piece angled SVG panel, editable right-side copy and future T03 motion layer hook are unchanged.

All assets are local to the static site; the EcomCMS repository and all other WebAnimation projects were untouched. T01-T04 implementation has **not** begun. No AI-rendered images were substituted.

## Actual live Chromium screenshots — Desktop, 1440px

- [Featured Products](./2026-10-18-final-featured-1440.png)
- [New Arrivals, all six cards](./2026-10-18-final-arrivals-1440.png)
- [Built for a Brighter Everyday](./2026-10-18-final-campaign-1440.png)
- [Deal of the Week](./2026-10-18-final-deal-1440.png)

## Actual live Chromium screenshots — Mobile, 390px

- [Featured Products](./2026-10-18-final-featured-390.png)
- [New Arrivals](./2026-10-18-final-arrivals-390.png)
- [Built for a Brighter Everyday](./2026-10-18-final-campaign-390.png)
- [Deal of the Week](./2026-10-18-final-deal-390.png)

All screenshots captured with Playwright/Chromium against the Render live URL, after deployment. They are not mockups.

## Tested functionality and responsive behavior

1. Initial complete live browser run **1920, 1440, 1024, 768, 390, 360px** confirmed:
   - All 10 product images loaded (4 featured and 6 arrivals).
   - New Featured and Arrivals filenames and four corrected product names present.
   - Original campaign loaded with 2048x635 natural dimensions, right-anchored on desktop, full image on phone.
   - New Deal backpack image decoded and one existing angled SVG panel remained.
   - Functional search opens and closes; demo cart accepts products; sample cart total shown as Tk 5,990.
   - No document horizontal overflow or browser JavaScript errors.
2. A stricter visual test found that portrait Featured cutouts could expand beyond the photo row; this was corrected in final code SHA **0112c2bc** by adding explicit min-height:0 and max-height:100% constraints in the CSS grid plus overflow clipping.
3. Final live **six-width** regression confirmed all four Featured photos entirely within their media row, no overlap into product names, no overflow and no JS errors at 1920/1440/1024/768/390/360.
4. Exact latest-code GitHub CI: https://github.com/SaamVR/WebAnimation/actions/runs/39121291733 — SUCCESS.

### Known minor source-art limitation
The owner six-shoe sheet itself ends at the lower edge of the orange and lime lower-row shoes. Source pixels are preserved; no missing sole texture has been reconstructed or fabricated. The visual image as supplied is used.

This is still a **static storefront demo**. No ecommerce production flow, checkout or animations were authorized or built.
