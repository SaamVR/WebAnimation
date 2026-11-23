# CHAPCHITRA — PR #150 original SVG logo candidate browser evidence
Date: 2026-11-23

## Scope
Captured in real Playwright Chromium and WebKit browsers while loading the **public staging** origin `https://chapchitra-webanimation.onrender.com/`, with **only PR #150 candidate resources intercepted and substituted**. These captures are **not proof that PR #150 was deployed**; they are pre-merge source QA. See the post-merge staging release manifest for deployment verification.

## Visual proofs
- `desktop-light-frame0.png`, `desktop-light-frame239.png`: original light SVG cloth, C08 first/final frames.
- `desktop-dark-frame0.png`, `desktop-dark-frame239.png`: original dark inverted SVG cloth, Terracotta roller and canonical Cream lettering, C08 first/final frames.
- `desktop-light-C08-autoplay.webm`, `desktop-dark-C08-autoplay.webm`: uninterrupted full-viewport Playwright browser recording including 4-second original Wordmark Reprint playback, each theme.
- `ipad-dark-webkit-initial.png`: tablet WebKit candidate, distinct from physical iPad Safari testing.
- `theme-switch-replay-report.json`: verifies light→dark mid-flight frame continuation, no second autoplay, reverse theme after completion, dark and light navbar hover replay.
- `report.json`: five candidate browser profiles including reduced-motion and no horizontal overflow or missing assets.

## Frozen originals
The 3,066 source paths, all fabric tone/style definitions and the original `src/assets/c08/wordmark-reprint-original.json` remain untouched.
C08 dark owner-cream is a derived paint-only asset: 22 old-Cream fill triples updated to original owner Cream #F4EBE4; all source path geometry, transformations, keyframes, easing, triggers, layer names, speed and 240 frames at 60fps unchanged.

## Release boundary
Feature PR only; do not merge into main or production. The only approved integration destination is the existing `deploy/chapchitra-render-review` staging branch after required CI passes and serial integration is authorized.

## Footer contrast audit
The footer uses permanent Dark Olive `#1F2216` in both themes. The original light Press Green wordmark on that background was visually illegible in browser screenshots. Consequently the **original inverted** SVG is used there in *both* modes; layout, background, dimensions, original texture, and paint are unchanged. The theme-specific header and hero SVGs remain fully themed. `footer-light.png` and `footer-dark.png` show the corrected full-width footer in live-browser candidate override tests.
