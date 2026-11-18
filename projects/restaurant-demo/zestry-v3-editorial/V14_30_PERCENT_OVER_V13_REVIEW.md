# ZESTRY V14 — 30% bigger than V13 (review only)

**Date:** 2026-11-18  
**Repository:** `SaamVR/WebAnimation`  
**Scope:** `projects/restaurant-demo/` only  
**Deployment:** **None. The owner must explicitly authorize deployment.**

## Change
- V13 desktop circle: **582px**. V14 desktop target: **756.6px** (582 × 1.30).
- F01 moving-ingredient stage scales with the circle: V13 488.88px → V14 **635.544px**, exactly +30%.
- Maintain the previous original 84% inscribed stage and separate wood-vector background, so the complete moving-ingredient canvas remains within the circular wood backdrop.
- At full 756.6px desktop size, analytical source-corner clearance is approximately **12.28px**. The same source-to-circle proportions apply as the previous QA-approved no-crop V12/V13 implementation.
- Preserve the subtle yellow accent, exact original F01 Lottie, F04 checkout-only, F03, F05, F06, F07, and F08 excluded.

## Layout
The existing website's base hero is a 1220px-wide split grid, with nearly equal columns. That could not accommodate a 756.6px circle without capping it. On viewports at least 1100px wide, extend only the hero wrap to max 1500px, use split columns 0.85fr : 1.3fr, and a fluid 28–52px gap. Preserve the left headline/buttons and right circular storytelling visual. Below that width, responsive rules cap the circle to available space; narrow mobile screens will not physically display an exact +30% size because doing so would overflow.

## Verification
- Updated source CSS and CSS in the packaged review ZIP together.
- ZIP central directory still has 57 entries; CSS local header and payload CRC32 were verified; all other original compressed asset bytes and other ZIP parts unchanged.
- The approved F01 vector source, choreography, timing, and F04 checkout integration are untouched.
- Fresh full browser video QA is **not yet completed**: Desktop Commander reports its monthly execution quota exhausted. Do not represent these static sizing and ZIP integrity checks as full visual/interaction acceptance.

**Draft PR #125. Do not merge or deploy without the owner's permission.**
