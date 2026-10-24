# THREADS T04 — two-step sandbox checkout and sticky navbar

**Release status: deployed to isolated Render preview; technical QA passed; creative approval pending.**

## Public working preview

https://threads-t04-checkout-sticky-20261024.onrender.com

New Render static service `srv-dbecd3rncjis73dq2ddg`, deployment `dep-dbecd43ncjis73dq2ev0` **LIVE**, pinned to source commit `8e7a1fc6858c29d966d9ef122a7f340261753b85`. Auto-deployment disabled, static starter resource; previously approved previews and production left untouched.

## Actual Chrome recordings made against the public Render URL

- [Desktop: 13.60-second complete checkout, demo card, centered processing and approved check](desktop-checkout-review.mp4)
- [Mobile: complete checkout and approval](mobile-checkout-review.mp4)
- [Reduced motion: same test-only purchase path](reduced-checkout-review.mp4)
- [Desktop dedicated Card Details step](desktop-card-details.png)
- [Desktop approved processing overlay](desktop-approved.png)
- [Desktop green card processing state](desktop-processing.png)
- [Mobile dedicated Card Details step](mobile-card-details.png)
- [Mobile approved overlay](mobile-approved.png)

## Exact changes

- Existing left checkout column becomes **Step 1 Contact & Delivery** with original required fields, followed by **Step 2 Card Details** in the same location. Continue is validated before advancing; Back preserves contact values.
- Cardholder name, test card number, expiration and CVV fields are explicitly **sandbox/test-only** and accept ONLY published dummy values: `4242 4242 4242 4242`, `12/30`, `123`. Live card details are rejected; **never enter real payment data**.
- Primary **Proceed to Pay** button moved inside the existing right-side Your Order summary below Total. It is disabled until Step 1 and Step 2 are valid and Card Details is visible. Right-hand order items and layout unchanged.
- No manual demo buttons for success/failure/cancellation; payment overlay automatically simulates a deterministic result and commits `resolveDemoPayment('succeeded')` before displaying approval. The overlay maintains the previously approved dark-green card, spinner, SVG checkmark and timing. Failure remains handled inside the same dialog with a return control, and closing before success cancels the attempt without creating an order.
- After committed demo success, show approved animation briefly then navigate to the real demo Order Confirmation route.
- Dialog remains centered, with 4px backdrop blur, focus trap, background inert/scroll lock, accessible focus recovery and reduced motion.
- **Sticky REAL header:** explicit shared shell rule in `storefront.css`. Tested after scrolling Shop, Search Results, Product Detail, Cart, Checkout and Order Confirmation on desktop/mobile/reduced-motion. Real basket/cart icon and navigation stayed anchored; no proxy cart.
- **No card details leave the form.** Only allowlisted contact values pass to `startDemoPayment`. Test number, expiry, CVV and cardholder name are not sent to state machine, saved to localStorage/sessionStorage, network, or URL; card inputs clear upon processing, cancellation and pagehide.
- Existing closed backpack remains static; T03 ON HOLD. No T03 scripts and no `SaamVR/EcomCMS` modifications.

## Verified public-URL results

- **37/37** source/contract tests pass.
- **69/69** Chromium end-to-end checks pass at this Render URL: the complete step-by-step flow on desktop/mobile/reduced motion; blocking incomplete contact and invalid card; summary pay enablement; centered overlay; 4px blur, inert backdrop; no manual outcome buttons; success/Order Confirmation; cancellation and cart persistence; zero card data in storage; every sticky-header route.
- **7/7** independent public-URL T01 Spotlight Search and T02 real-cart flight smoke tests pass, including correct badge and cleanup.
- **0** browser JavaScript exceptions.

Previous approved sources preserved:
- T01 spotlight module blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- T02 fly-to-cart module blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
- T04 approved payment card/checkmark module blob `c13b4f00a5b33c5145464c1ae94725cc43c61e5a`.

## Security qualification

**This is a frontend-only payment simulation**, not a secure real-payment integration. No PSP tokenization, server authority or real authorization occurs. For production, replace local dummy fields with certified payment provider hosted fields or redirect and server-verified callbacks. Do not enable real card collection on this branch.

**Do not merge until owner reviews the recordings.** T03 remains static/on hold.
