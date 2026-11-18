# ZESTRY V18 — Viewport-scoped playback and seamless chef loop

**Source:** existing ZESTRY Render demo on branch `deploy/zestry-v3-render-review-20261116`  
**Baseline release:** `8d66abc03f9dea4b490ef68a2542c2a1ea4742ba` (V17 broth SVG fix).  
**Scope:** `projects/restaurant-demo/` only. No unrelated work, no new Render service, no commerce production.

## Owner-requested fixes

### F02 Chef with floating vegetables

The source `f02-orbit.json` is a 210-frame 30fps animation, with 13 decorative orbit controllers (layers 72–84) ending roughly 800 composition units from their original position on average. Lottie native `loop:true` would snap the visible vegetables to their opening positions at every 7-second restart.

**Solution:** loop the **unmodified source** in a 14-second forward-and-reverse (ping-pong) cycle, using Lottie's `complete` event, `setDirection(-1)`, and `play()`, then returning to the original forward direction when frame zero is reached. The renderer does not reset the chef artwork on either turn. Original artwork, path data, masks, easing, timing and frame rate remain unchanged.

### All remaining scene animations

F01, F02 cooking, F03 coffee, F06 food preparation, F07 reservation, and F04 checkout-confirmation use their original Lottie playback with repeating `loop:true`. Each instance starts only while its **actual animation element** is in the viewport (rather than the entire tall mobile section), pauses when scrolled offscreen, and continues from its previous position on return.

- The underlying browser tab being hidden pauses all tracked Lottie instances.
- `prefers-reduced-motion: reduce` holds each animation at frame 0 rather than autoplaying.
- F04 is restricted to the checkout dialog and pauses after it is closed.
- F05 is a **user-controlled interactive book**; changing or resetting its page automatically would break navigation. Its existing near-view loading and offscreen canvas-loop pause remain intact; no autonomous page changes were introduced.
- All animations retain original 30fps keyframe rendering (`setSubframe(false)`).
- The approved F01 wooden background and uniquely namespaced SVG defs remain, preventing the broth mask regression; its scale stays **1.755x from first to last frame**.

## Evidence and QA

Native Chromium, including 1600×900 desktop and 390×844 mobile, completed **43/43 checks** with **zero reported regressions or JS/missing-asset errors**:

- Chef forward→reverse at the last frame→forward at the first frame; **no reset jump**. Both synthetic seam probes and **17.8-second actual live-speed browser recordings** passed on desktop/mobile; two turnarounds observed in each.
- F01 repeatedly plays after finishing a cycle while maintaining the original broth (31,061 desktop/7,219 mobile test pixels at the full bowl) and zero duplicated SVG IDs.
- Other page animations are repeat-enabled; F02 pauses at its last frame when scrolled out of view, frame stays unchanged, and resumes when returned, even for tall mobile layouts.
- Offscreen, document-hidden, and reduced-motion checks pass.
- F05 book→Starters→add illustrated item→bag, F04 loop while checkout modal is visible and pause on close, mobile/desktop layout checks pass.

Full report: `V18_VIEWPORT_LOOP_ACCEPTANCE.json` in this directory. Desktop/mobile original browser videos:

- `V18-desktop-chef-seamless-real-browser.webm`
- `V18-mobile-chef-seamless-real-browser.webm`

This is **demo/staging-only**. If approved for deployment, update the **same existing Render service** `srv-dbtkitifngtc73cua2p0`. Auto-deployment is disabled, so manually trigger exactly one deployment after merging. Verify actual public URL browser behavior and exact deployed SHA afterward. Do not merge into the repository's unrelated `main` branch.
