# ZESTRY V17 — final performance-optimized demo, native QA

The approved **fixed 1.755× V16** F01 art remains constant from frame 0 through 260, with the original 756.6px wooden circle, yellow accent and every original vector/keyframe preserved.

## What changed

- Each supplied Lottie uses its authored 30fps, avoiding unnecessary 60Hz subframe SVG redraws. F01 sets its fixed CSS scale only once.
- The interactive F05 menu iframe and its 4.2MB Lottie ZIP no longer download during the hero. Loading starts when the menu nears view or the visitor navigates toward it.
- F05's previously perpetual idle RAF is stopped; when offscreen, its animation is paused and its progress retained, then resumed when visible.
- 19 photographs have quality-88 WebP equivalents; the original JPEG files are retained, no cropping or changes to scene content.

## Browser evidence

- Real Chromium visual comparisons at F01 frames **0, 22, 60, 128, 240, 260**, desktop and mobile. All 12 comparison checkpoints match the approved visual geometry.
- Actual full-playback desktop/mobile WebM recordings end at the unchanged final F01 hold, zoom **1.755**.
- The F02 orbit/cooking, F03 coffee, F06 process, and F07 animation sections load and advance with 30fps subframe mode disabled.
- F05 book Closed→Overview→Starters and add-to-bag passed. F04 checkout-only 8s confirmation and F07 simulated booking passed. Mobile navigation, lazy menu loading, no horizontal overflow and no browser or local asset errors passed.
- A CPU-throttled browser profiler and photography compression metrics are included. Shared runner CPU/disk contention makes desktop frame-time readings variable; do not promise a fixed 60fps across all devices.

## Release

Only `projects/restaurant-demo/` changed. The same existing Render service `srv-dbtkitifngtc73cua2p0` must be reused. The final user-facing site remains a fictional restaurant demonstration, not a production commerce/reservation platform.
