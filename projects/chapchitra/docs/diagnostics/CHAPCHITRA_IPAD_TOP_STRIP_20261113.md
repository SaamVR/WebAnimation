# CHAPCHITRA — iPad top-strip investigation (2026-11-13)

## Status and ownership
**Status: diagnostic-only; visual defect not yet confirmed resolved on physical iPad Chrome.** Scope: shared CHAPCHITRA navbar and page layout. Do not modify C02's owner-approved `texture.svg`, roller, adaptive motion or Artist's Edit heading/worktable. No forced scroll, negative margin, arbitrary top positioning or permanent root-color override.

## Owner reproduction
The owner's 38.27-second physical iPad Chrome recording `ScreenRecording_11-13-2026 01-33-11_1.mp4` shows a light horizontal region below the browser address bar and above CHAPCHITRA's deep-forest announcement, visible at approximately 15, 26 and 35 seconds. The region is approximately 43 CSS pixels by screenshot scaling; that is a **visual estimate**, not a DOM geometry measurement. It persists after C02 completes and across Artist's Edit → Shop, so an ink-overlay-only fix is unsupported.

## Exact iPad-sized WebKit measurement
Run: [GitHub Actions #43296953020](https://github.com/SaamVR/WebAnimation/actions/runs/43296953020).
Artifact: [shared-stage-browser screenshots and JSON](https://github.com/SaamVR/WebAnimation/actions/runs/43296953020/artifacts/13979522845).
At direct Shop load on 834×1112 simulated iPad WebKit, `?navdebug=1` reports:

| Signal | Measurement |
|---|---:|
| `html.getBoundingClientRect().top` | 0 |
| `body.getBoundingClientRect().top` | 0 |
| `#app.getBoundingClientRect().top` | 0 |
| `.announcement.getBoundingClientRect().top` | 0 |
| `.site-header.getBoundingClientRect().top` | 34 |
| `#main.getBoundingClientRect().top` | 99 |
| `window.scrollY` | 0 |
| `visualViewport.offsetTop` / `pageTop` | 0 / 0 |
| `elementFromPoint(417,2)` | announcement |
| Root and body top margin/padding | 0 |

At scrollY=350, sticky header top=0; after a 90px viewport-height shrink/restore, all document start elements return to top=0. During Back/Forward, `#app`, `.announcement`, `body`, `html` all directly measure top=0 and scrollY=0.

The simulation has **no Chrome iPad native address bar**. These measurements exclude a persistent *layout box* gap in the simulated document; they **cannot locate pixels outside the physical browser's exposed viewport**. They also do not exclude occasional WebKit compositor mispainting, which may not be reflected by DOM geometry.

## Diagnostic code and source changes
- `src/nav-sticky-guard.mjs`: opt-in `?navdebug=1` captures DOM rectangles of html/body/#app/.announcement/.site-header/#main, computed margins/padding/background and transform, `scrollY`, `visualViewport.offsetTop/pageTop`, `elementFromPoint`, safe-area inset, scroll restoration and root ancestry. No diagnostics run without query flag.
- The panel's displayed values are **freshly captured** on draw, not stale initial values.
- An explicitly clicked **Test browser-edge color** button temporarily changes only the html/body background color to existing brand Terracotta `#8A503B`. It never changes layout or offsets, never runs in normal mode, and restores original inline colors when clicked again or on cleanup. This A/B test distinguishes browser surface color sampling from an unpaintable native strip when exercised **on the real device**.
- `scripts/perf/artist-navbar-normal-flow-qa.cjs`: desktop Chromium, mobile Chromium and simulated iPad WebKit; direct Home/Shop/Artist's Edit/Journal/About, scroll, viewport-height changes and history return; screenshots, JSON and a tint/restore zero-geometry test.
- `tests/nav-top-strip-diagnostics.test.mjs`: source and DOM contract guards; no layout-workaround CSS.

## Evidence limit and next decision
Official/unresolved platform reports describe related iOS 26 browser viewport and chrome rendering defects: [WebKit bug 312149](https://bugs.webkit.org/show_bug.cgi?id=312149), [WebKit bug 319479](https://bugs.webkit.org/show_bug.cgi?id=319479), [WebKit bug 301756](https://bugs.webkit.org/show_bug.cgi?id=301756). These are supporting background, **not proof** that the owner's device has the identical defect.

The key physical experiment is on [existing C02 Shop diagnostic](https://chapchitra-c02-adaptive-review-20261112.onrender.com/shop/?navdebug=1):
1. With the strip visible, tap **Capture and copy iPad measurements** and save/paste the JSON.
2. Tap **Test browser-edge color**, observe whether the strip itself changes from white to Terracotta while the announcement stays fixed; capture a screenshot.
3. Tap again to restore, and repeat after Chrome toolbar collapse/expand and a navigation.
4. The Shop filter URL synchronization may remove `?navdebug=1` after navigation. If the panel disappears following Back/Forward, reopen the exact diagnostic URL above; do not interpret a missing panel as a layout fix.
5. Compare the physical screenshot to DOM `elementFromPoint` and layout origin:
   - If physical white strip is outside the DOM and responds to background color, it is a browser-selected root surface/tint region; do not invent a page margin.
   - If it is outside the DOM and does not respond, the native Chrome UI owns it; no reliable DOM CSS can remove it.
   - If `.announcement.top` becomes positive while `scrollY=0` **inside DOM**, diagnose the exact ancestor and repair that verified layout defect.

No CSS/layout fix should be proposed as complete until the physical-device evidence identifies which case applies.

## Protected integration
The protected `deploy/chapchitra-render-review` branch is owned by serial Main Website Integration. The scoped draft [PR #98](https://github.com/SaamVR/WebAnimation/pull/98) remains unmerged and does not change C02 visual behavior. Do not overwrite staging with a stale candidate.