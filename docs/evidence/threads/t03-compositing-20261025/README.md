# T03 compositing and rapid-click regression evidence

**Before**: original PR #28 head 40730390c5ca46df800cf0d794cc5250b923d841.
**After**: fix c6f32a762259899ad1df72c73783b1ce2a21543e.

Recorded through Playwright from two local static-server checkouts of the exact Git revisions, not from the team-authenticated Vercel URL.

- before_desktop.webm: original overlay/clipping and disabled button.
- after_desktop.webm: corrected SVG-only rendering, two rapid clicks, open/coupon and close.
- after_ipad_touch.webm: same tests at iPad-sized 820x1180 touch-enabled Chromium viewport.
- qa.json: DOM/video test observations. PNGs provide representative closed/opened visual frames.

Source animation SVG and coupon CSS keyframes were *not modified*. Seven SVG tracks remain present in every run; after scenarios finished closed with no JS exceptions.

**Limitation:** This is Chromium emulation, NOT iPad Safari/WebKit or a physical iPad test. WebKit could not launch on QA Linux due to missing host libraries. Visual approval remains owner-gated; homepage remains unchanged.
