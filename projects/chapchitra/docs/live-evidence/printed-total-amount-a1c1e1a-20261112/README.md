# CHAPCHITRA — Revised illustrated price tag, amount-only visual QA

**Date:** November 12, 2026
**Feature:** Artist's Edit · revision of the owner-supplied printed “Total” tag
**Exact implementation SHA:** `a1c1e1ab40f9b85838864cac8889f3d80131add8`
**Draft PR:** https://github.com/SaamVR/WebAnimation/pull/87
**Live isolated Render review:** https://chapchitra-artist-tag-final-review.onrender.com/artists-edit/
**Render deploy:** `dep-dbqhan142hec73d4ke60` (status live, source SHA verified, auto-deploy disabled)

## Owner review screenshots — actual public-browser captures

- [Desktop revised tag · Total / ৳1,250](desktop-tag-1250.png)
- [Mobile revised tag · Total / ৳1,250](mobile-tag-1250.png)
- [iPad-sized WebKit revised tag · Total / ৳1,250](tablet-webkit-tag-1250.png)
- [Desktop revised tag · Total / ৳450](desktop-tag-450.png)
- [Mobile revised tag · Total / ৳450](mobile-tag-450.png)
- [Unchanged permanent invoice · desktop](desktop-invoice-1250.png)
- [Unchanged permanent invoice · mobile](mobile-invoice-1250.png)

These are browser captures from desktop Chromium, iPad-sized WebKit and mobile Chromium, **NOT physical-iPad hardware captures**.

## What changed and what did not

The owner-supplied **Price_tag(2).png** (2048×1152 transparent source canvas) already has the word **“Total” printed in the illustration**. The alpha-trimmed replacement uses the same **312×142 px** image registration and the same desk-relative desktop/tablet/mobile X/Y coordinates, size and outer rotation. This preserves the original paper, rope, eyelet, shadow, texture and natural tilt.

There is **no HTML title** on the illustrated tag: its only HTML text is the live calculated BDT amount. Final visual calibration against desktop/mobile close-ups uses **Georgia Bold numerals** with the existing **Noto Serif Bengali** fallback for the `৳` glyph, Press Green `#293D2D`, **15.5cqw**, centered at **x=58.5%, y=66.5%** of the trimmed tag, text rotation **−2.5°**. The PNG and its outer transform are not rotated.

These parameters remain adjustable in `projects/chapchitra/src/worktable-price-tag-config.mjs`: amount X/Y, rotation, font size, family, weight, text width and alignment. The unchanged `calculateArtistPrice` result updates both the tag and permanent itemized invoice. No pricing, cart, garment, worktable, artwork-editing, navbar, button or animation code changes were requested or made.

## Verification

- [Public amount-only typography and calculation browser QA](public-price-tag-qa.json): **192 / 192 PASS**, with **0 browser JavaScript errors** and **0 failed HTTP requests**, across desktop Chromium, iPad-sized WebKit, mobile Chromium. Checks cover no duplicate HTML title, exact revised PNG size, serif font and text tilt, all garment base prices, no-artwork, independent front/back A3 and A4, dual-A3 `৳1,250`, mixed `৳1,150`, selected size and color neutrality, no amount clipping, no tag/garment hit-area collision and invoice synchronization.
- [Unmodified pricing and demo-bag browser regression](public-pricing-regression.json): **60 / 60 PASS**, 0 JS errors, 0 failed HTTP requests.
- [Unmodified two-sided editor browser regression](public-front-back-regression.json): **54 / 54 PASS**, 0 JS errors, 0 failed HTTP requests.
- [Navbar browser regression](public-navbar-regression.json): **90 / 90 PASS**, preserving the Artist's Edit normal-flow navbar and other pages' sticky behavior.
- [Local Node unit test report](source-tests.tap): **170 / 170 PASS** on the initial replacement candidate `92ddd34c`. **Additionally, the isolated Render build logs explicitly confirm `ℹ tests 170`, `ℹ pass 170`, `ℹ fail 0` on the exact final deployed source SHA `a1c1e1ab40f9b85838864cac8889f3d80131add8`; the full build completed and the deployment is LIVE.**
- [Reproducible public browser QA source](public-browser-qa.cjs).

**Remaining hardware gate:** No real iPadOS/iPad device was tested. Owner visual acceptance is still required.

## Release guard

**Review only.** Keep PR #87 draft and unmerged. The additional evidence branch must not change the deployed implementation. Do **NOT** merge into the preceding PR #86 or `main`, and do not advance the shared CHAPCHITRA Render deployment, existing C-series animations or other projects without explicit owner approval.
