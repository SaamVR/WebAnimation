# ZESTRY V11 — F01 Covers the Circular Hero (2026-11-18)

Scope: SaamVR/WebAnimation/projects/restaurant-demo/ ONLY.
Review branch: feat/zestry-v8-editorial-fixes-20261118 (Draft PR #125).
Deployment: NOT DEPLOYED.

## Problem and fix

The approved F01 source canvas is 1984x1134 (1.75:1).
The circular hero is square (1:1). The earlier Lottie SVG renderer setting was
preserveAspectRatio xMidYMid meet, resulting in an empty top and bottom zone that
showed the container's yellow background color #FFD24B.

The only functional V11 change is that the SVG renderer setting becomes:
rendererSettings: { preserveAspectRatio: name==='f01' ? 'xMidYMid slice' : 'xMidYMid meet' }

The wide source is therefore scaled proportionally to cover the circle,
and its excess LEFT/RIGHT content is cropped at the circular frame.
The original completed pasta bowl stays centered. Other Lotties retain meet.
The exact F01 JSON, all vector artwork, keyframes, and duration are unchanged.
F04 remains ONLY in simulated checkout confirmation with original 240-frame playback.
F05 menu and F07 reservation unchanged. No other website areas touched.

## Chromium evidence

Tested 1818x828, 1440x900, 1024x768, 390x844, 320x690.
At every size:
- 1:1 hero, 50% border radius, no SVG clip; F01 SVG preserveAspectRatio = xMidYMid slice
- viewBox = 0 0 1984 1134
- No JS exceptions, failed HTTP assets or horizontal overflow.
- Original F01 SVG renders within the circle.
- The tabletop now fills the entire circle, including top and bottom, with NO yellow bands.

Simulated book -> bag -> pickup checkout -> original F04 confirmed: 240 frames,
loop false, "Sample order received".

Screenshot evidence:
- docs/qa/owner-v11/desktop-circle-filled.png
- docs/qa/owner-v11/mobile-circle-filled.png
- docs/qa/owner-v11/desktop-hero-full.png
- docs/qa/owner-v11/browser-report.json

Approved binary SHA-256, unchanged:
F01 JSON: 7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37
F03 JSON: 136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68
F04 JSON: e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0
F05 dotLottie: 3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645
F07 V5 JSON: a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b

Owner creative review pending. No deployment without explicit authorization.