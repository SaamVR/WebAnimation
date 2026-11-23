# PR #153 — Owner Illustrator navbar SVG preview / NOT deployed

## Source fidelity
- Exact uploaded master: `src/assets/illustrator/masters/Navbar Icons.svg`; SHA-256 `e10a2632b2357c47347736e3ce8e02ffa396061e0b7772b57f5288053d1fe199`.
- Four vector crops preserve the complete owner layers, all original paths, texture, classes, proportions and highlights; derived viewBox only.
- Favorites retains **both** `Favourite_x5F_Icon_x5F_Fill` (Terracotta cross-hatching) and `Favourite_x5F_Icon_x5F_Outline` (Press Green contour). Both navbar route states use the same combined owner artwork; product-card Favorites icons are not modified.
- Dark circles use exactly `#293D2D` Press Green; the icon SVG paints remain `#293D2D` and `#8A503B`. No recoloring, opacity compensation, SVG filters, or Terracotta substitution.

## Real browser captures
The browser is the **public staging origin**, with only PR #153's `app.mjs`, `theme.css` and five derived SVG assets intercepted from the local candidate checkout. **This does not change the public staging website** and does not prove PR #153 has been deployed.

- `desktop-chromium-light-navbar.png`: light entire navbar, all four illustrated icons.
- `desktop-chromium-dark-navbar.png`: dark entire navbar, all four icons on Press Green 44px circles.
- `tablet-webkit-dark-navbar.png`: iPad-sized WebKit browser header.
- `mobile-chromium-light-navbar.png`, `mobile-chromium-dark-navbar.png`: true mobile header at 390px. The site's approved layout intentionally hides Favorites/Account from the narrow header, retaining them in its hamburger menu.
- `mobile-chromium-light-mobile-menu.png`, `mobile-chromium-dark-mobile-menu.png`: actual menu retains working Favorites and Account links.
- `mobile-chromium-light-all-four-qa-specimen.png`, `mobile-chromium-dark-all-four-qa-specimen.png`: **clearly labelled QA-only browser specimen** of the exact same four loaded vector assets, all at the true 44px mobile target size; this display strip was never installed in the application.
- `qa-report.json`: 5/5 browser profiles, 72/72 focused checks passed (desktop Chrome light/dark; tablet WebKit dark; mobile Chrome light/dark). No JS errors, HTTP failures or horizontal overflow. Search open/close, Favorites selected route, original card Favorites, unchanged numeral and theme toggle verified.

## Contrast and owner's decision
**Warning — visual acceptance NOT approved.** Original Press Green `#293D2D` strokes on the requested Press Green `#293D2D` dark circles produce **1:1 contrast**. Search and Account outlines largely disappear; the heart/bag Terracotta hatching remains visible. This is a faithful preview of the *explicitly requested* combination, not a recommended production accessibility solution.

**PR remains DRAFT. DO NOT MERGE OR DEPLOY** until the owner expressly approves the exact visual combination or separately requests an alternative. The original light/dark theme toggle, logo, motion, navigation logic and stamped numeral are unchanged.