# THREADS T04 — Online Payment Approved (demo choreography)

**Status: T04 first implementation live, technically tested; owner creative signoff pending.**

## Preview
https://threads-t04-payment-approved-20261020.onrender.com/checkout/

To test, first add an item from the homepage/Shop/Product Detail, open Checkout, complete the demo form, click "Start Demo Payment", and choose "Approve demo payment". This is not a bank transfer or real payment gateway.

## Verified scope
- Genuine simulated transaction state via existing `resolveDemoPayment('succeeded')` is committed BEFORE the UI animation.
- A premium green digital THREADS visual card emerges; a circular green approval seal expands and its outline and check stroke draw in one coordinated GSAP timeline.
- A successful demo approval is labeled clearly as **DEMONSTRATION** and **No money was charged**. Route to the existing verified Order Confirmation after the animation.
- No real processor, no billing/card collection, no real payments, no discount, no separate fabricated order.
- Failed / cancelled paths remain as existing and do not animate approval or remove cart; rapid multiple clicks are guarded.
- Accessible live status and reduced-motion immediate approval routing.
- Uses existing verified GSAP vendor bundle. T04 CSS is scoped to Checkout.
- No T03 GSAP, assets, cards or handlers are present on this branch: `T03 — ON HOLD`. Deal of the Week remains one static color-matched closed backpack.
- Approved T01 source Git blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`; approved T02 source Git blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`. Both unchanged.

## Render deployment
- Isolated static service: `srv-dbbecc3bc2fs73at6uq0` in My Workspace.
- Deploy: `dep-dbbeccjbc2fs73at6vqg`, status LIVE, source commit `0c9b4c0e6e87d7ca3bfce462c088dd6be1655ecb`.
- Auto deploy disabled; no paid compute resource created.
- Static clean baseline separately deployed at https://threads-static-deal-t04-baseline-20261020.onrender.com/ — baseline SHA `d386cea20cee713dbc7b193509531df9bad9dc44`.

## Browser evidence
- [Desktop Checkout approval MP4](desktop-approved-review.mp4).
- [Mobile Checkout approval MP4](mobile-approved-review.mp4).
- [Reduced-motion approval MP4](reduced-approved-review.mp4).
- [Desktop screenshot during approval](desktop-approved-approved.png).
- [Mobile screenshot during approval](mobile-approved-approved.png).
- [Approval/Failure/Cancel browser checks](QA-browser.json).
- [Storefront cart/checkout/T01 regression](integration-regression.json).
- [T01 and T02 complete deployed motion regression](t01-t02-QA.json).

Verified independently on the live public Render URL: **34/34 T04 checks passed**, **17/17 storefront regressions passed**, and **37/37 source checks passed**, with zero page JavaScript errors. T01/T02 full-motion check recorded separately.

## Cleanup / limitations
Old T03-only PR #13, #14, #15: closed, unmerged. Four T03-only remote Git branches deleted. Shared historic commits were not rewritten. **Old T03-only Render static services remain pending manual deletion**, because the available Render integration provides no deletion operation and authorized remote has no Render API key/CLI. Do not claim they are gone. Dashboard:
- https://dashboard.render.com/static/srv-dbbdsn6q1p3s73c8j3sg
- https://dashboard.render.com/static/srv-dbbd2gbrjlhs73dqsdag
- https://dashboard.render.com/static/srv-dbb1sjeq1p3s73dhk2mg

No `SaamVR/EcomCMS` modifications; no merging or production deployment.
