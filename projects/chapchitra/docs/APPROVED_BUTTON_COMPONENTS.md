# CHAPCHITRA — Approved button component systems

**Source of truth:** These are reusable website UI components, **not entries in the numbered animation catalog**. Do not assign or infer an animation identifier for a button from its physical-press or ink-swipe behavior.

## Compact SVG Button System
- 164 × 64 original Illustrator SVG, preserved handmade paths and independent face/shadow groups.
- Approved Press Green, Terracotta and Mushroom Gray palettes.
- Approved physical press, clipped Graphite ink wipe, mobile touch, keyboard focus and browser Back handling.
- Stable preview: `/buttons/compact/`.
- Component sources: `src/compact-button-runtime.mjs`, `src/button-system.css`, `src/assets/compact/`.
- Tests: `tests/compact.test.mjs` and `scripts/compact-browser-qa.cjs`.

## Long SVG Button System
- 320 × 54 original Illustrator SVG, all handmade vector paths and cutouts preserved.
- Same three owner-approved palettes, physical press and independent stationary shadow.
- Product Add to Bag: Graphite confirmation state, ADDED label only after cart success, visible Press Green returning swipe.
- Editorial CTA hover: clipped Graphite fill, correct contrast.
- Stable preview: `/buttons/long/`.
- Component sources: `src/long-button-runtime.mjs`, `src/button-system.css`, `src/assets/long/`.
- Tests: `tests/long-buttons.test.mjs` and `scripts/long-browser-qa.cjs`.

## Reserved animation catalog — do not conflate with UI components

The separately numbered and owner-approved website animations verified here are:

- **C01 — Connected Service Benefits:** four synchronized icon animations and connecting animation.
- **C08 — CHAPCHITRA Animated Roller Logo:** approved Wordmark Reprint animation and dark-background color treatment.

Other reserved animation identifiers must follow the separate owner-controlled creative animation plan. Their completion status must never be inferred from UI component development.

## GitHub workflow and change control

- Feature branches: `feature/chapchitra-compact-svg-buttons`, `feature/chapchitra-long-svg-buttons`.
- Owner review bases: `review/chapchitra-compact-buttons-approval-base`, `review/chapchitra-long-buttons-approval-base`.
- Shared nonproduction review deployment: `deploy/chapchitra-render-review`.

The renaming migration preserved original SVG bytes, Lottie geometry and timing, and cart/interaction functionality; Chromium and WebKit verified the renamed component APIs and unchanged rendered compact artwork. Git commit history and historic GitHub Actions run names are immutable and are not rewritten. Production merges still require explicit authorization.
