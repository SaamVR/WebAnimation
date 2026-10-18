# THREADS Batch 1 — LIVE deployed Chromium browser QA (2026-10-19 Asia/Dhaka)

## Ground truth
- Repository: `SaamVR/WebAnimation` and standalone site at `site/threads/`.
- Render static preview: https://threads-standalone-layout-review-20261017.onrender.com/
- Render final deploy: `dep-dbahnjeq1p3s73bnl140` — status **live**, source commit `161986934c4f0e3913cfa29372606c8ce47598a6`.
- Browser: Chromium 155 on the authorized `samvr` machine, using real network requests to deployed Render site (NOT a mockup or local-only screenshot).
- Test widths: desktop **1440 × 900** and mobile **390 × 844**.

## Passed checks
- Shop renders **39 unique clickable product cards** with genuine image assets (16 sneakers, 7 hats, 8 bags, 8 accessories); original four feature cards preserved and remaining categories interleaved.
- Search case/term matching: `Vintage Sneakers` → 10; `Sneaker` → 16; `Hat` / `Cap` → 7; `Backpack` → 4 actual backpacks (zero duffels); `Bag` → 8; `Accessories` → 8; nonsense query → 0.
- All returned image elements loaded and decoded successfully after enabling lazy loading for offscreen QA. Four tested product details: `sho-04` (sneaker), `hat-02` (cap), `bag-03` (backpack), `acc-05` (water bottle). Each displays the one genuine owner-supplied cover only; no fabricated front/side/rear views.
- UI flow tested: product detail → Add to Cart → Cart → simulated Checkout → successful Order Confirmation.
- Desktop and mobile screenshots captured from deployed source. No approved homepage/cart/checkout redesign or T01–T04 animation implementations.
- GitHub source QA: https://github.com/SaamVR/WebAnimation/actions/runs/39158204765 — **success**.

## Actual live browser screenshots
![shop-expanded-desktop](docs/evidence/threads/2026-10-19-batch1-live-shop-expanded-desktop.png)

![shop-expanded-mobile](docs/evidence/threads/2026-10-19-batch1-live-shop-expanded-mobile.png)

![search-backpacks-desktop](docs/evidence/threads/2026-10-19-batch1-live-search-backpacks-desktop.png)

![detail-sneaker-desktop](docs/evidence/threads/2026-10-19-batch1-live-detail-sneaker-desktop.png)

![detail-cap-desktop](docs/evidence/threads/2026-10-19-batch1-live-detail-cap-desktop.png)

![detail-backpack-desktop](docs/evidence/threads/2026-10-19-batch1-live-detail-backpack-desktop.png)

![detail-bottle-desktop](docs/evidence/threads/2026-10-19-batch1-live-detail-bottle-desktop.png)

![detail-cap-mobile](docs/evidence/threads/2026-10-19-batch1-live-detail-cap-mobile.png)

![order-confirmed-desktop](docs/evidence/threads/2026-10-19-batch1-live-order-confirmed-desktop.png)

## Remaining honest limitation
Owner-supplied **Batch 2 different camera angles** is not yet available. New galleries display real covers (one per product) until Batch 2. Names and BDT prices are demonstration merchandising metadata, not verified retail offers.
