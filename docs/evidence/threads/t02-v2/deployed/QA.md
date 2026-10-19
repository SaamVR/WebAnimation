# THREADS T02 V2 — independent Render deployed-browser QA (2026-10-19)

## Public preview and immutable release identifier
- URL: https://threads-t02-v2-review-20261019.onrender.com
- Render service ID: srv-dbauvcbncjis73ahfeu0 (NEW static site; does NOT share deployment with T01).
- Render deployment: dep-dbauvcrncjis73ahffu0 — LIVE.
- Deployed application SHA: df788e0f20d02f21c0686f56adf4cbea07b28e05
- Render workspace: My Workspace (tea-d1ihdsbipnbc73bpc8f0).
- Static site, publish path site/threads, build check only, automatic deploy DISABLED, no paid compute.
- Service configured from feat/threads-t02-v2-real-header-cart-20261019.
- Later evidence-only commits do not redeploy; deployed source remains the SHA listed above.

## Real browser playback recordings — PUBLIC URL, not localhost
- [Desktop actual Chrome capture (MP4)](desktop-render-browser.mp4), viewport 1440 × 900.
- [Mobile actual Chrome capture (MP4)](mobile-render-browser.mp4), viewport 390 × 844.
- Mobile keyframes: [origin and camera reframe](mobile-800.png), [mid-flight](mobile-1150.png), [basket/wheel reaction](mobile-1550.png), [settling](mobile-1830.png).
- Desktop keyframes: [lift](desktop-800.png), [approach](desktop-1150.png), [catch](desktop-1550.png), [settle](desktop-1830.png).

## Verification
The deployed public URL passed 25 browser choreography checks, plus 9 additional persisted-cart and reduced-motion checks, with **zero** JS page errors.
- From actual product display geometry, symbolic plain deep green circle launches; main gallery image source and style remain unchanged.
- The actual original #bag-button stays anchored and clickable, with the same PNG shape/artwork split into articulated SVG cart-basket, cart-wheel-left and cart-wheel-right groups.
- Real basket and separate wheel transforms are observable during the catch; there is no additional cart, no second quantity badge and no bag icon in the token.
- Mobile: actual header remains sticky when CTA scrolled down. After genuine cart mutation, smooth camera reframe shows the same original product image, token emerges and flies to the real header cart; browser returns to pre-click scroll position (observed 721 → 74.5 → 721 CSS px).
- Cart count reflects truth: 10 consecutive successful adds → 10. An 11th is rejected by the real per-variant limit. Cart link/navigation still shows 10 after transition.
- Rapid clicks clean up old animation, with no orphan overlay. At reduced motion mobile, genuine cart count increases without flying token or involuntary scrolling.
- Existing T01 still displays four real Backpack matches, animates Spotlight Search and clears itself.
- The exact T01 JavaScript module blob SHA remains 46c96964f6757b3a99f9e7ee873fdffaca1f55ff.

Machine-readable QA: [choreography results](QA-browser.json), [cart mutation and reduced-motion regression](deployed-cart-regression.json).
Local Node tests: 37 passing, 0 failing.

## Release boundary
This confirms implementation and technical browser behavior, NOT creative sign-off. PR #10 stays DRAFT. T01 preview, checkpoint and production services were not modified. Do not begin T03/T04 until the owner visually approves T02.
