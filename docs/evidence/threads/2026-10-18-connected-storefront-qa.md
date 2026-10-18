# THREADS connected storefront — deployed end-to-end browser QA

Tested live Render demo at deployed source commit `b7a5b166f9f24fa0c503169a1a61ab8b1a81ff08` on 2026-10-18. Subsequent search accessibility refinement `83f8b882503fbb12a14b4fd2df6e3d96bd3fe655` deployed afterward and CI passed. URL: https://threads-standalone-layout-review-20261017.onrender.com/ .

At **1440px and 390px**, Chromium/Playwright exercised: homepage left-expanding header search → "Vintage Sneakers" Enter → five related product results → selectable product detail (three crops of same photo; no invented alternate angles) → color/size selection, quantity 2 → Tk 11,980 persistent cart → validated checkout form → pending demo payment. Separate runs tested failure and cancellation retaining the cart and creating no order, and a successful payment creating exactly one persistent order and clearing cart. Invalid order URL denied. No JavaScript exceptions. No real payments or personal data transmission.

## Actual Chromium screenshots, not mockups
- [Desktop checkout pending](./2026-10-18-checkout-desktop-1440.png)
- [Mobile checkout pending](./2026-10-18-checkout-mobile-390.png)
- [Desktop order confirmation](./2026-10-18-order-desktop-1440.png)
- [Mobile order confirmation](./2026-10-18-order-mobile-390.png)

Functional state is client-only local/session storage; products and prices are demo examples, no external payment gateway. No T01–T04 choreography added and EcomCMS unchanged.
