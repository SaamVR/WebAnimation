# THREADS T03 — native CSS animation fidelity QA (creative review only)

**Authoritative SVG:** `site/threads/t03-v2-preview/assets/backpack_animated_postcard.svg`, exact SHA-256 `025cb57273465c938177ad9da4778ccb2edaf8cbd8f66631344e4f0afa3858f2`. The 5-second source has 8 authored keyframe sets and 9 native CSS animation tracks. The asset, easing, transforms, keyframes, layer graphics and built-in postcard group are unchanged.

## Reproduction and fix
- Prior baseline: `a7cb21152ee574169614d3a8476ab1058c2255b5`; prior JS seeks every track to 0/2500/3100ms, calls `pause()` and `play()` per layer, uses setTimeout rather than actual CSS timeline progress, and jumps from 50% to 62% when closing.
- Corrected: the source CSS owns the whole 5-second continuously repeating animation. Only one **SVG element class** toggles CSS `animation-play-state` across all 9 tracks simultaneously. No programmatic currentTime assignment, per-layer pause()/play(), setTimeout, animation keyframe override or reverse. The controller reads one master native animation's currentTime to detect the original 60%-open pose (within the source 41%-62% hold), pauses once, and resumes native CSS through its authored close to the natural 100%/0% loop boundary. Rapid-click requests use a simple desired-open flag; original choreography always completes.
- `site/threads/t03-v2-preview/native-motion.html`: an **unmodified** standalone `<object>` pointing at the exact original SVG, auto-looping with no JS playback controls. It is deliberately separated from the interactive demo for visual comparison.
- All nine original data-URI PNG layers preload/decode before user clicks are enabled. Reward text and postcard width adjustment remain in the original postcard SVG group at runtime; reward weights and session storage unchanged.

## Browser evidence (source-matched Git worktrees)
- `native-free-loop.webm`: natural standalone source SVG playback.
- `before_desktop.webm`: prior JS-driven source controller.
- `after_desktop.webm`: new native CSS controller, first opening, closing, reopening.
- `after_ipad_touch.webm`: touch-enabled iPad-sized **Chromium**, not Safari.
- `after_rapid_taps.webm`: quick 2nd click during opening -> naturally closed; quick 2nd click during closing -> naturally reopened.
- PNG frames and `results.json`: original 9 tracks, closed/opened art and captured progress.

On shared QA machine (1200×800 desktop; 834×1194 tablet):
- Desktop baseline first open: 2.503s forcibly held at 2500ms SVG time; 103 rAF samples/3.38s; p95 observed frame interval 116ms; 12 distinct postcard transform updates.
- New desktop: opened at 3.052s with native CSS time ~3017ms; 122 rAF samples/3.38s; p95 66ms; 18 transform updates.
- New tablet touch: opened at 3.044s and paused at original open hold; 124 rAF samples; p95 60ms; 18 transform changes.
- Subsequent reopen/close and rapid-click queued state tests **PASS** with no JS exceptions or overflow.
These metrics reflect the shared Linux Chromium QA machine, **not guaranteed 60fps or measured iPad Safari**. Actual physical Safari/WebKit testing was unavailable. Passing automated QA does not grant creative approval.

Only the isolated T03 preview, source-contract regression tests, new native SVG comparison page, and QA evidence are changed. No main/homepage integration, T01/T02/T04, footer, navbar, catalog, pricing, Deals, countdown, galleries, or `SaamVR/EcomCMS` changes.
