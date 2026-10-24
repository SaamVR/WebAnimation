# THREADS T04 — checkout and sticky header verification

## Live preview
https://threads-t04-sticky-checkout-verified.onrender.com

Deployment `dep-dbednb8n74is73ed7360` on separate Render static service `srv-dbednaon74is73ed70e0` (auto-deploy disabled). App source SHA `a0e67ab4710336355ede55ce7868e596928c0ca0`.

## Public URL recordings
- [Desktop complete checkout and payment: 14.76 seconds](desktop-verified-review.mp4)
- [Mobile complete checkout and payment: 15.08 seconds](mobile-verified-review.mp4)
- [Reduced motion: 9.04 seconds](reduced-verified-review.mp4)
- [Desktop dedicated Card Details](desktop-card-details.png)
- [Desktop payment overlay](desktop-processing.png)
- [Desktop approval](desktop-approved.png)
- [Mobile payment overlay](mobile-processing.png)
- [iPad-sized WebKit overlay](viewport/webkit-ipad-overlay.png)

## Scope
This is a narrow verification/hardening pass from the final T04 branch. The requested **Cart → Contact & Delivery → Card Details → Proceed to Pay → Payment Animation → Order Confirmation** flow was already implemented in `5032401`. This patch removes literal backslash-N characters that had malformed the optional final sticky-header CSS override. The preexisting valid sticky-header rule remains in place. Both upward and downward scrolling retain the real header and actual cart throughout Shop, Search Results, Product Detail, Cart, Checkout, and Order Confirmation.

The right-hand summary, card details step, sandbox-only nonempty sample fields, centered forest-green card, spinner/checkmark and 4px backdrop blur are unchanged from the owner-approved T04 design branch. The flow is simulated and never collects live payments; never enter real payment credentials. Inputs aren't passed to `startDemoPayment()` or persisted in browser storage. Failure/cancellation recovery doesn't expose developer outcome buttons.

Approved T01 module Git blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
Approved T02 module Git blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
T03 remains static and on hold. `SaamVR/EcomCMS` was never modified.

## Public Render QA
- **37/37** source/contract tests
- **69/69** Chromium desktop, mobile, and reduced-motion complete checkout; tested disabled Proceed button before valid fields, contact-step validation, nonempty arbitrary sample fields, overlay accessibility, real demo order reference, and sticky header.
- **13/13** Linux WebKit and Chromium iPad-sized visual viewport/keyboard-dismissal simulations, overlay coverage and successful test checkout.
- **7/7** T01 Spotlight and T02 real-cart animation checks.
- **0** browser JavaScript exceptions.

### Important Safari limitation
Linux Playwright WebKit and touch/visualViewport simulation do **not** establish physical iPad Safari keyboard correctness. Test on the owner's iPad is still required for definitive device-specific signoff.

No unrelated storefront modifications, production merge, or additional T03 work.
