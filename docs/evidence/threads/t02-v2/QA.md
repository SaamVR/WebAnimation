# THREADS T02 V2 — real header cart browser QA (2026-10-19)

## Protected revisions
- User-approved T01 SHA: 73f792ca988779e97cd02b83ed6ff96c13024f30
- Recoverable checkpoint: checkpoint/threads-t01-approved-20261019
- Rejected T02 historical SHA: 9c1c5ce475696ce3942b80b73ea9d4ac0e28bbff (draft PR #9).
- V2 created on a separate branch from rejected T02; site/threads/t01-spotlight.mjs is untouched.
- No EcomCMS, T03 or T04 changes.

## V2 implementation
- Existing 384×317 pixel header cart PNG was inspected. Its original source pixels are presented through three separately transformable SVG groups (cart-basket, cart-wheel-left, cart-wheel-right) inside the real clickable #bag-button. Independently positioned #bag-count remains the only badge.
- Plain solid deep-forest-green #2E453A circle: no bag symbol, checkmark, product image or gold decoration.
- Token launch comes from measured lower-right of main product presentation, not Add to Cart. Product image remains untouched.
- Asymmetric curved GSAP MotionPath, real basket backward 6.2-degree anticipation, approximately 3 px visual impact dip and rebound; wheels react independently. Choreography timeline is approximately 1.89 s.
- The actual addCartItem mutation completes before visual success; no floating cart proxy or flying actual header.

## Actual browser evidence
Executed in Google Chrome 155 on authorized samvr source checkout at localhost, desktop 1440×900 and mobile 390×844.

- [Desktop Chrome recording (MP4)](desktop-real-chromium.mp4)
- [Launch](desktop-origin.png)
- [Cinematic sweep](desktop-650.png)
- [Actual header cart approach](desktop-1000.png)
- [Impact/settle](desktop-1350.png)
- [T01 search regression screenshot](t01-preserved-after.png)
- [18-check browser regression results](regression-qa.json)
- [Time-stamped desktop/mobile geometry states](browser-results.json)

PASS on desktop: actual cart SVG inside real nav cart link; exact one badge; post-mutation circle and flight; actual basket/wheel transforms; product image unchanged in source, style and geometry; authentic persisted count; two rapid clicks to count 3; no orphan animation; cart link navigates; reduced-motion count without flight; T01 Spotlight Search activates on four real Backpack results and settles; no JavaScript page errors. 37 source/contract tests pass.

MOBILE FIX (local browser VERIFIED; creative review remains pending): The existing product-page header becomes sticky only on mobile (same original navigation and real cart). If the genuine product image is offscreen after the customer scrolls to the Add to Cart button, the page smoothly reframes to that exact original image, launches the token from its lower-right, completes the arc into the real header basket, then restores the exact previous scroll position. The product photo itself is not transformed. The mobile GIF/MP4 and 25-check browser results are saved under [mobile-v2](mobile-v2).

Additional local browser evidence: [Mobile real-Chrome MP4](mobile-v2/mobile-source-browser.mp4), [Desktop real-Chrome MP4](mobile-v2/desktop-source-browser.mp4), [Mobile flight frame](mobile-v2/mobile-800.png), [Mobile near catch](mobile-v2/mobile-1550.png), [25-check local browser verification](mobile-v2/QA-browser.json). No proxy carts. Full mobile camera motion was checked at 390×844, with scroll Y 721 -> 74.5 -> 721, before/after matching, proper product source, real basket and independent wheel transform, cart count one and overlay removal.

Render public deployment and desktop/mobile browser verification are now complete: see [public Render QA evidence, including both real Chrome MP4s](deployed/QA.md). **Only subjective owner creative approval remains pending.** Keep PR draft. Do not merge to main or implement T03/T04.
