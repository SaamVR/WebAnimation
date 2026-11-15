# ZESTRY Restaurant Demo — Strict Project Boundaries

This directory is a **self-contained restaurant portfolio demo** in `SaamVR/WebAnimation` on a dedicated branch. It is not part of Threads, CHAPCHITRA, Creative Motion Lab, EcomCMS or TingTune.

## Scope
- All restaurant-demo work stays under `projects/restaurant-demo/`. Never edit `site/`, `projects/chapchitra/`, `threads/`, existing root deployment configuration, or other project directories.
- Dedicated static frontend entry point: `index.html`; CSS/JS/assets are all local to this directory. No shared styles, globals, or build tools.
- Maintain bright original Food Lottie palette: forest green, tomato orange, saffron yellow, blue and mint accents. Do not introduce CHAPCHITRA branding.
- Use real licensed food photography (see CREDITS.md); no fictional customer reviews, address, staff identities, or claims presented as real.
- Checkout and table booking are explicitly simulated. Never collect payment details or transmit reservation/customer data.
- Import only owner-supplied original Lottie files. Do not recreate or substitute art/motion without approval. Missing exports remain honest visible placeholders.
- This branch is a review branch, **not** permission to merge into main or to deploy the other projects.

## Acceptance
- Independently test food filters, add-to-cart/quantity, demo checkout, reservation form, mobile navigation, reduced motion and no horizontal overflow.
- Browser QA before claiming complete; inspect responsive screenshots and fix geometry.
- When integrating any animation, preserve its JSON keyframes, frame rate, dimensions and colors. The iframe-based F05 player is kept isolated.
- Record actual tests, unresolved animation slots and source provenance in README before review.
