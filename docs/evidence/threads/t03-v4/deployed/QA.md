# THREADS T03 — checkpoint restoration + visual 10%* card, deployed QA

**Technically verified; creative approval still pending. No merge.**

## Public preview
https://threads-t03-card-reveal-20261020.onrender.com/#deal

New Render static service `srv-dbbdsn6q1p3s73c8j3sg` in My Workspace, deployment `dep-dbbdsneq1p3s73c8j59g` **LIVE** at application SHA `431052caf668e6877048e18d128c4dfe1fd371ec`, auto-deploy disabled; no paid compute enabled. All earlier T01/T02/T03 preview and production services remain untouched.

## Actual Chrome recordings taken against LIVE Render
- [Desktop — 6.76 seconds, opening/reveal/closing](desktop-card-reveal.mp4)
- [Mobile — 5.60 seconds, opening/reveal/closing](mobile-card-reveal.mp4)
- [Closed endpoint](desktop-closed.png)
- [Discount card covering opened flap](desktop-opened.png)
- [Mid-lift / card emergence](desktop-opening.png)
- [Mobile open endpoint](mobile-opened.png)

## Exact scope of revision

1. Started from the user-named recoverable branch `checkpoint/threads-t03-stage-a-previous-20261019` at `e076bfc5316e7a39bb70747985a0106087f68661`, **not** from the rejected seven-layer T03 version. Reused the same Stage A GSAP flap rotation and timing.
2. Replaced only the T03 referenced artwork with the new owner closed/open image pair; source originals are preserved byte-for-byte under `site/threads/assets/t03-new-{closed,open}-20261020.png`. Closed 2048×1572 and open 1536×1024 were registered by image-feature landmarks, not stretched independently. `scripts/t03_v4_artwork.py` documents the alignment and reproduces the common 1090×1024 framing.
3. One decorative, noninteractive `10%` typographic card with corner `*` rises as the flap lifts and occludes its incomplete upper edge. The same GSAP timeline reverses and retracts it before the closed state. This is **NOT an active coupon, price adjustment or checkout discount**.
4. Restored existing CTA semantics (previous checkpoint's Stage A invitation); all other storefront sections and approved T01/T02 assets/source remain unchanged.

## Tests on deployed URL
- 37/37 repository source/contract tests passed.
- 21/21 deployed Chrome animation checks passed: desktop/mobile, original closed/open asset loading, open/close cycle, reversed and reduced-motion states, T01 spotlight.
- 17/17 deployed Chrome storefront regression checks passed: selected product gallery, cart mutation and count, invalid additions, cart navigation, checkout and mobile T01.
- 17/17 independent card-specific checks passed after correcting a test-harness assertion that tried to read `innerText` from the deliberately hidden rest-state element: confirmed 10%*, visible rise, foreground stacking, zero cart mutations and cleanup on closing.
- Zero browser JavaScript page errors.

Reports: [animation results](QA-browser.json), [storefront regressions](integration-regression.json), [card and checkout isolation](offer-regression.json).

## Git integrity
- T01 approved source module blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff` unchanged.
- T02 approved source module blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b` unchanged.
- Latest rejected layered T03 remains recoverable in its old isolated branch; no changes to `SaamVR/EcomCMS`.
- T04 untouched.
- Visual animation awaits explicit owner's creative approval.
