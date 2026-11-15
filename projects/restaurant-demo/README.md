# ZESTRY — Kitchen & Coffee

**Standalone, fictional restaurant website prototype** for the Food & Restaurant animation pack. The site lives at `projects/restaurant-demo/` on branch `feat/restaurant-lottie-bistro-demo-20261116` in `SaamVR/WebAnimation`.

**No unrelated project files are changed.** This is not part of Threads, CHAPCHITRA or the existing Creative Motion Lab deployment.

## The customer experience

The design uses the original Food Pack's bright forest, orange, yellow, blue and green palette, responsive editorial typography, real food photographs and purpose-built placement for original vector animations.

- Homepage, illustrated hero with F01, food menu with nine practical dishes and photos, and category filters.
- Quantity-adjustable ordering cart with browser-local cart state, sample checkout and animated F04 confirmation.
- Restaurant table date/party/time form, demonstration-only confirmation, intended F07 motion.
- Coffee section and kitchen section with F02 and F06 motion cards.
- Button for F05 standalone interactive menu asset, displayed in an isolated iframe once its original player is supplied.
- Accessible navigation, mobile menu, Escape-to-close dialogs, keyboard focus controls, lazy-loaded photos and reduced-motion support.

All prices, opening plans, restaurant identity and service actions are **illustrative examples**. This website does not accept actual orders, payments or table bookings.

## Run locally

Requires Node.js 20+ only; no build step:

```bash
cd projects/restaurant-demo
node scripts/dev-server.cjs
# open http://127.0.0.1:8766/
```

The Lottie player (bodymovin/lottie-web 5.12.2) is bundled locally in `assets/vendor/`. Google Fonts are optional and have system fallbacks.

## Browser QA

Install Puppeteer in your preferred environment, start the server, then run:

```bash
npm install --no-save puppeteer
node scripts/smoke.cjs
```

The script covers desktop menu/filter/cart/demo checkout/reservation/interactive-preview behavior plus 390px mobile navigation and overflow. Screenshots and QA JSON are written to `qa-output/` (ignored by git).

## Animation import status

| Role | Source | Integration status |
| --- | --- | --- |
| F01 pasta hero | `assets/lottie/f01.json` | Imported original approved vector Lottie |
| F02 chef | `assets/lottie/f02.json` | Imported final vector Lottie |
| F03 coffee | `assets/lottie/f03.json` | Waiting for original approved export |
| F04 order flow | `assets/lottie/f04.json` | Imported final breakfast/order journey Lottie |
| F05 interactive menu | `assets/lottie/f05-interactive.html` | Self-contained original interactive local QA player imported; official dotLottie-web runtime acceptance and final artwork review remain pending |
| F06-1 chop | `assets/lottie/f06-1.json` | Imported original vector Lottie |
| F06-2 mix | `assets/lottie/f06-2.json` | Waiting for approved export |
| F06-3 simmer | `assets/lottie/f06-3.json` | Waiting for approved export |
| F07 reservation | `assets/lottie/f07.json` | Waiting for complete verified export (do not use partial copy) |
| F08 signature dish | `assets/lottie/f08.json` | Concept planned; not produced |

**Do not mark the restaurant demo as motion-complete until the owner supplies/reapproves the pending artifacts and official player QA passes.** All missing animations fall back gracefully without breaking navigation or ordering.

## Content and source integrity

The nine food images are downloaded from the public Unsplash image CDN. See `CREDITS.md` for source IDs and credit policy. Photography is not generated, and the food titles, descriptions and prices are example menu content—not claims about an operating business.

## Deployment

Deploy `projects/restaurant-demo` as an independent static site root with its own preview. Do not change root `render.yaml`, `site/`, or CHAPCHITRA/Threads hosting. No deployment has been asserted by this README.
