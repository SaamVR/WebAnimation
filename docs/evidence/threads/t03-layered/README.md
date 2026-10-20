# THREADS T03 — Layered flap invitation (Stage A only)

This replaces the former Stage A full-image masking experiment with the user-supplied seven **unaltered** 2048 × 1572 RGBA PNGs. No replacement artwork, separated straps, invented offers or buckle-release sequence.

## Source preservation

Original source sprites:
- `site/threads/assets/t03-layer-closed.png` — exact closed composite and stationary accessories
- `t03-layer-body.png` — backpack body below moving flap
- `t03-layer-rim-interior.png` — foreground opening rim and visible cavity
- `t03-layer-flap-exterior.png` — cream/orange front and **attached teal straps**
- `t03-layer-flap-underside.png` — uncropped upper orange flap underside
- `t03-layer-buckle-left.png` and `t03-layer-buckle-right.png` — separate attached buckles

`scripts/t03_stage_layers.py` creates shared-canvas 1085 × 845 view sprites by cropping **transparent outer margins only** (master rectangle x=470–1555, y=225–1070). It asserts all nontransparent artwork is inside the crop; the original seven uploaded PNGs stay unchanged. All seven output sprites have identical dimensions, registration, and pixels.

## Interaction

- One subtle wiggle invitation via IntersectionObserver when the Deal section enters the viewport.
- Pointer hover: open; pointer leave: close (unless pinned by click).
- Click/tap/keyboard Enter/Space: toggle pinned open/closed. Escape closes.
- Master GSAP timeline is reversible *from its current time* on interruption/repeat.
- **Single moving flap rig** holds exterior, left buckle and right buckle, with teal straps already part of exterior art. No buckle detachment. The underside and rim are revealed beneath it. Full closed plate stays underneath to keep unrelated accessories still.
- Reduced-motion switches endpoints immediately, retains interaction.
- Existing Shop the Deals CTA retains its genuine `/search/` destination instead of being hijacked for Stage A.

## Protected work and release boundary

- T01 Spotlight Search module blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff` unchanged.
- T02 current source module blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b` unchanged.
- Previous T03 Stage A snapshot: `checkpoint/threads-t03-stage-a-previous-20261019` at `e076bfc5316e7a39bb70747985a0106087f68661`.
- New implementation branch: `feat/threads-t03-layered-invitation-20261020`.
- No edits to `SaamVR/EcomCMS`, no Stage B cards, and no T04 implementation.
- Creativity requires owner approval; do not mark T03 approved or merge an unreviewed draft PR.

## Verification
Desktop and mobile Chrome interaction QA, reduced motion, fast reversals, T01 Spotlight regression, and storefront cart/checkout regression evidence in `docs/evidence/threads/t03-layered/deployed` after deployment.
