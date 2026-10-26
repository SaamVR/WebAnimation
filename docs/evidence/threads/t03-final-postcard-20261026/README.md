# T03 final owner postcard — isolated visual QA

Baseline source commit: c9b6c9db555ecfb78a2b8d78e9d8f369bfd5b2df.
Original supplied SVG is byte-identical SHA-256 025cb57273465c938177ad9da4778ccb2edaf8cbd8f66631344e4f0afa3858f2 (2,439,189 bytes).
Opening and postcard pop-out remain the owner's original 5s SVG, with 9 native animated elements and 8 authored @keyframes. The popup is part of #popout-card-group, behind #open-collar-front-rim-group; no overlay card.

Playwright Chromium local-source verification:
- Fresh page load, first click to fully opened state, second click to original closed state.
- All five review variants: 5%, 7%, 10%, FREE DELIVERY (two lines), 50%.
- Desktop 1200x800 and iPad-sized touch-enabled Chromium 834x1194: 10/10 tests, 0 page exceptions, 0 horizontal overflow.
- Closed screenshots for desktop 5% and iPad Free Delivery. Open screenshots for all five rewards in both viewports.
- Videos for desktop 5% and tablet Free Delivery, including initial load, opening and closing.
- results.json contains independent DOM checks: original nine animations, nine embedded source image layers, exact 252-unit card frame width, original rim, reward text, successful opening and closing.
- No full physical iPad Safari or WebKit run; owner review still required.

The source SVG was not edited, and no changes have been made to T01, T02, T04, storefront pricing, catalog, Deals, countdown, or main/homepage routes. PR #28 remains draft.
