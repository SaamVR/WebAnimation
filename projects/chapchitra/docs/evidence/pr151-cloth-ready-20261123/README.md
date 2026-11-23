# CHAPCHITRA C08 — Cloth_patch cold-load readiness: browser evidence

## Verified defect in live PR #150 staging (before this fix)
On a real cold Chromium navigation to https://chapchitra-webanimation.onrender.com/ at source SHA `4bae6e2fff4f1ace53253590c062c76591b100b9`, C08 had started at frame 35.988 while `img.c08-hero-cloth.naturalWidth === 0`. The parent already had `c08-hero-shown`, hiding the original full SVG. A screenshot captured the wordmark without the owner's cloth patch. Once SVG decoding completed, the correct artwork appeared.

## Focused corrective mechanism
The existing C08 renderer and its 240 frames, 60fps, roller geometry, easing, triggers and original artwork are unchanged. A cloth decode/readiness gate keeps the complete static original full-logo SVG visible until the original `Cloth_patch` can render, both for initial autoplay and a theme swap. Failed SVG decode retains the full static artwork.

## Actual browser tests — public staging origin with only candidate `logo-player.mjs` substituted
- The actual owner cloth request was deliberately held while browser Lottie initialization continued, then released.
- Chromium light and dark, and WebKit light: **all 5 checks passed per profile**, 0 JS exceptions. The original full logo stayed visible while cloth was blocked, C08 did not play prematurely, the patch was present on first animation frame, and the original 240-frame sequence completed.
- Mid-flight light → dark theme change with the dark cloth request held: **5/5 checks passed**. No blank patch during delay, frame continuity, exact source switch, no JS exception.
- Reports: `report.json` and `theme-swap-report.json`. Screenshots document blocked static fallback and decoded animated state.

**These captures are pre-merge browser tests, not deployed-fix evidence.** After integrating this PR, run fresh live browser QA on the exact staging merge SHA. No production/main changes permitted.
