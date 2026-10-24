# THREADS T04 — final checkout UI correction (2026-10-24)

**Review branch, not a real payment gateway; awaiting owner visual approval.** This release is isolated from T01/T02 and the static/on-hold T03.

## Implemented
- All storefront pages preserve the existing real sticky navigation/header cart on both downward/upward scrolling. No hide-on-scroll logic.
- The same two-step left checkout column and right "Your Order" summary remain intact.
- Cardholder, number, expiration and CVV are **required nonempty sample text**, with no test-number whitelist or card-format pattern. A trimmed nonempty sample string in every field enables Proceed to Pay. **Never enter real payment details.**
- Form card values remain only in the page's live input nodes while editing; they are never sent into `startDemoPayment`, saved in local/session storage, transmitted, or added to a URL. Input values clear on closing/pagehide.
- Card Details remains in place behind the centered payment animation until navigation to the existing Order Confirmation, with an uninterrupted backdrop.
- Former opaque white modal box and separate pale success panel are removed through scoped T04 overlay CSS. Same forest-green payment card illustration, existing spinner/check artwork and GSAP checkmark timeline remain. Their presentation is enlarged; a single visible status line reads **Demo payment · No money charged.**
- Fixed overlay tracks `visualViewport` size and offsets for mobile browser UI and keyboard changes and covers the visible viewport with 4px backdrop blur. Checkout focus/blur listener restores prior scroll position following the visual viewport's keyboard closing and does not permanently translate any page element.
- Focus trap, background inert/scroll-lock, Escape/close cancellation, error path with return control, successful simulated authorization and reduced-motion handling retained. No manual fake success/failure/cancel buttons.
- No production payment processing. For real cards, a hosted PCI-compliant provider UI and server-authoritative callback are required; this sandbox cannot accept real payments.

## Integrity and QA
Approved T01 code blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
Approved T02 code blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
T04 approval SVG/checkmark GSAP timeline unchanged; only user-visible status text changed.

- **37/37** source tests
- **69/69** full Chrome desktop/mobile/reduced-motion checkout, sticky navigation and order tests locally
- **13/13** cross-engine (Linux WebKit and Chromium in iPad-like viewport) viewport/keyboard-dismissal simulation, overlay coverage, sample-text field and order checks locally
- **0** JS page errors

**Safari qualification:** The WebKit test uses Playwright's Linux WebKit engine with a simulated 834x1112 mobile/touch viewport and viewport resize. It is NOT a direct physical iPad Safari keyboard test. Report this distinction; live-device Safari signoff remains recommended.

The deployed URL, final recordings and public-URL tests are recorded in `docs/evidence/threads/t04-final/deployed/QA.md` once verified.

No modifications to `SaamVR/EcomCMS`. No T03 animation reinstated.
