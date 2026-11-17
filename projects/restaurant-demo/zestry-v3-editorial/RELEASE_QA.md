# ZESTRY V3 — Editorial Layout V4 QA

**Date:** 2026-11-17. **Source:** `deploy/zestry-v3-render-review-20261116` at `b31950ba379b2664d67110bd28be98df9ef85512` before these changes.

## Scope and artwork invariants
- All modifications live under `projects/restaurant-demo/`.
- Original approved animation JSONs for F01, both F02 versions, F03, F04, F06, and F07 and the original F05 interactive HTML are preserved byte-for-byte.
- F08 is absent. All payment, restaurant order, and reservation actions are simulated.
- F01 is in the photographic hero; F02 Orbit and Cooking form one asymmetric kitchen narrative; F06 is a standalone dominant-width continuous illustration; F03 has its own vertical space; F07 accompanies the reservation CTA. F04 and F05 remain on their existing functional journeys.
- Source animation IDs are removed from most customer-facing page copy; code and integration metadata retain those IDs.
- F03 is configured to play once and hold its final frame, including after out-of-view re-entry.

## Browser testing performed (actual Chromium, not simulated DOM)
- Desktop: 1440 × 900; tablet: 820 × 1180; mobile: 390 × 844; small mobile: 320 × 690.
- All six visible Lottie stages produced SVG DOM elements: F01, two F02 variants, F03, F06, and F07. F04 also produced SVG inside checkout confirmation.
- No page exception in four-viewport rendering checks; no page-width overflow at any tested viewport.
- Desktop and mobile: 9 dishes render; 'Mains' category filters to 3 dishes; add-to-cart updates quantity and subtotal; checkout demo form works; F04 order-confirmation animation renders; reservation form completes with F07 confirmation animation; F05 menu iframe appears.
- F03 reaches the end of its 7.6s animation, sets `data-motion-complete`, and holds its final frame.
- Local food photographs and the Lottie runtime are bundled; public Render playback must be rechecked after deployment.
- Desktop, tablet, mobile, and 320px screenshots were captured locally, plus functional confirmation screenshots.

## Independent creative review
- Improvement: large kitchen art, clear typographic hierarchy, no generic Lottie labels or card borders; F03 no longer overlays the photo.
- Remaining subjective issue: F01's original rectangular illustrated tabletop is visible as the art itself. Do not crop, redraw, simplify or change source vectors to disguise it. Owner visual approval is pending; it is a deliberate editorial composition rather than a separately framed widget.

## Release control
This is a **review/staging revision**, not a final creative sign-off, production merge, real restaurant integration, or booking/payment system. Keep Render automatic deployment off and obtain owner approval before calling it final.
