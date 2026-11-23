# CHAPCHITRA — Owner's original navbar SVGs: visual-approval packet

**PR #152 — NOT APPROVED. DO NOT MERGE OR DEPLOY.**

This is genuine Chromium/WebKit browser QA using the public staging origin `https://chapchitra-webanimation.onrender.com/`, while replacing **only** the PR's candidate `/app.mjs`, `/theme.css` and new `/assets/illustrator/nav-owner-*.svg` responses inside each test browser. The live Render release **was not updated**. These captures demonstrate the proposed change, not a deployed version.

## Real-browser screenshots

| Preview | Evidence |
|:--|:--|
| Desktop Chrome light, actual navbar | [light navbar](desktop-chrome-light-navbar.png) |
| Desktop Chrome dark, actual Press Green circles | [dark navbar](desktop-chrome-dark-navbar.png) |
| Desktop full context light/dark | [light homepage](desktop-chrome-light-homepage.png) · [dark homepage](desktop-chrome-dark-homepage.png) |
| Favorites active route with original hatching | [light selected](desktop-chrome-light-favorites-selected-navbar.png) · [dark selected](desktop-chrome-dark-favorites-selected-navbar.png) |
| Mobile Chrome 390px actual navbar | [light](mobile-chrome-light-navbar.png) · [dark](mobile-chrome-dark-navbar.png) |
| Mobile menu (existing Favorites/Account navigation) | [light menu](mobile-chrome-light-menu.png) · [dark menu](mobile-chrome-dark-menu.png) |
| Mobile 390px **comparison-only** strip showing all four assets at ~22px art size | [light review strip](mobile-chrome-light-four-icons-qa-comparison.png) · [dark review strip](mobile-chrome-dark-four-icons-qa-comparison.png) |
| iPad WebKit and narrow 320px | [tablet dark navbar](tablet-webkit-dark-navbar.png) · [narrow mobile dark](narrow-chrome-dark-navbar.png) |

**Mobile layout truth:** the approved narrow-screen navbar displays only Search and Bag; Favorites and Account remain visible as accessible text links in the existing hamburger menu. The four-icon strip is a **QA-only overlay, not a new website layout**.

## Exact source-integrity and interactions
- Uploaded Illustrator master `Navbar Icons.svg`: SHA-256 `e10a2632b2357c47347736e3ce8e02ffa396061e0b7772b57f5288053d1fe199`; stored byte-identical.
- Original extracted geometry: Search 191 paths/6 polygons; Favorites **140 paths/2 polygons** (15 Terracotta fill/hatch paths + original Press Green outline paths); Account 185 paths/8 polygons; Bag 73 paths/2 polygons. No fill, stroke, highlight, scale, clip, transform or path rewrite.
- All 6 source-overridden real-browser profiles **PASS**: desktop light/dark Chrome; 834px tablet WebKit dark; 390px Chrome light/dark; 320px Chrome dark. Original assets decode, no console/page exceptions, new header-specific paths, correct dark backgrounds, Search open/close, routes intact, no viewport overflow.
- **44×44 CSS hit targets** confirmed on all visible icon controls. Desktop margins compensate so the track width is unchanged. Tablet/mobile layout remains responsive.
- Product-card Favorites remains on the existing pre-approved art, storage persistence and button state. The active navbar Favorites icon uses the **combined original fill+outline**, tested in both modes (**6/6 interaction assertions per theme PASS**). The Bag numeral stamp image and scripts remain untouched.
- Source QA reports: [6-profile browser audit](report.json) and [Favorites journey](favorites-journey-report.json).

## Critical contrast finding
**FAIL, awaiting owner decision:** On dark-mode icons, the circular background and original green outlines are both `#293D2D`. Therefore **icon-on-circle contrast = 1:1** for Search and Account (and the green outlines of Favorites and Bag). The Terracotta hatching remains visible in the heart/bag, but Search and Account are effectively invisible at natural navbar size.

**Do not automatically change backgrounds to Terracotta or recolor SVG content.** The visual review can be approved or amended by the owner separately. A technical CI pass does not override this visual hold.

## Release governance
- Base source: staging merge SHA `4bae6e2fff4f1ace53253590c062c76591b100b9`.
- All PR changes limited to `projects/chapchitra/`.
- No logo, theme toggle, palette tokens, C-series animation source, product-card heart, root workflow, THREADS, other project, production or `main` modifications.
- **No merge/redeployment** until affirmative owner visual approval.
