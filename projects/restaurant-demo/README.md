# ZESTRY — Kitchen & Coffee

A standalone **food-and-restaurant website portfolio prototype** built in `SaamVR/WebAnimation`.

- **Branch:** `feat/restaurant-lottie-bistro-demo-20261116`
- **Path:** `projects/restaurant-demo/`
- **Production boundary:** No imports, code, CSS, asset paths, or build dependencies from Threads, Chapchitra, Creative Motion Lab, or EcomCMS.
- **Brand concept:** ZESTRY · Kitchen & Coffee · “Freshly made. Happily served.”
- **Palette:** Forest `#153F31`, orange `#EF5D32`, yellow `#FFBF39`, sky blue `#65C8E8`, mint `#92D9B0`, clean white.

## Run locally

```sh
cd projects/restaurant-demo
python3 -m http.server 8195
# http://localhost:8195
```

No bundler, production database, API tokens, real payment service or reservation vendor required. Images and the Lottie renderer are stored locally; the optional web fonts have system fallbacks.

## Functional journeys

1. Homepage with hero, real food photos and F01 pasta-vector animation.
2. Filterable 9-item restaurant menu; prices and names are clearly illustrative.
3. Food cards with add-to-cart, quantity adjustment, remove, subtotal and a sample pickup checkout.
4. F05 original **interactive restaurant menu** in a self-contained modal: original menu/page-turn motion retained.
5. F02 Chef in Action, F06-1 chopping animation and other cooking/coffee modules.
6. Demo-only table booking with date, time, party size and a confirmation scene.
7. Accessible keyboard/ESC closing, focus handling, responsive layouts and reduced-motion fallback.

No customer payments or real restaurant reservations are transmitted. The order cart uses localStorage only; form entries are held in the browser UI and never sent to a server.

## Animation inventory

See [MOTION_INTEGRATION.md](MOTION_INTEGRATION.md) for the exact verified inventory. Only authentic supplied vector Lottie exports may be called “animated”; static fallback drawings are explicitly marked.

## Source and photo license

See [CREDITS.md](CREDITS.md) for each local food photograph's original Unsplash asset URL and the Unsplash License. The stock photography illustrates a fictional restaurant, not a real kitchen or product.

## Validation and release

Local browser QA verified 9 menu cards, category filtering, cart, checkout, reservation, original F05 canvas loading, and mobile navigation. All approved source projects remain unchanged. A failed/missing Lottie asset falls back gracefully instead of generating a fictitious substitute. **No production release or main-branch merge is authorized by this milestone.**

## Integration ownership

All edits must remain under `projects/restaurant-demo/`. Do not touch root `render.yaml`, repository workflows, `site/`, `projects/chapchitra/`, Threads release branches or unrelated projects. Keep this as a separate hosted application with its own explicit deployment root if a staging URL is provisioned.
