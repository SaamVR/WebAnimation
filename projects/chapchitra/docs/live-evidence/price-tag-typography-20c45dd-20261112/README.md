# CHAPCHITRA — Illustrated Price Tag: Hind Siliguri, TOTAL + BDT, Printed Tilt

**Date:** November 12, 2026  
**Feature:** Artist's Edit typography-only refinement  
**Exact implementation SHA:** `20c45ddcf933adb933cf89d14d8cc85c890902e4`  
**Draft PR:** https://github.com/SaamVR/WebAnimation/pull/86  
**Isolated Render preview:** https://chapchitra-artist-tag-type-review.onrender.com/artists-edit/  
**Render deployment:** `dep-dbqgd4gae00c738b1esg` — live; auto-deploy disabled

## Actual public browser close-up screenshots

- [Desktop long-price close-up — TOTAL / ৳1,250](desktop-tag-1250.png)
- [Mobile long-price close-up — TOTAL / ৳1,250](mobile-tag-1250.png)
- [iPad-sized WebKit close-up — TOTAL / ৳1,250](ipad-webkit-tag-1250.png)
- [Desktop no-artwork price close-up — TOTAL / ৳450](desktop-tag-450.png)
- [Mobile no-artwork price close-up — TOTAL / ৳450](mobile-tag-450.png)
- [Unchanged always-visible invoice at ৳1,250 — desktop](desktop-invoice-1250.png)
- [Unchanged always-visible invoice at ৳1,250 — mobile](mobile-invoice-1250.png)

These are screenshots from an automated browser, **not physical iPad captures**. Font-loading and text geometry are explicitly checked in browser automation.

## What changed

The original tag PNG and outer tag placement/scale/rotation did not change. The two printed lines now use the existing globally loaded `Hind Siliguri` font, weights 600 (small TOTAL) and 700 (larger live total). The text *group*, not the PNG, rotates **−2.5 degrees** to follow the native paper edge slope. The live amount continues receiving exactly the same shared pricing total as the permanent invoice.

Edit **`projects/chapchitra/src/worktable-price-tag-config.mjs`**, `WORKTABLE_PRICE_TAG.text`, for label/amount size, X/Y, text rotation, group line gap, letter spacing, weights, line height and alignment. The desktop, tablet and mobile artwork X/Y/width remain exactly the approved values.

## Quality gates

- **Exact-source Node tests: 169 / 169 passed; build passed.**
- **Public price-tag / live pricing checks: 201 / 201 passed**, desktop Chromium, tablet-viewport WebKit and mobile Chromium. All four garment bases, front/back A4/A3 selections, independent artwork and dual-sided max price were exercised. No clippings were detected in font/layout bounds for `৳1,250`.
- [Full machine-readable public browser QA report](public-typography-qa.json): zero JS errors, zero failed HTTP requests, Hind Siliguri loaded, correct 600/700 weights, matching text rotation and shared invoice/tag amounts.
- [Browser QA source code](browser-qa-script.cjs) for reproducibility.
- **Public front/back artwork regression: 54 / 54 passed** on the same Render review.
- Physical iPad Safari/Chrome remains **unverified**.

## Release guard

Vercel reached its daily preview quota, so an isolated Render static review service was created instead. It uses the exact feature branch, has auto-deploy disabled, and is not the shared CHAPCHITRA production or previous review deployment. **PR #86 remains DRAFT/UNMERGED; do not merge PR #85/main or promote this preview without owner approval.**
