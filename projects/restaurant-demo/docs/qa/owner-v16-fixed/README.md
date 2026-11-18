# ZESTRY V16 — fixed full-size animation from the first frame (review only)

**[Certain] No deployment or merge:** This version is isolated in draft PR #131. The existing Render service still serves V15 merge `b7ee93ac36326e59ae35e74c36d71782fa459b18`.

## Owner's correction

The V16 foreground bowl **and each ingredient's rendered artwork** must start and remain at the same size shown in the previous V16 final frame. The earlier camera scale animation, from 1.0× to 1.755×, was unintended and has been removed. The camera now stays at **1.755× V14 = 1.30× deployed V15 final artwork** throughout all 261 frames (8.7 seconds).

The original wooden tabletop circle (756.6px on desktop), yellow accent, original F01 vector artwork, layer order, keyframe timestamps/easing, F04 checkout confirmation, F05 interactive menu and other features are unchanged.

## Entrance-path correction, not zoom

A fixed 1.755× camera caused the original flying ingredients to be cut off at the circle's edge. Consequently, the *positions of moving ingredient centers* were retargeted for their initial entrance: a calibrated radial factor of **0.26** through keyframes up to frame 68, smoothly settling to **0.82** by frame 92. Individual ingredient dimensions and the bowl's dimensions do **not** grow at any point. Only flight trajectories change; this is the minimum factor among tested candidates that passed the browser circular-edge screen. The original canonical `f01.json` is preserved; V16 is a separate `f01-v16.json` within the review package.

## Browser and visual evidence

- **Full frame scan:** 261 native Chromium frames across 1600×900 desktop, 768×1024 tablet, 390×844 mobile
- **Camera factor:** 1.755 at frame 0, every intervening frame, and the final hold; no runtime zoom or scale tween
- **Boundary safety:** Zero outer 4% circle-band warnings on any of those three viewports in the final fixed-size candidate
- **Functional rendering:** Original wooden SVG, responsive circular frame, no horizontal overflow, JavaScript errors or missing site-origin assets
- **Natural-speed recordings:** `desktop-V16-real-browser.webm` and `mobile-V16-real-browser.webm`
- **Reduced motion:** same fixed 1.755 scale
- **Comparative image:** `V16-static-first-frame-vs-original-zoom.png` shows the old undersized opening versus the corrected full-sized opening
- **Machine-readable evidence:** `V16_CHROMIUM_ACCEPTANCE.json`, `V16_ENTRANCE_SWEEP.json`, `V16_SELECTED_EARLY_FACTOR.txt`

## Independent creative review pending

The very tight early trajectories required to avoid clipping could alter how the ingredients feel during their entrance. This is technically QA-passing, but **do not claim owner creative approval** until the user reviews the actual desktop and mobile recordings. The user expressly requested **no deployment**. Do not merge PR #131 or modify the existing Render or Vercel deployments without new authorization.
