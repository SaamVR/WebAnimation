# T03 cold first-click, Safari tap-style and SVG coupon depth review

**Source:** SaamVR/WebAnimation, draft PR #28, T03-only isolated preview.
**Before revision:** 336f0eb13e3e436f0a3a19dd3ed571615460ba2e
**After:** this PR head; compare footage against the exact prior source worktree.
**Playback:** 5.2-second owner SVG and seven authored CSS animation tracks, unchanged, SHA-256 c9e2ec66f68de42dd41c4a8b9b491928416017abf7172d5e99c84fa10696cf51.

Three separate Playwright Chromium browser contexts were launched with the cache empty, served from isolated local HTTP servers from the exact Git checkouts. Recorded video starts at document load, waits for interaction readiness, then clicks open, close, reopens and closes again. Both after runs also tested a touch-enabled 834 × 1194 viewport and verified the existing session reward remains the same between openings. Source runtime masks only coupon; SVG contents never modified.

## Evidence
- before_cold_desktop.webm: old reward floats above backpack, native tap highlight is rgba(0,0,0,.18); page interaction enabled before waiting for ten image.decode() promises.
- after_cold_desktop.webm: decoded asset gate, visible-paint warmup, SVG-space coupon clipping behind front rim, transparent Safari-style tap highlight.
- after_touch_ipad_size.webm: equivalent corrected run in Chromium touch emulation, not physical iPad Safari.
- Before/after open PNG frames and results.json provide still frames plus machine-readable state observations.

Desktop and iPad-sized after contexts both reported: 7 native SVG animations, SVG coupon mask present, button enabled after loading gate, reward appears and matches on reopen, successful close/reopen/close, no page errors, no horizontal overflow, transparent tap highlight.

**Limitations:** Safari/WebKit behavior is not proven; Playwright WebKit was unavailable on this Linux runner owing to missing system libraries. These are locally served source-checkout recordings, not recordings behind Vercel SSO or physical-device Safari. User visual approval remains mandatory. No T03 homepage merge.
