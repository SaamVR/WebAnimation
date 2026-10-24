# THREADS T04 — Centered Payment Overlay (2026-10-24)

**Status:** Placement refinement implemented; creative review pending.

## Change
- Primary Confirm Demo Payment button in existing left-column checkout form, beneath the delivery fields.
- Removed separate inline payment status/animation panels beneath the two-column checkout.
- Centered fixed modal dialog with translucent backdrop and a 4px CSS background blur.
- Pending: the same forest-green THREADS card plus restrained progress ring. Approval: the **identical existing card, SVG checkmark, and GSAP timing**. Only the previously forced scrollIntoView was removed from that animation module.
- Confirmed simulated success commits BEFORE success animation and holds completed state for 650ms before GSAP exit to existing Order Confirmation.
- Failure/cancellation remain inside overlay with Retry and Return controls; pending Escape/Close cancels the attempt.
- Focus trap/return, accessible role=dialog and aria-live, background inert, scroll lock, mobile and reduced-motion behavior.

## Boundaries
No real money is transferred; only existing simulated payment state is used.
T01 approved source blob: 46c96964f6757b3a99f9e7ee873fdffaca1f55ff
T02 approved source blob: f4813a8e6bb01d03f51a2a2b487d068fd95d719b
T03 static/on hold, no animation restored. No SaamVR/EcomCMS changes.

## Tests
- 37/37 repository source checks.
- 79/79 real Chrome browser checks (desktop/mobile/reduced-motion, validation, overlay geometry, blur, success order, failure/cancel/retry, Escape, focus return, cart, no JS errors).
- Real browser recordings: desktop.webm, mobile.webm, screenshots for processing/approved.
- Public deployed browser QA pending.
