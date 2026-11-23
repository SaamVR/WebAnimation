# Vantela — Single-Motion Showcase Correction (2026-11-24)

## Why this patch was required
Owner screenshots from iPad Chrome showed AI01/AI02 still split into original before/after screenshots, static imagery appearing behind the player for AI04/AI05/AI07, missing or obstructed AI03/AI06, technical `AI01.lottie • 16:10 slot` labels, and a `01 / 07` navigator. Root cause: the integration script only wrapped one original `<img>` in each card, retaining static siblings and restoring poster/still visibility whenever a host left the viewport.

## Implementation
- Replaced original image nodes of all **14 animation hosts** with single empty media slots: seven AI01–AI07 story stages, AI08 full monitor and six individual AI08 icon slots.
- Removed AI01/AI02 before/after comparison frames and all seven technical slot badges / “Plays on scroll” markers.
- Removed the sticky numbered story rail and 21 additional visible technical animation-ID badges. Visitor-facing service names, color cards and the approved fifth CMS tile styling remain.
- Uses a single full-frame, object-fit:contain MP4-backed player per host. Its native vector alternate is available using `?player=lottie` for controlled QA; it does not overlay a second playback mode. Existing source JSON/.lottie files are unchanged.
- Playback only begins when a host enters the viewport. When it leaves, media pauses and the actual player frame remains; no older screenshots reappear. Explicit replay controls now call a player restart.
- Fallback poster appears only on load/playback error or for prefers-reduced-motion, not behind or on top of an active player.
- All changes confined to `projects/vantela-ai/` on isolated branch. Render auto-deploy remained off and no deployment was requested or performed.

## Verification performed
- GitHub readback of edited blob and in-memory JavaScript syntax compilation: **PASS**.
- Source invariants: 14 single-host targets; 7 story targets; 7 replay handlers; no `img[data-vantela-motion]`, no old AI01/02 comparison elements, no visitor-facing `AI01`–`AI08` technical badges: **PASS**.
- Run repeatable structural check: `node projects/vantela-ai/tests/single_motion_showcase_contract.mjs`. It checks markup and syntax only; it does **not** establish actual browser performance.

## Acceptance still required
- Local (non-deployed) browser run: real advancing MP4 frames for **all 14** hosts, including AI03 and square AI06; no overlays or unexpected cropping, and replay/reset checked individually.
- Test iPad Safari/Chrome with muted `playsinline`, scroll entry/exit, landscape and reduced-motion.
- Confirm `?player=lottie` native fidelity before considering native rendering the default; all 13 native Lottie sources remain intact.
- Previously documented white-on-orange WCAG AA contrast variance remains separate and unchanged.

**Deployment: NONE — existing Render service and live commit are untouched.**

## Follow-up QA: rendered media and AI04 matte (same owner correction)
- On authorized Windows headless Chrome, a local copy of this branch was exercised against the **unchanged live media files**. All seven AI01–AI07 story videos reported `readyState=4`, advancing `currentTime>1s`, actual video visible, fallback poster hidden, and zero legacy still image children. Replay reset AI02 to approximately 0.67 seconds and resumed playback. At 390px, no horizontal overflow; no page-level JavaScript errors.
- AI03 and AI06 desktop screenshots visibly contain their illustrated moving scenes. AI05 and AI07 likewise showed their expected compositions.
- This test revealed a genuine additional issue: original `ai04/preview.mp4` carries an opaque **black matte**, exposed when its legacy screenshot was removed. The original MP4 was **not replaced or deleted**.
- Added `assets/animations/ai04/preview-web.mp4`, a 670×376, 30fps, exactly 16.0s MP4 with the black matte composited against the approved AI04 pale-yellow card `#FFF2C9`. Its video is selected only for AI04 in the showcase; original `animation.json`, `animation.lottie`, source poster and `preview.mp4` stay unchanged.
- The corrected AI04 web preview was decoded and frame-advanced in headless Chrome, with the original source illustrations visible and no black surround. The local 7/7 playback regression passed again after this correction.
- Browser network logs show `net::ERR_ABORTED` for some **offscreen/cancelled range requests** during rapid scroll; actual onscreen media reached decoded `readyState=4` and advanced. This is not interpreted as an HTTP 404 or media decode failure. A slower real-device network pass is still required.
- Optional `?player=lottie` was also exercised for AI04: the SVG player did initialize but source animation art still exhibited overlapping Summary/Task Complete lettering in one sampled frame. The native source was not modified; it requires separate creative verification before being the default.
- No physical iPad Safari/Chrome run and no newly hosted review page. Render service remains at previously verified live commit until explicit authorization.
