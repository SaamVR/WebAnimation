# CHAPCHITRA C05 / Icon 01 — Storybook V3

**Owner status: UNAPPROVED standalone candidate. No integration into the main CHAPCHITRA website.**

[Open isolated Render review](https://chapchitra-c05-icon01-v3-review-20261112.onrender.com/)

## Source and production assets
- `More_than_a_tshirt_Icon_1_ORIGINAL.svg` — untouched original SVG; SHA-256 `4a2655d7d4224dc46e65f6df5117ab53bcb16853958a81154d3f4eb71496116a`
- `C05_Icon01_V3_editable.py` — self-contained native vector Lottie exporter
- `C05_Icon01_V3_preview_builder.py` — standalone preview generator
- `CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V3.json` — genuine vector Lottie, 150 frames / 30fps, eight shape layers, no raster assets
- `CHAPCHITRA_C05_Icon01_V3_ISOLATED_PREVIEW.html` and `index.html` — responsive visual comparison
- `lottie.min.js` — lottie-web v5.12.2 local SVG renderer bundle from airbnb/lottie-web under MIT license
- `QA_REPORT.md` — acceptance evidence and remaining limitations

A packaged `.lottie` archive and GIF/MP4 reference clips are available as a separate download in the C05 production chat.

## Motion
1. 0.00–2.03s: three consecutive derived right-side pages flip right-to-left, around the spine; left printed page is static.
2. 2.00–3.10s: original cat tee emerges within the black printed area on the left page.
3. 3.10–4.50s: single gently curving upward path; no full circular flight.
4. 4.50–5.00s: tee settles into the precise final original logo pose, with authorized tee fabric recolor only.

## QA status
- Original artwork preserved byte-for-byte.
- Approved T-shirt fabric-only fill recolor `#E4E3DE` → `#F6F7F5`; 10 tee vector paths.
- SVG-rendered final frame vs authorized color-corrected original: **0 changed pixels** at 640px.
- Chromium fallback-view checks passed at desktop, mobile, and iPad-sized viewport configurations.
- **Official lottie-web end-to-end and WebKit/Safari native verification remain open.** The player is bundled to enable those checks; do not assert certification yet.
- Isolated Render deployment: LIVE according to Render API, full external browser playback remains to be checked.

**Approval gate:** no merge or work on Icon 02 until explicit owner signoff.