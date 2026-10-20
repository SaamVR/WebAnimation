# THREADS T04 — Online Payment Approved / Demo animation

Stage: first implementation for visual review. This standalone storefront has **no payment processor**. There is **no bank charge**, **no payment authorization**, and **no real order fulfillment**. Its preexisting payment state machine is explicitly simulated.

T04 is a purely visual approval sequence on the existing separate Checkout page. User submits existing demo contact form, deliberately selects a simulated success/failure/cancel outcome, then `resolveDemoPayment('succeeded')` must commit successfully before a GSAP card+approval seal is shown. Failure and cancel show no success animation and retain cart. The genuine demo order reference is created before animation and then passed to the existing Order Confirmation page. Reduced motion skips animation and navigates directly. Pagehide cleanup avoids retaining timelines. Accessibility uses the existing aria-live checkout stage. No real card or billing data are collected or transmitted.

Visual palette remains approved THREADS cream/charcoal/deep green/light green. No T03 scripts, masks, promotional cards, assets, branches or timelines are present in this branch. Its static Deal uses one color-matched closed backpack. T01/T02 motion sources remain byte-identical to the approved SHA.

**Await owner creative approval before merging T04.**
