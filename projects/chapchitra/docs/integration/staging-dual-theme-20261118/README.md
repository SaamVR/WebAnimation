# CHAPCHITRA — Dual-Theme Staging Integration Candidate

**RELEASE GATE: BLOCKED.** Draft staging integration PR for review only. No merge/deployment. The owner-approved light/dark artwork and animation source are unchanged by this QA-only integration branch.

## Stack and Git lineage

| Source component | PR | SHA |
|---|---|---|
| Scroll-driven Hero 01 | #120 | 11e2bcd4c41429b8f753305dfffbd5a799200466 |
| Fraunces / DM Sans typography | #121 | 5527e838666890e3a783f47c08434e39b788bc01 |
| Approved Light/Dark switch | #122 | faf9e35172af1998e78d09d9ab4f44d75c054302 |
| Owner Dark Refinement P01 | #123 | c29d397fc0462c798cd2662c9abeb4f9a8a0483d |

The P01 head is 6 commits ahead and 0 behind shared staging ad42d075e9e99d268202646ab7396ddd077053ee. Its 249 changed paths are entirely inside CHAPCHITRA. No other project or host setting changed.

## Combined regression results

| Gate | Result |
|---|---|
| Native Node tests | PASS 275/275 |
| Local production-equivalent build | PASS |
| Home, Shop, Product Detail, Favorites, Bag, Checkout, Journal, About, Artist Edit, Account | PASS 60/60 (10 routes x both themes x 3 browsers) |
| Desktop Chromium / iPad-width WebKit / mobile Chromium, two themes | PASS 6/6 |
| Narrow 320px WebKit/Chromium + mobile controls | PASS 6/6 |
| Axe-core WCAG A/AA on Home/Shop/Artist, two themes, 3 engines | PASS 18/18, zero automatic violations |
| Real browser 53.5-second two-cycle timing, desktop | PASS, Hero 01 initial 8049.8ms |
| Real browser 53.5-second two-cycle timing, iPad first run | FAIL, initial Hero 01 9100ms |
| Real browser 53.5-second two-cycle timing, iPad isolated rerun | FAIL, initial Hero 01 8575ms |

Functional validation included initial OS theme preference, persistent user choice, changing OS preference, reload, source-original logos in both modes, Fraunces/DM Sans and Bengali font fallback, Favorites persistence, demo Add to Bag, quantity/removal UI, Home pagination, C02 one-click navigation and continuously reversible V scroll. No horizontal overflow in tested profiles.

## Important iPad initial timing blocker

- Required first Hero 01 dwell: 8000ms total including initial C08, without cutting off animation.
- Desktop first appearance: 8049.8ms. Initial C08 completion observed at 7810.1ms.
- WebKit initial run: 9100ms, C08 completion first sampled at 9994ms.
- WebKit isolated retry: 8575ms, C08 completion first sampled at 9559ms.
- Both WebKit reruns exceeded the existing +/-450ms first-Hero dwell tolerance. Subsequent Hero 01 appearances were near 8.0s, and Heroes 02–05 near 4.0s.
- The external QA ribbon samples the C08 completion state by requestAnimationFrame. A late sampled C08 timestamp does not alone prove that playback was visually interrupted; inspect direct C08 events and video.
- Route this issue to the Animation Integration lane; this QA-only PR does not modify clock logic, V-scroll, C08 playback or source artwork.

## Complete homepage comparison

| Viewport | Light | Dark |
|---|---|---|
| desktop-chromium | [View](desktop-chromium-light-homepage-full.png) | [View](desktop-chromium-dark-homepage-full.png) |
| ipad-webkit | [View](ipad-webkit-light-homepage-full.png) | [View](ipad-webkit-dark-homepage-full.png) |
| mobile-chromium | [View](mobile-chromium-light-homepage-full.png) | [View](mobile-chromium-dark-homepage-full.png) |

## Inner-page screenshots

| Page | Desktop Light | Desktop Dark | iPad Light | iPad Dark |
|---|---|---|---|---|
| shop | [View](desktop-chromium-light-shop.png) | [View](desktop-chromium-dark-shop.png) | [View](ipad-webkit-light-shop.png) | [View](ipad-webkit-dark-shop.png) |
| product | [View](desktop-chromium-light-product.png) | [View](desktop-chromium-dark-product.png) | [View](ipad-webkit-light-product.png) | [View](ipad-webkit-dark-product.png) |
| favorites | [View](desktop-chromium-light-favorites.png) | [View](desktop-chromium-dark-favorites.png) | [View](ipad-webkit-light-favorites.png) | [View](ipad-webkit-dark-favorites.png) |
| bag | [View](desktop-chromium-light-bag.png) | [View](desktop-chromium-dark-bag.png) | [View](ipad-webkit-light-bag.png) | [View](ipad-webkit-dark-bag.png) |
| journal | [View](desktop-chromium-light-journal.png) | [View](desktop-chromium-dark-journal.png) | [View](ipad-webkit-light-journal.png) | [View](ipad-webkit-dark-journal.png) |
| artists-edit | [View](desktop-chromium-light-artists-edit.png) | [View](desktop-chromium-dark-artists-edit.png) | [View](ipad-webkit-light-artists-edit.png) | [View](ipad-webkit-dark-artists-edit.png) |

## Narrow screen
- [320px Chromium light](narrow-chromium-light-home-full.png)
- [320px Chromium dark](narrow-chromium-dark-home-full.png)

## Original, uninterrupted timed browser recordings
- [Desktop two cycles with external elapsed-time ribbon](timing/desktop-chromium-two-cycles-uncut-timecode.webm) — PASS
- [iPad first run with external elapsed-time ribbon](timing/ipad-webkit-two-cycles-initial-failed.webm) — timing discrepancy
- [iPad isolated rerun with external elapsed-time ribbon](timing/ipad-webkit-two-cycles-uncut-timecode.webm) — reproduced discrepancy

## Original approved logo variants
- Light Hero: chapchitra-full.webp.
- Dark Hero: chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp.
- Light navbar: chapchitra-wordmark.webp.
- Dark navbar/footer: chapchitra-wordmark-cream-terra.webp.
The integration-branch-only change set adds QA scripts and evidence, not new logos, CSS palette, icons, motion or Artist Edit functionality.

## Raw QA and audit sources
- [Combined 60 route/browser results](combined-regression.json)
- [320px and mobile layout](integration-narrow-layout.json)
- [18 axe scans](integration-axe-accessibility.json)
- [Initial timing measurements](timing/timing-measurements-initial.json)
- [iPad isolated timing rerun](timing/timing-measurements.json)
- [QA gate summary](QA_SUMMARY.json)
- [Full staging diff](CHANGED_PATHS_FROM_STAGING.txt)
- [Six source commits](SIX_SOURCE_COMMITS.txt)

## Controlled staging release procedure (after separate owner authorization)
1. Animation Integration investigates the intermittent first iPad C08/clock latency and submits a scoped correction if necessary; independent QA rechecks desktop and WebKit timing.
2. The designated serial staging coordinator obtains owner creative approval of both full homepage/theme captures and a clean combined QA gate.
3. Only then merge ONE cumulative integration PR into deploy/chapchitra-render-review. Do not separately merge already-included stacked PRs #120–#123 afterward.
4. Render autoDeploy is ENABLED for that staging branch. A merge will automatically deploy the existing service. Verify the actual new live commit SHA at https://chapchitra-webanimation.onrender.com/ before calling the integration deployed.
5. No production/main merge, new service, DNS change, physical iPad Safari guarantee or real commerce enablement.

**Current shared staging: ad42d075e9e99d268202646ab7396ddd077053ee; deployment NONE.**
