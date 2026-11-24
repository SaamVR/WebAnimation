# CHAPCHITRA — Final LIVE staging visual and interactive QA

Verified Render staging SHA: c41b8c747167ef2cc2e1d1c486f9a6b554856837
Verified existing Render deployment: dep-dc2s9ps9v7es73bjv3mg
Public site: https://chapchitra-webanimation.onrender.com/
Recorded at: 2026-11-24T17:14:42.983478+00:00
Release: staging only; production and main unchanged.

## Unmodified real public website evidence

- mobile-live-qa.json: 360/360 checks passed across 16 Chromium/WebKit profiles at 320px/375px/390px/430px, both light and dark modes. No candidate asset or request interception.
- 64 real-browser viewport captures: source SVG navbar, expanded menu, original animated top-to-bottom ink cover, and Shop destination after reveal for each profile.
- CHAPCHITRA_LIVE_Mobile_OptionA_C02_Vertical_Both_Themes_390x844.mp4: real 390x844 browser recordings of dark and light sessions concatenated with one ordinary cut; H.264. SHA256 35c3c6d5eda6e777a5fb0943acd89dc51968c968cda472c064a54d9a0a59ff30
- live-cseries-smoke.json: 19/19 passed, preserving C03 fly-to-bag, C04 stamped counters/pagination, and C08 owner-logo hover.
- live-horizontal-c02-final.json: 10/10 passed on desktop Chromium and iPad WebKit, verifying the original horizontal C02, cross-document continuity and theme-specific backings.

Live Render metadata must show status live at the exact SHA above. The browser QA uses the existing public origin without substituting source resources. The pre-deployment candidate captures live separately in the parent evidence folder.
