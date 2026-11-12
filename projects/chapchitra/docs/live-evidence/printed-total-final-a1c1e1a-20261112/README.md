# CHAPCHITRA — Final Artist's Edit price-tag replacement: printed “Total” and live amount

**Owner review date:** November 12, 2026  
**Exact implementation:** `a1c1e1ab40f9b85838864cac8889f3d80131add8`  
**Draft PR:** https://github.com/SaamVR/WebAnimation/pull/87  
**Isolated Render review:** https://chapchitra-artist-tag-final-review.onrender.com/artists-edit/  
**Deployment ID:** `dep-dbqhan142hec73d4ke60` (live, manual review; auto-deploy OFF)

## Close-up screenshots — real deployed site, not mockups

- [Desktop, revised printed title + ৳1,250](desktop-tag-1250.png)
- [Mobile, revised printed title + ৳1,250](mobile-tag-1250.png)
- [iPad-sized WebKit, ৳1,250](tablet-webkit-tag-1250.png)
- [Desktop, revised title + ৳450 base price](desktop-tag-450.png)
- [Mobile, revised title + ৳450 base price](mobile-tag-450.png)
- [Desktop invoice remains unchanged](desktop-invoice-1250.png)
- [Mobile invoice remains unchanged](mobile-invoice-1250.png)

All screenshots are captured from the exact live Render review SHA. Tablet-viewport WebKit is **not** a physical iPad.

## Replacement-artwork provenance

The owner supplied `Price_tag(2).png` (2048×1152 RGBA), original SHA-256 `e7cea65966d18892972d4bfa14b7f25c7d3c7ca13cf1923fabb8195b50253505`.

Measured nonzero alpha bounds: `(1497,28)–(1793,153)` (right/bottom exclusive). The production PNG is a **pixel-preserving crop** at `(1489,19)–(1801,161)`, 312×142 RGBA, SHA-256 `5d5439bfb6a4f77ed06a66273677e40ff9c938816f77590e0441cc232cd825e0`. Exactly the same **312×142 registration dimensions** are retained for the worktable tag as previously approved. New printed "Total", texture, rope, eyelet, irregular paper edges and original transparency are retained.

## Presentation adjustment

- Removed duplicate HTML title entirely. `Total` is permanently printed on the supplied artwork.
- Live HTML overlay contains **only the dynamic BDT amount**, updated by the existing `calculateArtistPrice` result.
- Visual comparison of Noto Serif Bengali, bold Georgia and adjusted variants led to **Georgia Bold numerals with Noto Serif Bengali fallback for the ৳ symbol**.
- Final parameters (centralized in `src/worktable-price-tag-config.mjs`): `xPercent:58.5`, `yPercent:66.5`, `fontSizeCqw:15.5`, `rotationDeg:-2.5`, `fontWeight:700`, `widthPercent:70`, `letterSpacingEm:-0.025`, Press Green `#293D2D`. Font family and alignment can be updated there.
- **No change** to tag's worktable x/y, responsive width, outer PNG rotation, desk geometry, front/back garment assets, print guides, invoice, cart, or animations.

## Source and browser QA

- **Exact deployed Render build: PASS**, source commit `a1c1e1ab40f9b85838864cac8889f3d80131add8`.
- [Native source test TAP](native-tests.tap): **170/170 PASS** on the replacement-artwork implementation; final calibration changed only centralized typography values and their assertions, and the final Render build completed.
- [Public visual typography and price synchronization QA](public-tag-amount-qa.json): **192/192 PASS**, desktop Chromium / iPad-sized WebKit / mobile Chromium. Includes all four garment bases, both print sizes, front/back artwork, A4/A3 mixed sides, max `৳1,250`, no HTML title, font fallback, text angle, visual bounds, zero overlap, price synchronization. Zero browser JavaScript errors or failed HTTP requests.
- [Public pricing/cart regression](pricing-regression.json): **60/60 PASS**.
- [Public front/back editing regression](two-sided-regression.json): **54/54 PASS**.
- [Public sitewide navbar regression](navbar-regression.json): **90/90 PASS**.
- [Reproducible browser QA script](public-qa-script.cjs).

## Approval boundary

This is an **isolated manual Render review**; shared `chapchitra-webanimation.onrender.com` still points to `29f484bb866146e8c2a52cfc12d9035413b38a68`. No change to production, PR #85, PR #86, other animations, or main. PR #87 remains DRAFT/UNMERGED for owner visual approval.

**Physical iPad hardware remains unverified.** A visual review on the owner's actual device is still required.
