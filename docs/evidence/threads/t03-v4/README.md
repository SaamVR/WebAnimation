# THREADS T03 — Checkpoint flap + visual 10%* card (2026-10-20)

This work starts from the **exact** `checkpoint/threads-t03-stage-a-previous-20261019` at commit `e076bfc5316e7a39bb70747985a0106087f68661`, **not** from the rejected seven-layer version. The original 1.46-second opening/closing sequence, main flap rotation and masked interior choreography were retained.

## The two requested refinements

1. **Visual card:** One `10%` typography card with a corner `*` rises while the flap lifts, occupies the front layer to conceal the open-flap's missing upper edge, and retracts as the GSAP timeline reverses. The asterisk indicates terms apply. It is deliberately a **configurable demo placeholder** — it does **not** create a coupon, change totals or modify cart/checkout.
2. **Source artwork:** Owner's newly supplied color-matched closed `2048×1572` and open `1536×1024` RGBA sources are preserved unchanged at `site/threads/assets/t03-new-closed-20261020.png` and `t03-new-open-20261020.png`. Their file dimensions differ. `scripts/t03_v4_artwork.py` uses a robust feature-landmark alignment estimated from unchanged cap, shoe, and bottle surfaces; creates 1090×1024 common-frame crops and flap / buckle sprites. No recoloring or replacement artwork. Source PNGs remain unchanged.

### Preservation boundary

- Approved T01 module blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- Approved T02 module blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
- The previously rejected layered T03 remains recoverable at `feat/threads-t03-layered-invitation-20261020`, but was not merged or used for this revision.
- This revision stays in `feat/threads-t03-checkpoint-card-reveal-20261020`, separate from all approved services.
- No T04, no `SaamVR/EcomCMS` edits.

## Validation

The layout/source, actual Chrome motion, desktop/mobile, reduced motion, reverse closing, T01/T02 and storefront/cart/checkout checks are stored in `docs/evidence/threads/t03-v4/deployed`. Do not mark the motion creatively approved until owner reviews its MP4.
