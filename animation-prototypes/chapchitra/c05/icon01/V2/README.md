# C05 Icon 01 — Stories You Can Wear / Choreography V2

**Status: Rebuilt for creative review — not approved and not merged.**

## Live isolated review

[Open the V2 staged preview](https://chapchitra-c05-icon01-standalone-review-2n4wxw4v4-samvrc.vercel.app/)

Vercel deployment `dpl_5Wo7D6gVzjkFUkJqMBWVQpQfCJFt` was **READY**. It is an independent CHAPCHITRA C05 review project, not the existing website. The staged preview bundles official lottie-web v5.12.2 plus the JSON and original SVG; Vercel team SSO may require sign-in.

## What changed from the rejected first prototype

- **Frame 0:** open book, T-shirt entirely concealed under the left-page illustration.
- **0–1.0s:** derived Bézier page reverse face turns from the center spine. Original left and right page artwork remains stationary, avoiding triangular distortion.
- **1.0–2.0s:** the unchanged original illustrated T-shirt rises from behind the book, scaling smoothly.
- **2.0–3.7s:** graceful, visibly looping near-circular flight.
- **3.7–4.5s:** floating shirt settles into the exact original SVG position and size. Final composition matches source.

**30 fps, 135 frames, 4.50s.**

## Artifacts on this isolated branch

- `V2/C05_Icon01_generate_v2.py` — editable, deterministic source of vector Lottie JSON and motion reference exports.
- `V2/CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V2.json` — genuine native vector Lottie, five original groups + derived page-face layer, no raster assets or expressions.
- `V2/CHAPCHITRA_C05_Icon01_V2_ISOLATED_PREVIEW.html` — original vs animated, Play/Pause/Replay/Loop/Speed/Scrub, original overlay, reduced-motion. Tries lottie-web; when unavailable, explicitly labels independent SVG motion fallback.
- `V2/QA_REPORT.md` — detailed QA and known certification blockers.
- Original user SVG is preserved at the branch root `More_than_a_tshirt_Icon_1.svg` with SHA-256 `4a2655d7d4224dc46e65f6df5117ab53bcb16853958a81154d3f4eb71496116a`.

The production chat also offers `CHAPCHITRA_C05_ICON01_V2_CHOREOGRAPHY_REVIEW_PACKAGE.zip`, including the regenerated `.lottie`, rendered GIF/MP4 references, original SVG, editable generator, preview builder and storyboard. Rebuild from this directory by placing the original source beside `C05_Icon01_generate_v2.py` and running it; the generator exports `.json` and `.lottie` into `build/`.

## QA and approval boundaries

- Final reference SVG render: **0 differing pixels at 640×640**.
- Chromium browser checks (desktop, mobile, iPad-size) passed **for SVG fallback** with zero JavaScript errors.
- **Official lottie-web real playback and Safari/WebKit certification remain pending.** READY deployment and bundled renderer are not proof that playback is visually certified.
- Creative approval is still pending. Do **not** merge, integrate into CHAPCHITRA, alter C02/other C-series, or begin C05 Icon 02.
