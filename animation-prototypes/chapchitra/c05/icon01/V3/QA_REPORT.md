# CHAPCHITRA C05 Icon 01 — Right-Page Storybook V3 QA

**Status:** New standalone creative review candidate. **NOT approved for website integration.**

## Source preservation
- Original Illustrator SVG preserved byte-for-byte: SHA-256 `4a2655d7d4224dc46e65f6df5117ab53bcb16853958a81154d3f4eb71496116a`.
- Original groups preserved: `Icon_circle`, `Tshirt`, `Book_Base`, `Right_page`, `Left_page`.
- Only 10 textile fill paths with the original Cream `#E4E3DE` were changed to Gallery White `#F6F7F5` in the **derived animated T-shirt**. Original source, all other cream areas, book drawing, printed black block, cat and outlines unchanged.

## Revised choreography
- Native composition: 512 × 512, 30 fps, 150 frames / 5.0 sec.
- Three derived vector right-side page leaves, turning right-to-left across the spine with staggered overlap between 0–2.03 sec. Source left illustrated page remains stationary.
- T-shirt starts hidden in the left-page black printed illustration near artwork-space `(174,290)`. It becomes visible only after the page turns, via a growing world-space reveal envelope and a matching Lottie shape mask.
- Emergence: ~2.0–3.1 sec; single upward curved flight ~3.1–4.5 sec; subtle settling ~4.5–5.0 sec. No full circular flight.
- Pages return to the original book configuration. The final animated artwork matches the authorized color-corrected original at 640 × 640 with **0 changed pixels** in the SVG reference renderer.

## Technical validation
- 8 vector Lottie layers: 5 original groups + 3 derived right-side page faces. No raster layers or external image references in Lottie.
- JSON parses and dotLottie archive contains valid manifest and animation JSON.
- Standalone SVG-reference preview rendered on Chromium viewport sizes **1360×920**, **820×1180**, and **390×844**, with no page errors observed.
- Play/Pause/Replay/scrub/loop/speed/reduced-motion implemented in standalone review page; the preview attempts the official `lottie-web` SVG renderer and explicitly labels fallback playback if it cannot initialize.

## Remaining QA / limitations
1. **Official Lottie playback in Chromium and Safari/WebKit has not been independently certified in this sandbox.** The reference GIF/MP4 are raster recordings of the generated SVG motion, not captures of official Lottie playback.
2. The 2D paper turn is a stylized curved-leaf morph, not true 3D backface/perspective shading. It is intentionally kept in vector Lottie-compatible geometry.
3. Safari/WebKit native testing is outstanding. Responsive Chromium checks alone must not be described as iPad/Safari verification.
4. Creative acceptance of the page-turn illusion and emergence movement remains with the owner.

## Release boundary
All work remains in the isolated `SaamVR/WebAnimation` branch `feature/chapchitra-c05-icon01-storybook-lottie-20261112`, under `animation-prototypes/chapchitra/c05/icon01/V3/` and in a separate review deployment. Do **not** merge into `main`; do **not** modify any CHAPCHITRA website pages, C02, or other C-series artwork; do **not** proceed with Icon 02 until explicit approval.