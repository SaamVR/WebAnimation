# THREADS — Tk catalog and rounded card visual QA (2026-10-18)

## Deployment and source
- Repository: SaamVR/WebAnimation, branch feat/threads-layout-only-20261017
- Code commit tested: 34272696fc81f3588d2ca7d1ddb3da112110a5bb
- Standalone Render demo: https://threads-standalone-layout-review-20261017.onrender.com/index.html?catalog=34272696
- Changes limited to catalog/product rendering, hero CTA, card layout styles, and three owner-supplied complete new-arrival shoe images.

## Actual browser screenshots
- [New Arrivals: desktop 1440px](./2026-10-18-new-arrivals-desktop-1440.png)
- [New Arrivals: mobile 390px](./2026-10-18-new-arrivals-mobile-390.png)
- [Categories: desktop 1440px](./2026-10-18-category-cards-desktop-1440.png)

These are real Playwright Chromium screenshots from the deployed static demo, not redesigned mockups.

## Acceptance checks
Automated GitHub Actions exact code SHA: https://github.com/SaamVR/WebAnimation/actions/runs/39087540804 (SUCCESS).

Live Playwright QA run at 1920, 1440, 1024, 768, 390, 360px, using reduced-motion preference.

All six passed:
- document.documentElement.scrollWidth equals innerWidth (no horizontal scroll)
- no JavaScript page errors
- approved hero CTA exact background rgb(174, 213, 169) = #AED5A9
- category card radius 21px desktop / 16px mobile; product card radius 18px desktop, 15px tablet / 14px mobile
- product card visible box-shadow
- larger Bags and Accessories product images
- all 3 newly extracted owner-supplied shoe images loaded from local assets
- 10 product cards render; all product prices in whole Tk; no dollar symbols
- cart opens, adds first featured item, and subtotal equals Tk 8,990
- new stylesheet loaded at intended position

New Arrivals extracted only from the complete visible top row of user-provided image:
1. Aqua Motion Runner — Tk 5,490.
2. Crimson Track Runner — Tk 4,690.
3. Amber Street Runner — Tk 4,990.

**Asset limitation / outstanding user input:** the user-supplied New-arrivals-transparent-background.png is 2048x1080 with the bottom row physically cut off by the file boundary (only upper shoe fragments appear at y≈1010–1080). Thus exact bottom three shoes are NOT recoverable. Existing cards 4–6 are deliberately preserved rather than hallucinating shoe shapes or shipping cropped fragments. Request a complete, uncropped six-shoe sheet to complete owner requirement.

Prices are illustrative Bangladesh-market demo values and not vendor listings, verified retail prices, currency conversions, purchase claims, or authentic-brand guarantees.

No changes to production EcomCMS, other WebAnimation routes, or deferred T01–T04 motion.
