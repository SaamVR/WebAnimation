# THREADS — T01 camera-follow / persistent navbar / homepage footer

**Review-only deployment; T01 creative choreography and animations remain approved and unchanged.**

## Preview
- Public: https://threads-final-gallery-replacement.onrender.com
- Search/T01: https://threads-final-gallery-replacement.onrender.com/search/
- Render service `srv-dbeithnavr4c73b2qbng`, deployment `dep-dbes1rrrjlhs738n72eg` **LIVE** (auto-deploy disabled, existing isolated review service; production not modified)
- Deployment source `43f2c19ae667426f64deb00730864deb0fe190e0`.

## Exact T01 protection

Approved T01 checkpoint **`checkpoint/threads-t01-approved-camera-pre-20261025`** was created and pushed before any modifications; checkpoint commit `368f07c3bec5a946f79f6f4b0743838c2b74a297`.

Original `site/threads/t01-spotlight.mjs` is **byte-for-byte unchanged**: Git blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`, SHA-256 `f4b5b6e2c269dcfdd9164c944420f696dc93e7c3eb6981967398e9b4914ac5e3`.

The new, separate `t01-camera-follow.mjs` renders an independent presentation wrapper behind the existing magnifier actor (no authored position/motionPath/timeline changes). It tracks GSAP's already-produced positions and scrolls the real page smoothly toward a comfort-zone target on requestAnimationFrame, compensating the glass and SVG spotlight cutout by exactly the page-scroll delta. Only the camera's own scroll events are prevented from reaching T01's existing user-scroll cancellation hook. Touch/manual user scrolling retains T01 cancellation. On return the virtual camera follows the original return path back to the initial navbar viewport position.

**All T01 curves, durations, speed, timeScale, easing, glow, cutout/radius, spotlight intensity and original search behavior stay unchanged.** Actor removed normally after completion, no secondary magnifier or cart.

### Real browser recordings
- [Approved original T01 BEFORE — desktop](desktop-approved-before.mp4)
- [T01 AFTER with camera-follow — desktop Chrome](desktop-t01-camera-after.mp4)
- [Approved original T01 BEFORE — iPad-sized WebKit](ipad-webkit-approved-before.mp4)
- [T01 AFTER with camera-follow — iPad-sized WebKit](ipad-webkit-t01-camera-after.mp4)
- [T01 AFTER with camera-follow — mobile Chrome](mobile-t01-camera-after.mp4)
- [iPad second-row storefront camera screenshot](ipad-webkit-follow-16.png)

### Camera telemetry from the LIVE deployed preview

| Browser | Initial scrollY | Peak scrollY | Final scrollY | T01 complete | Sticky header | JS errors |
|---|---:|---:|---:|---|---|---|
| Desktop Chrome (1360×650) | 235 | 292 | 237 | Yes | Top 0 | 0 |
| iPad-sized Linux WebKit (820×610) | 520 | 559 | 522 | Yes | Top 0 | 0 |
| Mobile Chrome (390×700) | 520 | 571 | 522 | Yes | Top 0 | 0 |

The before recordings show no scrolling by original T01; after shows smooth scroll/return with the original actor. The selected search product rows are real catalog items. Camera test samples/scroll metrics: [QA-camera.json](QA-camera.json).

**Safari limitation:** WebKit runs in Playwright on Linux with an iPad-sized viewport and touch emulation. It is **not** a physical iPad Safari test. Physical iPad browser chrome and rubber-band overscroll require device review.

## Sticky header
The permanent CSS safeguard applies to the already-existing real header on Homepage, Shop/Search, Product Detail, Cart, Checkout, Order Confirmation and Deals. It only enforces the existing sticky top 0, no transform, full visibility and original z-index/height/layout. No hide-on-scroll. **21 of 21 desktop/mobile/WebKit route × viewport checks** confirmed header top 0 at scroll positions near the footer. T01 stays above header and T02 uses the actual articulated cart in it.

## Footer
The shared storefront `footer()` now reproduces the owner-approved Homepage footer markup and `footer-reference-20261018.css`: real inverted logo, brand description, four social SVGs, email form and Subscribe button, original explanatory privacy/demo status, Shop/About/Help/Company links including Contact Us. Root-relative links work on all nested storefront routes. Newsletter interaction is demo-only and never persists/transmits email data. The existing Homepage footer itself is untouched.

**25/25** public-URL browser checks across desktop Chrome, mobile Chrome, iPad-sized Linux WebKit, all seven routes, newsletter demo submit and zero errors. Screenshots: [desktop footer](../footer-public/desktop-storefront-footer.png), [iPad-size footer](../footer-public/ipad-webkit-storefront-footer.png), [mobile footer](../footer-public/mobile-storefront-footer.png).

## Git (independent revertible commits)
1. **`a784249b016988b0d1765591be14507ac5158d65`** — camera follow only; T01 source unchanged.
2. **`19231e842598086ac7d7483c0ee70c60729b12be`** — permanent navbar CSS safeguard.
3. **`43f2c19ae667426f64deb00730864deb0fe190e0`** — Homepage footer replicated across all other storefront pages, demo newsletter handler.

## Regression (actual public Render build)
- **73/73** source/contract tests (new camera SHA-256 and separation tests included).
- **25/25** Footer browser checks.
- Camera: three desktop/iPad-sized WebKit/mobile runs **passed** visible following, return within 2px, actor complete, header stable, zero page errors.
- **10/10** USD/Favorites/Deals/countdown/discount browser checks.
- **89/89** gallery and storefront browser regressions.
- **7/7** approved T01/T02 motion smoke checks.
- **69/69** approved T04 checkout flow/overlay simulations.
- No JavaScript errors in the above public browser tests.

Unchanged approved T02 blob: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`; approved T04 blob: `790088849cc646ffec4553a77cf25a56ff5b0e78`; T03 remains the static closed backpack/on hold. Product galleries, USD pricing, Favorites and Deals maintained. **Never modified `SaamVR/EcomCMS`.**

## Approval state
The update is live only in the isolated owner review preview. Do not merge or promote to production pending owner visual signoff of the T01 camera and iPad Safari.
