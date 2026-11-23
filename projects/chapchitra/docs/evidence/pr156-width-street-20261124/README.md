# CHAPCHITRA PR #156 — width, navbar and provisional owner street (visual review)

**Status: OWNER APPROVAL REQUIRED — NOT MERGED OR DEPLOYED.** This is a stacked development PR, based on draft [PR #154](https://github.com/SaamVR/WebAnimation/pull/154), not the staging branch. No production/main changes.

## Exact artwork integrity
- Uploaded Illustrator master preserved byte-for-byte: `src/assets/street-owner-layers-master.svg`; SHA-256 `7eeba23119cc0e04b12487321aeb1518f1daf67418f0728386db06ffa17f099c`.
- Self-contained display derivative `src/assets/street-owner-provisional.svg`, SHA-256 `ce026489583b76139f6226fd32321ab425f0192d0949a8224a317b800a1a79ab`.
- 4,012 unchanged original paths, 25 polygons, all visible Illustrator layers/styles, exact 1920×700 viewBox. Only hidden external PNG layer removed from derived display copy, and intrinsic 1920×700 root dimensions added; archival master unchanged. No invented path, recoloring, cropping, clipping or animation; C09 intentionally deferred.
- Light transparent sky uses Gallery White background; dark transparent sky uses approved Cream background only. Original original artwork paints unchanged.

## Browser evidence and exact limits
**PASS — 612/612 checks across 60 route/theme/viewport cases.** Headless real Chromium at 1920×1080, 1440×900, 1366×768, 390×844, 320×700 and WebKit at 834×1112, both light/dark. Each size/theme inspected Home, Shop, Artist's Edit, Journal and About.

Checked actual bounding rects, no horizontal scrolling, Shop content width/grid, banner alignment, original loaded icon assets, all four dark circles 44×44px max, light theme unchanged, no JS/page asset errors, original street loaded, static, and correct uncropped 1920:700 aspect in Home and About. The Shop listing becomes 4/5 columns on wide desktops, maintaining controlled polaroid card width.

Captures are **real browsers visiting the permanent public staging origin**, with only the exact branch candidate `app.mjs`, `styles.css`, `theme.css` and `street-owner-provisional.svg` locally substituted. No deployment of these corrections has taken place. Reports are in `page-qa-report.json`.

## Representative images in this folder
- `chromium-1920x1080-light-shop.png` and `chromium-1920x1080-dark-shop.png`: full-width Shop and Cream navbar.
- `chromium-1440x900-*-shop.png`, `chromium-1366x768-*-shop.png`: intermediate desktop geometry.
- `chromium-390x844-*-shop.png`, `chromium-320x700-dark-shop.png`: mobile layout, no overflow or extra dark buttons.
- `webkit-834x1112-*-shop.png`: iPad-size WebKit (NOT physical Safari).
- `chromium-1920x1080-*-home-street.png`, `chromium-390x844-*-home-street.png`: exact original street in both themes/desktop and mobile.
- `chromium-1920x1080-dark-about-street.png`, `chromium-1920x1080-light-journal.png`, `chromium-1920x1080-dark-artists.png`: secondary route review.

CI evidence: [workflow #45250431866](https://github.com/SaamVR/WebAnimation/actions/runs/45250431866) for code head `045b2e6e8873b66d5592112073c2bb3672e70562`. New exact-head workflow required after the evidence-only commit if the code SHA changes.

**Reference limitation:** The annotated Shop screenshot was not available as an accessible standalone upload in this turn, so the live Shop baseline + user-supplied requirements were used; no pixel-perfect match to missing annotations is claimed.

Retain owner approval gate. Do not merge PR #154 or PR #156, deploy to staging, change production, recolor SVGs, or animate C09 without approval.
