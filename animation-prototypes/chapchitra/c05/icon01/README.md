**REJECTED ORIGINAL:** The original prototype in this directory is superseded by [V2 corrected choreography](V2/README.md) and should not be submitted for creative approval. The first version remains solely for rollback/comparison.\n\n# CHAPCHITRA C05 — Icon 01: Stories You Can Wear

**Status:** Standalone Lottie prototype for creative review. **Do not merge, integrate, or proceed to Icon 02.**

Source: user-supplied `More_than_a_tshirt_Icon_1.svg` (512 × 512) containing five original groups: `Icon_circle`, `Tshirt`, `Book_Base`, `Right_page`, `Left_page`.

This branch is **isolated from the existing CHAPCHITRA website**. Everything is under `animation-prototypes/chapchitra/c05/icon01/`; no existing website component, stylesheet, icon animation, or production asset was edited.

## What was produced

- `CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_PROTOTYPE.json`: native vector Lottie shapes and animated transforms; 30fps × 132 frames = 4.4s.
- `CHAPCHITRA_C05_Icon01_ISOLATED_PREVIEW.html`: original static SVG beside animated prototype, with playback controls, scrub, speed, loop, checkerboard, reduced-motion and overlay.
- `C05_Icon01_produce.py`: editable source generator. Run from this folder with Python 3, `lxml`, `Pillow`, `numpy`, `cairosvg`, and optional `ffmpeg`: `python C05_Icon01_produce.py`. It writes a `build/` directory and a review ZIP in this folder.
- `More_than_a_tshirt_Icon_1.svg`: source art read for generation. The supplied original with its original byte-level SHA-256 is also preserved unmodified in the downloadable chat review ZIP. The GitHub SVG text import may normalize line endings.

Lottie bundle `.lottie`, GIF and MP4 previews, original SVG archive copy, QA report and full generator are included in the separate **CHAPCHITRA_C05_ICON01_STANDALONE_LOTTIE_REVIEW.zip** downloadable from the production chat. Run the generator to regenerate the `.lottie` archive inside `build/`.

## Choreography

1. A shallow compression/rotation of the **left page** around the center spine (2D page-turn approximation).
2. The illustrated cat T-shirt temporarily vanishes from its static start location, emerges from the left book page and scales into view.
3. A gentle curved T-shirt flight above the book with restrained rotation and scale.
4. Page and T-shirt return to the exact source SVG pose; frame 132 is the identical final static composition.

Book base, circle and right page stay stationary. All original path fills and details are preserved. No expressions, external raster assets or SVG replacement drawings are used.

## QA gate

- Original SVG SHA-256: `4a2655d7d4224dc46e65f6df5117ab53bcb16853958a81154d3f4eb71496116a`.
- Source vs final pose reference raster: 0 changed pixels at 640px.
- Chromium **SVG fallback reference** passed desktop, mobile and iPad-size viewport checks without JavaScript errors.
- The isolated review HTML attempts the official `lottie-web` renderer first. When it cannot load, it clearly labels and plays the vector SVG fallback.
- **Official lottie-web rendering in Chromium and Safari/WebKit remains unverified** in this sandbox; do not claim production certification.
- Independent Vercel review project deployed READY: https://chapchitra-c05-icon01-standalone-review-8msedc14d-samvrc.vercel.app/ (deployment dpl_DA2dtzHnLmtggdDXmG87ctK2PuJW). This new review project is separate from existing CHAPCHITRA sites; live DOM playback and public reachability still require direct browser verification.

**Awaiting owner visual approval.**