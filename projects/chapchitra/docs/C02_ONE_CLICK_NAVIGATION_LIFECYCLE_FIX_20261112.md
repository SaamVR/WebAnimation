# C02 — One-click navigation lifecycle fix (2026-11-12)

**PR:** https://github.com/SaamVR/WebAnimation/pull/81

**Owner gate:** Draft, not merged and not deployed to shared Render.

## Root-cause investigation

The user reported a fully covered green screen that sometimes needed a second gesture to reveal the destination. The reference video ScreenRecording_11-12-2026 04-44-06_1.mp4 was named in the request but was not accessible to this run, so this diagnosis is grounded in inspected source and automated browser state traces rather than claiming analysis of its frames.

The earlier incoming reveal depended partly on the website application module installing C02, and its readiness promise ended inside requestAnimationFrame. If the website bundle failed or the post-navigation frame callback stalled on WebKit, the first-paint ink cover could remain despite the destination being ready. This is a verified architecture risk, not a deterministically reproduced explanation of the video. A separate incoming-overlay recovery watchdog was also absent.

## Implementation changes

1. Independent first-paint C02 bootstrap is injected into all 22 generated HTML entrypoints. It runs even if website app.mjs fails; idempotence guards duplicate installation.
2. Destination readiness resolves after real main content and required Artist's Edit worktable readiness, with bounded font settlement, without requiring an additional requestAnimationFrame or user gesture.
3. Navigation state is exposed for deterministic QA as idle → covering → waiting → revealing → complete. A busy guard prevents duplicate overlays and repeated native navigation.
4. A best-effort, same-origin prefetch GET starts at the initial eligible click while the approved covering animation runs. Native document navigation commits once covering has finished. The browser may still perform its own GET; these are not multiple navigation commits. Prefetch neither blocks nor delays navigation.
5. The one-use exact-route ticket automatically starts the existing destination reveal when ready. A separate 15s failure-only incoming watchdog clears any stranded cover; outgoing 13s recovery and initial-paint 18s protection remain.
6. The isolated review offers 1-, 3- and 5-second content-readiness demos alongside existing 2.2s/4.5s examples. Real pages receive no artificial delays.

## Exact creative and behavioral preservation

No change to the owner-original SVG paths, Press Green #293D2D cylinder, Graphite #232323 handle, three original paths or Illustrator viewBox; no change to screen-space flip, contact positioning, roller size clamp(318px,33vw,450px), organic ink contours or palette.

**Cover remains 506ms; reveal remains 385ms.** No additional animated hold. Native page URLs, Back/Forward, direct reloads, reduced-motion and native exclusions are unchanged. C01, C08, Compact/Long unnumbered button systems, Add to Bag ink, Artist's Edit garment worktable, navbar and sticky behavior are not modified.

## Browser acceptance

scripts/c02-lifecycle-qa.cjs instruments actual cross-document navigation using a test-only document observer and one-use sessionStorage trace. Successful navigations must record exactly one cover, one reveal, one complete state and no stranded overlay. It covers fast, 1-, 3-, 5-second simulated readiness; genuine 3-second delayed network response; rapid double clicks; Back/Forward; reduced motion; failed app script and failed navigation.

**Local tests:** Desktop Chromium 35/35 and tablet-sized WebKit 35/35 passed. All tablet/mobile viewport checks are simulated browser runs, not a physical iPad or physical Safari test. GitHub Actions separately runs the full Chromium/WebKit matrix and uploads real browser WebM recordings; inspect the exact-head CI status before describing it as passed.

## Release / review

Open the isolated C02 review page and click once. Confirm automatic cover → genuine readiness hold → organic reveal → no overlay. Review recorded evidence, including failures and slow loads. **STOP for owner visual approval; do not merge to main or deploy to shared Render.**
