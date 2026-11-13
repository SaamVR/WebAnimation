# CHAPCHITRA C03 — Site-Wide Staging Release

**Owner creative approval:** November 13, 2026. The previously approved GSAP motion geometry, easing, timing, bag bounce and counter feedback are frozen.

**Source checkpoint:** `8924d5ca31a278e6dae93d71d466f5f094532b29`.

## Scope
Site-wide Add-to-Bag visual animation on Home, Shop (including filtered and dynamically rendered cards), Product Detail, Related Products, Favorites, and future catalog cards reusing `.product-card[data-product-id]`.

The clicked card's `.product-visual .shirt-svg` is cloned, or Product Detail's `.detail-art .shirt-svg`. The card, paper frame, captions and backgrounds are never cloned. Product artwork stays stationary. The existing session quantity mutation occurs exactly once and before the visual animation. Rejected increments never start a flight. Artist's Edit's customized garment flow remains separate and untouched.

## Pre-integration evidence

On the isolated Windows local development runner, at the equivalent site-wide source patch:
- Node native tests: **217 passed, 0 failed**.
- Combined app build: **PASS**, including unchanged C02 SVG integrity checks.
- Cross-page browser verification: **137 passed, 0 failed** using desktop Chromium (Microsoft Edge), iPad WebKit and mobile WebKit.
- Original C03 regression suite: **50 passed, 0 failed**, including rapid clicks, scroll/resize, 99-per-product limit, reduced-motion and cleanup.
- Recordings: 3 browser WebM recordings plus 18 screenshots covering Home, Shop, filtered Shop, Product Detail, Related Products and Favorites.
- Local original SHA: `5a6b981597fdda80658ae41f0a1659d935ca6f75`; evidence ZIP: `F:\CHAPCHITRA-C03-SITEWIDE-20261113\C03_SITEWIDE_FINAL_REVIEW_20261113.zip`.

GitHub connector transfer recreates the same runtime source patch directly from the immutable staging base because the remote Windows runner reached its connector usage quota before publishing the local commit. The GitHub commit therefore has a separate SHA; CI must verify this exact GitHub commit before staged deployment.

**Deployment target:** existing Render service `srv-dbmu3ubbc2fs73auj78g`, branch `deploy/chapchitra-render-review`, URL `https://chapchitra-webanimation.onrender.com/`. Do not create another service or alter production.
