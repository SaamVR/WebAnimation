# ZESTRY V17.1 — live-discovered deferred-menu initialization race

The first V17 live-URL Chromium smoke test found an early menu click could invoke `states.get()` before the async 4.2MB F05 book ZIP had initialized its state machine, causing a JavaScript TypeError. This failure is **not accepted as a successful final release**.

## Minimal correction

The F05 click/event `fire` routine now buffers up to four distinct user inputs while the state map is uninitialized. After `await enter(sm.initial)` completes and `window.__f05Ready` becomes true, the buffer is replayed. No animation geometry, scene design, timing, navigation semantics, or order/booking functionality is changed.

## Native browser QA

- Deliberately delayed the F05 .lottie HTTP response by 3500ms and clicked **before** `__f05Ready`.
- Verified one event was buffered, replayed once, Closed→Overview→Starters, clicking the illustrated dish increments bag from 0 to 1.
- No browser console/runtime errors.
- Reran whole native-browser workflow: wooden background, F05 menu, F04 8-second checkout-only confirmation, F07 simulated reservation, zero JS errors or missing assets.
- Evidence: `v17-hotfix-menu-early-click.json`, `v17-hotfix-menu-after-early-click.png`, `V17_HOTFIX_FUNCTIONAL_QA.json`.

**Deployment gate:** verify corrected F05 and full original F01 playback against final existing public Render URL; no second service.
