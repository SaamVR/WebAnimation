# CHAPCHITRA — Artist's Edit Invoice + Illustrated Price Tag
Date: November 12, 2026

**Deployed PREVIEW source:** `f7947b0f52d7f466a2b922317816bfe0d059c29d`
**Vercel URL:** https://chapchitra-motion-demo-cp2pcuemd-samvrc.vercel.app/artists-edit/
**Draft review:** https://github.com/SaamVR/WebAnimation/pull/85

## Screenshots — actual browser captures

- [Desktop wooden worktable, illustrated tag, and live price](desktop-worktable.png)
- [iPad-sized WebKit wooden worktable](tablet-worktable.png)
- [Mobile wooden worktable and below-stage tag](mobile-worktable.png)
- [Desktop always-visible itemized invoice](desktop-invoice.png)
- [Tablet always-visible invoice](tablet-invoice.png)
- [Mobile invoice](mobile-invoice.png)

These are automated Chromium and WebKit viewport captures, **not photographs from a physical iPad**. The supplied price tag artwork is a pixel-preserving crop of the owner's transparent 2048×1152 PNG. No CSS-generated replacement artwork is used.

## QA results

- Exact source tests: **165/165 PASS**; site build PASS.
- [Public pricing + invoice + tag synchronization](public-pricing-report.json): **60/60 PASS**, three browser/viewport combinations, zero JavaScript errors and zero failed HTTP requests.
- [Public tag geometry and font/image checks](public-visual-report.json): desktop, tablet WebKit, mobile; no garment intersection; tag loaded; both tag displays equal the invoice total.
- [Two-sided editor regression](two-sided-report.json): **54/54 PASS**, from the immediately preceding runtime candidate at `37c0194` (the final commit changed only mobile tag offset styling/configuration).
- [Navbar preservation](navbar-report.json): **90/90 PASS**, same preceding runtime candidate.
- All four base garment prices and mixed A4/A3 configurations remain covered by the existing central pricing tests.

## Adjustable tag settings

Edit `projects/chapchitra/src/worktable-price-tag-config.mjs`:
- `desktop.{x,y,width,maxWidth}` and `tablet.{x,y,width}` — positions in 2048×1152 worktable coordinates.
- `mobile.{x,y,displayWidth}` — offsets relative to centered below-stage mobile tag.
- `rotation`, `text.{xPercent,yPercent,fontSizeCqw,align}`.
- `assetPath` — replace illustrated tag PNG without changing calculation.

The tag never captures pointer events, does not change worktable or garment transforms, and receives the same `calculateArtistPrice` result as the itemized invoice. No client-side price is treated as server-authoritative; no real order or payment is created.

## Gate

This evidence is on a separate Git branch and **does not change Vercel's implementation SHA**. Draft PR #85 remains unmerged. Shared Render and `main` remain untouched. Owner visual approval is pending.
