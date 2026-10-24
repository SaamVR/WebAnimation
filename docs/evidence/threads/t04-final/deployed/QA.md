# THREADS T04 — final overlay and Safari-sized viewport refinement

**Live static review:** https://threads-t04-final-overlay-20261024.onrender.com

**Scope:** T04 presentation and validation refinement only. T01/T02 untouched; T03 static/on hold. No production or SaamVR/EcomCMS modifications.

## Render
- My Workspace separate Render static service `srv-dbeddn4s728c73bsnpig`.
- Deployed source SHA `5032401c433fbd3a000b01dd796ff96bd6b3b443`.
- Deploy `dep-dbeddnks728c73bsnq9g`, status **LIVE**, autoDeploy OFF.
- Earlier review/production services not overwritten.

## Actual browser recordings from the deployed URL

- [Desktop — full form → arbitrary sample fields → bare payment card/spinner/checkmark → confirmation](desktop-final-t04-review.mp4)
- [Mobile — full checkout and bare animation](mobile-final-t04-review.mp4)
- [Reduced-motion — same flow](reduced-final-t04-review.mp4)
- [Desktop processing frame](desktop-processing.png)
- [Desktop approved frame](desktop-approved.png)
- [Mobile processing frame](mobile-processing.png)
- [Mobile approved frame](mobile-approved.png)
- [WebKit iPad-like viewport screenshot](viewport/webkit-ipad-overlay.png)

## Implemented

1. Global shared real header sticky during upward/downward scroll; T01 search and T02 real cart retained with original source SHA.
2. `t04-viewport-stability.mjs`: focus/blur and `visualViewport.resize` keyboard-dismissing scroll recovery; no persistent checkout transforms. The fixed overlay uses `visualViewport.offsetTop/offsetLeft/width/height` so its 4px blurred backdrop covers the visible viewport even as Safari browser chrome / keyboard changes size.
3. Cardholder, test number, test expiry, test CVV now accept **any trimmed nonempty sample text**. No real card collection, format validation, or forced test number. Card fields are never forwarded to `startDemoPayment` or persisted/transmitted.
4. Card Details remains behind the overlay until existing Order Confirmation. No white modal box or pale approval stage, and no background-color swap on payment success.
5. Existing forest-green illustrated card and SVG checkmark GSAP trajectory preserved. CSS scales up the card/spinner/seal; the only visible status line is **Demo payment · No money charged.** Processing/failure/cancel/reduced motion still accessible.
6. Test-only flow commits real simulated success state before approval, with existing cancellation and error recovery.

## Public Render tests

- **37/37** source contracts
- **69/69** Chromium desktop/mobile/reduced-motion full checkout journey and sticky navbar tests
- **13/13** Linux WebKit and Chromium iPad-like visualViewport resize, keyboard-dismissal simulation, overlay coverage, sample-card acceptance and successful demo order tests
- **7/7** T01 Spotlight and T02 real-cart flight smoke checks
- **0** browser JavaScript errors

### Safari validation limit
These WebKit tests run on a connected Ubuntu machine with touch emulation and an 834×1112 iPad-like viewport. They are **not a physical iPad Safari test**. Real iPad keyboard animations and Safari toolbar/home indicator may still require final owner-device review. The tool-driven simulation supports, but does not prove, physical Safari behavior.

### Git integrity
- T01 module Git blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff` unchanged.
- T02 module Git blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b` unchanged.
- Approved T04 GSAP timeline, original green card and SVG checkmark remain unchanged. Only the visible status text is adapted.
- T03 static/on hold with no T03 animation scripts in the active branch.
- No live PSP/payment authorization. **Never submit real card details in this storefront.**
