# C08 complete dual-theme replacement — 2026-11-25

Existing PR #165 only; baseline a47fa91135c94de0fc38626515f1ecf2a918f4ee. No merge, staging write, hosting preview or deployment. PR #151 remains obsolete.

## Source and rendering
Both owner compositions are byte-exact JSON from the final supplied ZIP; matching dotLottie JSON is identical (see source manifest). Only JSON is served. Existing locally hosted lottie-web SVG player renders the entire 2400-square composition at the original logo width and origin. The original static SVG owns layout. Embedded PNG is explicitly decoded before native reveal; no split cloth layer or color conversion. The opposite theme warms after the active theme is ready. At most two cached theme players, only one visible and running. Static theme images are decoded before replacement. Mid-playback switch captures frame, pauses, seeks the matching renderer and resumes without a new autoplay. Failure retains static art. Reduced motion keeps static artwork. Pagehide destroys nonpersisted players; BFCache pauses/resumes.

## Trigger and timing contract
Initial autoplay once if at least 4.12 seconds remain in first Hero01 dwell; if cold load misses this window, retain static and permit deliberate replay. This preserves independent 8-second Hero01 and 4-second other slide clocks. No autoplay on return or theme switch; deliberate replay via pointer re-entry, touch or keyboard. Navbar and footer remain static as established by PR165. No unrelated animation, navbar, toggle or Artist Edit changes.

## QA evidence
Previous PR165 run 45555454819 passed native, C02 and main browser smoke, failed obsolete C08 autoplay expectation while carousel dwell remained correct. New native suite passed 308/308 locally; initial production-equivalent build passed, including exact delivered JSON hashes. Browser gate extends existing CI recording runner with Chromium/WebKit desktop/tablet/mobile light/dark, controlled cold JSON response holds, rapid theme changes, frame continuity, native patch pixel comparison, replay, reduction, request failure and disposal. Recordings are uncut Playwright native-page WebM, not composited substitutes. Exact-head CI and visual acceptance must be verified before declaring the replacement ready. Physical iPad Safari, sustained heap measurement and measured real cellular throughput are outside this automated coverage.

No hosted preview or deployment is authorized.
