# THREADS — motion release status (2026-10-20)

- **T01 — APPROVED.** Source and working Spotlight Search unchanged.
- **T02 — APPROVED.** Source and working Add to Cart unchanged.
- **T03 — ON HOLD — animation removed.** Deal of the Week is a static closed backpack with all existing content and Shop CTA. No opening, GSAP timeline, promotional card, trigger or experiment assets are included in this release branch. No T03 development is authorized.
- **T04 — NEXT PHASE: Online Payment Approved.** Existing checkout is an explicit *simulated* payment flow; work must not imply real charging, cards, PSP authorization or fulfillment. Implement and verify motion only around real demo state transitions on a separate branch.

This baseline was branched from the approved T02 source commit `ec7e32686be55a6f3bdc6acf954ac7757c111fb0`, not from rejected T03 history. No shared Git history was rewritten.
