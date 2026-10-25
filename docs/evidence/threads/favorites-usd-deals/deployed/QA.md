# THREADS — Favorites, USD catalog and expiring Deals / Offers

**Status:** Live isolated Render review, owner approval pending for new features.

## Live preview
https://threads-final-gallery-replacement.onrender.com
- Dedicated offers: https://threads-final-gallery-replacement.onrender.com/deals/
- Shop: https://threads-final-gallery-replacement.onrender.com/search/

## Features

### Identical favorites SVG
- Shared `site/threads/favorite-icon.mjs` draws one exact 24×24 SVG path, 1.8 stroke, forest-green `#2E453A` on the real navbar control and every Home, Shop, Search, Deals and Favorites card.
- Product hearts use `aria-pressed`, subtle green fill in selected state, and central local favorites storage (existing key `threads.demo.favorites.v1`). Navbar selected indication updates on favorite changes; Search favorites filter reflects actual saved IDs, no duplicate favorites data.
- Responsive card placement and focus-visible state remain accessible. Existing T01/T02 images and card click behavior preserved.

### USD demo catalog and transactional consistency
- All 38 individual prices in the shared catalog are intentional demo **USD** retail values, not converted BDT totals. Product categories: sneakers ~$55–100; caps $18–30; backpacks/duffels $40–100; belts/bottles $15–35; watches/headphones $40–120.
- Shared `moneyUSD` gives en-US `$#,##0.00` formatting across Home, Shop, Search, Detail, Deals, Cart, Checkout and confirmation.
- Shared `dealUnitPrice(product, at)` and `cartSummary(at)` apply savings and cent-rounded extended totals automatically; actual demo order snapshot records paid discounted line amounts and totals. No real card/payment data is stored or transmitted.
- Payment flow remains the approved simulated checkout with hosted/real payment claims excluded.

### Real fixed-expiry demo offers
- One configured timestamp **2026-11-08T23:59:59Z** (UTC) for every visitor, never stored as a per-session deadline and never reset on refresh.
- Homepage four-slot DAYS/HOURS/MINUTES/SECONDS clock ticks every 1000 ms and links to `/deals/` using existing Grab The Deal CTA.
- A dedicated Deals page presents eight real catalog products: sneakers n1, sho-04, sho-06, sho-08; accessories hat-04, acc-03; bags bag-01, bag-05.
- **15%** reduction for all eligible products until expiry; display original struck-through USD price, discounted USD price, percent ribbon and dollar savings. Shop keeps existing All Products + three categories and adds only a Deals link.
- When expired, labels read `Offer Ended`, unit price becomes the standard price, cart/checkout update, and pending discounted demo authorization is refused if the deadline passes while paying.
- The approved T04 processing card/checkmark visual is unchanged.

## Browser and source verification against live Render

- **57/57** source and contract tests for commerce + existing storefront behavior.
- **10/10** public browser interaction checks (countdown ticking, heart path equality, selected favorite, favorites filter, eight deals, original/discounted prices, discounted cart line and USD savings), zero JS errors.
- **89/89** public gallery/product/storefront regression checks.
- **7/7** public T01 spotlight and T02 real cart flight checks.
- **69/69** public approved T04 checkout complete-flow checks.
- Desktop Chrome and iPad-sized Linux WebKit screenshots captured. These are emulator/desktop-browser views, **not physical iPad Safari**.
- The browser review revealed one cart discount-expiry scope bug (`bag is not defined`), which was repaired before committing/deploying. The complete public check after repair has zero errors.

## Public screenshots
- [Deals page desktop](desktop-deals-page.png)
- [Deals page iPad width](ipad-deals-page.png)
- [Homepage ticking countdown desktop](desktop-countdown.png)
- [Homepage ticking countdown tablet width](ipad-countdown.png)
- [Shop USD prices and favorites desktop](desktop-shop-favorites-usd.png)
- [Shop USD prices and favorites iPad-width](ipad-shop-favorites-usd.png)

## Protected scope
- T01 Git blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`, unchanged.
- T02 Git blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`, unchanged.
- T04 Git blob `790088849cc646ffec4553a77cf25a56ff5b0e78`, unchanged.
- T03 remains a single static closed backpack.
- Product covers, angles, corrected gallery frames and card layout unchanged.
- No `SaamVR/EcomCMS` changes.

**Implementation:** `542f902f8c5611dc46056470ea83ee73eee6b020`
**Render service:** `srv-dbeithnavr4c73b2qbng` (existing isolated gallery review, autoDeploy off).
**Live deploy:** `dep-dbendojncjis73eqale0`. Prior review version recoverable via Git; no new paid resource or production update.
