# THREADS T02 V3 — final motion-only refinement

**Review status:** Technically verified, not creatively approved.

## Live review build
- New isolated static Render URL: https://threads-t02-v3-final-motion-20261019.onrender.com
- Deployment: `dep-dbb0kc7f3r2c73fr2t10` — live, serving source `b13f3c8a0ba52f24ef4953dab7d426d08aad736f`.
- Separate static service: `srv-dbb0kbnf3r2c73fr2sg0` in My Workspace, `autoDeploy=no`, publish path `site/threads`; no paid compute resource.
- Feature branch: `feat/threads-t02-v3-final-arc-scale-20261019`.
- Recoverable prior V3 checkpoint: `checkpoint/threads-t02-v3-approved-candidate-20261019`, at `6dc0458c3be7d7326bc9b2e308077c03fb5480cf`.
- Approved T01 unchanged: checkpoint `73f792ca988779e97cd02b83ed6ff96c13024f30`, source blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- Original V2 and V3 review preview services and PRs remain untouched.

## Actual Chrome 155 recordings from this deployed preview
- [Product Detail, desktop 1440 × 900 — 7.12-second MP4](pdp-desktop-final-review.mp4)
- [Product Detail, mobile 390 × 844 — 5.40-second MP4](pdp-mobile-final-review.mp4)
- [Desktop early arc](pdp-desktop-450.png)
- [Desktop basket approach](pdp-desktop-760.png)
- [Mobile arched motion](pdp-mobile-760.png)

## Exactly two motion refinements
1. **Continuous scale:** Preserves proxy's initial scale `1`, flight duration `0.91s`, translation easing, existing catch and badge timing. Replaces V3's two successive scale tweens with one smoothly progressing scale tween, whose reduction rate increases toward the final quarter. Determines entry scale from the **real** cart's rendered basket opening proxy — the smaller of 54% of cart SVG width and 50% of height, times an 82% fit factor — rather than using a fixed source-pixel size. Aspect ratio remains unchanged.
2. **Product Detail shallow arc:** Only when `document.body.dataset.page==='product'`, the existing x/y trajectory is replaced by **one quadratic SVG Bézier** through `GSAP MotionPathPlugin` with a control point derived from media frame, basket target and actual sticky header location. Same 0.91s flight duration and `power2.inOut` translation ease. Home, Shop and Search retain the **original x/y tween unchanged**. No source image, beige card or header icon was replaced.

No adjustments to basket/wheel keyframes, badge timing, sticky-header structure, T01 or existing storefront routes.

## Verification on the actual Render URL
- `37/37` Node source/contract tests PASS.
- `62/62` live Chrome choreography checks PASS across Product Detail desktop/mobile, homepage, Shop, Search mobile, reduced-motion and T01.
- `17/17` additional live Chrome regressions PASS for selected gallery variant, multi-add, badge synchronization, failed 11th add, cart navigation, checkout and mobile T01.
- Browser JavaScript exceptions: **0**.
- [Browser choreography telemetry](QA-browser.json) and [integration regressions](integration-regression.json).

**Visual qualification:** A preliminary local DOM bounding-box check showed a small number of frames where the full *transparent image rectangle* intersected the Product Detail title rectangle. This overestimates opaque-image overlap; it does not establish a visible pixel collision. The exact visual clearance must be evaluated from the desktop MP4 and remains subject to owner creative approval. Do not claim an objectively perfect title clearance without pixel-level review.

No T03/T04, no `SaamVR/EcomCMS` modification. Leave draft PR unmerged pending owner approval.
