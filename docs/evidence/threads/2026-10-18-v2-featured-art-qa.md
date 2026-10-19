# THREADS — Final Featured Products Artwork Browser QA

Date: 2026-10-18

**Implementation commit:** `3b42750f13378bd272a36cdef0251a1aa53c6074`
**Live standalone demo:** https://threads-standalone-layout-review-20261017.onrender.com/index.html?v=3b42750f
**Development branch:** `feat/threads-layout-only-20261017`
**CI:** https://github.com/SaamVR/WebAnimation/actions/runs/39124123983 — success

The owner supplied a new transparent four-product image. Each original product was individually cropped using its alpha boundaries, preserving appearance. The existing four card slots were retained without changing their layout, spacing, dimensions, shadows or markup. Their labels and sample Tk prices now correctly describe the supplied olive shoe, yellow/navy cap, orange duffel bag and black headphones. New Arrivals, secondary campaign, Deal of the Week, footer, T01–T04 plan and EcomCMS were not modified.

## Real browser screenshots (deployed site)

| Section | Desktop 1440px | Mobile 390px |
|---|---|---|
| Featured Products — updated | [Desktop](./2026-10-18-v2-featured-1440.png) | [Mobile](./2026-10-18-v2-featured-390.png) |
| New Arrivals — preserved | [Desktop](./2026-10-18-v2-arrivals-1440.png) | [Mobile](./2026-10-18-v2-arrivals-390.png) |
| Built for a Brighter Everyday — preserved | [Desktop](./2026-10-18-v2-campaign-1440.png) | [Mobile](./2026-10-18-v2-campaign-390.png) |
| Deal of the Week — preserved | [Desktop](./2026-10-18-v2-deal-1440.png) | [Mobile](./2026-10-18-v2-deal-390.png) |

Screenshots are actual Playwright Chromium captures of the dedicated Render URL at their named viewport widths, not mockups.

## Browser results

**Verified widths:** 1920 / 1440 / 1024 / 768 / 390 / 360px, with `prefers-reduced-motion: reduce`.

All six widths passed:
- Four featured product images decode and have nonzero dimensions.
- Exact source files in order: `featured-olive-sneaker-owner-20261018.webp`, `featured-yellow-cap-owner-20261018.webp`, `featured-orange-duffel-owner-20261018.webp`, `featured-black-headphones-owner-20261018.webp`.
- Prices shown as `Tk 5,990`, `Tk 1,390`, `Tk 4,490`, `Tk 8,990` respectively (illustrative prices).
- Six New Arrivals remain and their media load on scroll.
- Campaign references `campaign-owner-full-20261018.webp`; Deal references `deal-backpack-owner-new-20261018.webp`.
- Document scroll width equals viewport width; no horizontal overflow.
- No uncaught JavaScript page errors.
- Add-to-cart for orange duffel works; drawer displays `Tk 4,490`.
- Header search for `Sunburst` filters to exactly one featured card.

**Scope:** static artwork correction only. No new animation choreography, CMS changes or production commerce logic.
