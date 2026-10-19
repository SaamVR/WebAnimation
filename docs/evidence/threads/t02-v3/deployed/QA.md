# THREADS T02 V3 — actual deployed Render browser verification

**Status:** technically verified; **creative approval pending**. No merge into `main`. T03 and T04 excluded.

## Working public preview
https://threads-t02-v3-product-flight-20261019.onrender.com

The existing T01 and V2 Render preview services were not changed.

### Source and release checkpoint

- Repository: `SaamVR/WebAnimation`
- Isolated V3 branch: `feat/threads-t02-v3-product-flight-20261019`
- Application source commit deployed: `db9e520b7ee818f349dbb564d8db07de623b3a9b`
- New Render service: `srv-dbb0672jnfac739crilg`
- Render deployment: `dep-dbb067ajnfac739crlh0` — LIVE
- Workspace: My Workspace
- Service type: static_site; publish path: `site/threads`, source GitHub branch above, `autoDeploy=no`. No paid compute resource enabled.
- V2 recovery: `checkpoint/threads-t02-v2-20261019` at historical V2 source `6512eb28e8cf7b0cf5a861407a12ca527fa22a79`
- T01 approved source: `73f792ca988779e97cd02b83ed6ff96c13024f30`
- T01 exact source module Git blob: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff` (UNCHANGED)
- Rejected T02 retained in earlier Git history / draft PR #9.

## Actual browser MP4s captured from the LIVE Render URL

These are screen recordings of Google Chrome 155 interacting with the actual deployed website, not mockups or image renders.

- [Product Detail — Desktop (1440×900)](pdp-desktop-render.mp4)
- [Product Detail — Mobile (390×844)](pdp-mobile-render.mp4)
- [Homepage Add to Cart — Desktop](home-desktop-render.mp4)
- [Shop catalog Add to Cart — Desktop](shop-desktop-render.mp4)
- [Search Results Add to Cart — Mobile](search-mobile-render.mp4)

Sample frames for the editorial choreography:
- [Desktop separation](pdp-desktop-450.png)
- [Desktop direct flight](pdp-desktop-760.png)
- [Desktop cart approach](pdp-desktop-1000.png)
- [Mobile direct flight](pdp-mobile-760.png)
- [Shop flight](shop-desktop-760.png)
- [Search mobile flight](search-mobile-760.png)

## Motion implementation

- All source media uses the click-associated `[data-t02-image]` and its `img.currentSrc` plus DOM frame geometry, so the clicked product's current gallery angle is the temporary proxy.
- Product frame/beige card and real product image remain in place and visually stationary. No extra cart or duplicate quantity badge is inserted.
- One GSAP `x/y` transform from source center toward the same real `#bag-button #cart-basket`, easing over ~0.91 s; clear progressive scale down and focused shrink at basket entry, subtle initial image glow and contact masking.
- Existing V2 basket and independently animated two cart wheels respond, with real anchor retained.
- Successful cart mutation is immediately truthful in backing state and screen-reader cart label, while the existing visible badge holds the prior number until the catch callback (~1.03 s on the animation timeline), then briefly pops.
- On mobile Product Detail, the original sticky storefront header remains visible; if the actual source gallery is out of view, the page camera reframes temporarily to the same photo, then restores the previous scroll after catch.
- Existing header sticky on desktop and mobile. T01 overlay remains above it and the separate T02 overlay remains pointer-transparent.

## QA results

- **37/37 source contracts passed**.
- **62/62 deployed Chrome motion checks passed** across PDP desktop/mobile, homepage desktop, Shop desktop, Search mobile, reduced motion, and T01.
- **17/17 extra deployed Chrome integration checks passed** after correcting a test-harness navigation wait. The initial early-assertion failure was a test timing race; direct browser checkout inspection and rerun confirm functionality.
- **Zero browser JavaScript exceptions**.
- Alternate PDP gallery view flies the currently displayed alternate asset.
- The second Search result flies the correct *second product* image, not a hardcoded first catalog asset.
- Real cart state updates immediately, badge changes at contact, correct 3-item addition, 10-per-variant limit blocks an 11th, rapid clicks leave correct count, and cart/checkout navigation remains functional.
- T01 Spotlight Search continues to animate four real Backpack results and cleans up on desktop and mobile.
- Actual public-URL results: [62-check motion report](QA-browser.json), [17-check integration report](integration-regression.json).

**Owner creative sign-off is NOT granted by these technical tests.** PR should remain draft. No EcomCMS changes and no T03/T04 work.
