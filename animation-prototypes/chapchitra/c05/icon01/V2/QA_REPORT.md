# CHAPCHITRA C05 Icon 01 — Corrected Choreography V2 QA

**Scope:** Standalone animated asset, isolated review branch. **Not creative-approved or merged.**

## Changes relative to rejected prototype
- The original SVG is the FINAL composition. Animation starts with the T-shirt hidden below the left-page artwork, not visibly floating.
- A **new derived eight-node, cubic-curved page reverse face** turns over the stationary book; the source `Left_page` artwork is not narrowed into a triangle or mirrored.
- Shirt emergence: it starts around the left-page interior at 31% scale, remains underneath the book layers, and rises over 1.0–2.0s; its opacity increases smoothly while partly occluded.
- Shirt flight: a graceful near-circular arc from 2.0–3.7s; gentle rotation and scale; from 3.7–4.5s eases into the supplied final placement.
- No artificial blink, jump, 3D expression, rasterized frame, or external image in the Lottie JSON.

## Key implementation facts
- SVG source: `More_than_a_tshirt_Icon_1.svg`, 512×512, **SHA-256** `4a2655d7d4224dc46e65f6df5117ab53bcb16853958a81154d3f4eb71496116a`.
- Source groups preserved: `Icon_circle`, `Tshirt`, `Book_Base`, `Right_page`, `Left_page`.
- One additional derived page-face vector Lottie layer; **6 native vector layers total**.
- **135 frames at 30 fps; 4.50 seconds**. Lottie v5.9.6-compatible shape paths, transform keyframes and opacity.
- `assets: []`; no raster assets, expressions, external image references, 3D compositions or filters.
- JSON is 293,212 bytes; `.lottie` package ~44 KB.
- `.lottie` manifest autoplay **true**, loop **false**; final pose is held by the standalone review logic.

## Visual and structural QA
- **First frame:** T-shirt opacity 0 with concealed position; open book present.
- **Final frame:** CairoSVG-rendered original vs frame 135 at 640×640: **0 changed pixels**, maximum channel delta **0**.
- **Open-book stability:** circle, book base, original left/right pages are unchanged stationary vector layers.
- **Curved page:** newly derived reverse face uses 8-node Bézier morph with continuous topology, vanishing after turn; artwork remains unmirrored.
- **Motion continuity:** shirt position, scale, rotation and opacity sampled at each frame from continuous mathematical paths; no layer reset between phases.
- **Chromium:** original-versus-animated standalone page passed desktop (1320×890), mobile (430×1000), and iPad-size (820×1180) viewports with **0 JavaScript errors** in SVG-reference fallback mode.

## Still outstanding (do not claim a passed gate)
- **Official lottie-web playback in Chromium:** not independently certified in container; its external CDN script could not be fetched. The review page labels SVG fallback when the real renderer is missing. The staged review is designed to bundle official lottie-web for owner playback.
- **Safari/WebKit playback:** not independently certified; browser engine binaries unavailable in test container. Must be tested before production acceptance.
- **Creative approval:** pending owner review. The derived stylized page face is a 2D vector illusion, not a physically simulated three-dimensional sheet.

## Isolation and handoff
- Change only `animation-prototypes/chapchitra/c05/icon01/` on the existing dedicated branch.
- Do **not** modify CHAPCHITRA website sections, C02, C01, C08, or C05 Icons 02–04.
- The V2 ZIP includes original SVG, JSON, `.lottie`, source generator, fallback preview, reference GIF/MP4, storyboard and QA evidence.