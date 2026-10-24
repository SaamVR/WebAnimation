# THREADS T04 — Checkout steps and sticky header (2026-10-24)

**Review build, not approved for production payment collection.** T04's existing forest-green card, SVG checkmark and approved GSAP timeline are unchanged (Git blob `c13b4f00a5b33c5145464c1ae94725cc43c61e5a`). No new artwork.

## Journey

Cart → Contact & Delivery → Card Details (TEST ONLY) → Proceed to Pay (existing right-hand order summary) → centered T04 processing/approval overlay → existing Order Confirmation.

- Contact form uses browser required/minlength/type constraints and the existing `startDemoPayment()` validation. The contact step does not disappear until valid.
- Card Details accepts **only dummy sample test values** `4242 4242 4242 4242`, expiration `12/30`, and CVV `123`; cardholder name is a demo string. **Do not enter a real card.** This is not a payment provider-hosted form and cannot process real payments.
- `Proceed to Pay` stays disabled until the contact step is completed and visible test-card fields validate. The CTA lives **inside the pre-existing right-hand order summary box**, not in a duplicate inline payment panel. The contact form and card step share its existing left column.
- Only allowlisted contact fields pass to `startDemoPayment`; the card number, expiration, CVV, and cardholder name are never forwarded to the state machine, URL, network, localStorage or sessionStorage. Test inputs are cleared as soon as processing begins, on closing and on page unload.
- The existing centered 4px-backdrop-blur T04 overlay displays the existing green card and the pending animation, then deterministically resolves the demo attempt after a brief simulation. **A committed simulated success is required before approved artwork/checkmark or confirmation navigation.** There is no real acquirer, authorization, bank charge or actual transaction.
- Removed customer-visible artificial success/failure/cancel simulation selector buttons. The overlay close control cancels the pending attempt without creating an order; genuine errors remain inside the overlay with return-to-card-details recovery.
- Focus is contained within the accessible dialog, background is inert and scroll-locked, focus restores on cancellation, and reduced motion skips choreographed movement.
- Shared `#site-shell > header.site-header.store-site-header` is explicitly sticky in `storefront.css` across Search/Shop, Product, Cart, Checkout and Order. Uses the real persistent header cart, not a proxy.
- T01 Spotlight Search, T02 product-to-cart flight, and the visually approved T04 card/checkmark module are byte-identical to the prior branch. T03 is static/on hold and unchanged. No modifications to `SaamVR/EcomCMS`.

## Security boundary

This frontend-only design is a **sandbox demonstration**, not PCI-compliant live card acceptance. Production must replace all local card entry with a certified PSP's hosted fields/redirect and a server-authoritative payment callback. Do not reuse this sample card form for real buyers.

## QA

37 source contracts; desktop/mobile/reduced-motion browser checkout journeys; sticky-nav measurements after scrolling on all storefront routes; rejected test cards, pre-pay gate, pending spinner, actual demo success, order confirmation, no card data in storage, cancellation and cart preservation; separate T01/T02 source hashes; recordings provided in `docs/evidence/threads/t04-card-step/deployed`.

No merge to production and no T03 animation development without explicit approval.
