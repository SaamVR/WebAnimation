# ZESTRY F01 — owner-supplied V4 master, circular display integration

**Status:** native Chromium integration QA passed; final owner visual acceptance remains separate.

## Authoritative owner uploads

- Uploaded package: `F01_Pasta_Bowl_V4.zip`.
- Full preview MP4: `F01_Pasta_Bowl_Final_V4_Full_Preview(1).mp4`, SHA-256 `a3f46dcc609dadaadf1162bd7781d9274110d4918376ce115c131377e35b0530`.
- The MP4 outside the ZIP is byte-for-byte identical to the packaged full-preview MP4.
- Approved native V4 JSON: 1984 × 1134, 30 fps, 261 frames, 8.7 seconds, 32 Bodymovin shape layers, 0 embedded image assets.
- Exact SHA-256 of the uploaded JSON: **`7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37`**.
- The owner-uploaded JSON matches historical GitHub blob `c2267ebcb0421bcfe7d90a55e6f80b83759e4ba8` exactly; that same immutable blob was restored to `assets/lottie/f01.json`.

**Do not modify this file.** No edits to original drawing, timing, easing, layer order, text, motion, keyframes, or artwork are authorized.

## Display-only changes

- Restored F01 into the existing yellow-accented circular ZESTRY hero, leaving the rest of the site unchanged.
- The **website-only** CSS `clip-path:circle(50% at 50% 50%)` masks the circular viewport and centers the whole Lottie composition within a fixed display scale.
- Source `1984:1134` composition is rendered in its native aspect ratio; the circle never performs a second zoom and the Lottie is never stretched or re-keyframed.
- Original V4 `background-wood-tabletop` static vectors were rasterized **without touching the source** into `assets/f01-v4-wood-fill.webp` to extend the wooden backdrop within the round site mask. Only the outside-of-composition strips are mirrored to avoid unnatural seams; the real SVG scene always remains unchanged.
- F01 plays once at its original speed, holds the completed pasta bowl at frame 260 and **does not reverse or auto-loop**.
- **Native renderer compatibility:** official Lottie-web needs its existing animated Broth mask to be recognized. The website transiently sets `hasMask:true` on the browser's freshly parsed Broth layer metadata only; the original F01 JSON itself remains byte-identical. Controlled Chromium comparison proved the unhinted official renderer paints only ~137 broth pixels at final frame, while this hint correctly paints 24,258 at full native composition without changing any art/keyframes.
- No wood SVG clones or duplicate definition IDs; no V16/V17/V18 external scale transformations.
- F02 chef and all other ZESTRY animations remain unchanged.

## Real browser acceptance

**42/42 native Chromium checks passed** at desktop 1600×900 and mobile 390×844, including:

- Exact native source SHA and 30fps/261 frames/one-shot direction, in both viewports.
- A fixed, circular, clipped site viewport across frames 0, 26, 52, 60, 90, 120, 134, 142, 149, 160, 175, 210, 260.
- Original Broth layer visibly painted at frame 160 and final hold; no empty-broth regression.
- No extra CSS zoom or crop animation and no horizontal overflow.
- F02 original chef playback unchanged.
- Full **natural-speed 8.7-second real native-browser WebM recordings** on desktop and mobile; both stop on frame 260 and hold the finished bowl.
- No JS runtime failures, original site assets still load.

See `docs/qa/f01-v4-circle-candidate/F01_V4_CIRCLE_ACCEPTANCE.json`, corresponding screenshots, and the original desktop/mobile real browser video files in that folder.

### Release boundary

Only `projects/restaurant-demo/` changed. No production commerce release, no new hosting service, no edits to CHAPCHITRA/THREADS/main. Existing staging is `https://zestry-v3-restaurant-review-20261117.onrender.com/`.

Owner creative sign-off is not implied by technical QA; the integration must still be visually reviewed. Any future request about chef or shape-tossing animation must be handled separately.
