# ZESTRY V16 — review-only, NOT DEPLOYED

**Request:** 30% larger than the deployed V15 F01 foreground, not 30% larger than V14.
**Verified target:** 1.30 × 1.35 = 1.755× the V14 artwork size.
**Background:** original 756.6px wooden circle and yellow accent unchanged.
**Motion:** fixed 1.755x camera from frame 0, no enlargement transition at any time. Original 261-frame/8.7s timing and vector paths/easing preserved. Derived position-only retargeting at factor 0.82 applies from the first frame.

Native Chromium captured and checked all 261 frames at desktop, tablet and mobile viewports, plus natural-speed desktop/mobile recordings, reduced-motion check, and a same-frame side-by-side before/after visual. Zero unexpected edge-band overlaps are required in all frames, including entrances.

**Do not merge or deploy until the owner explicitly approves the visual.** The existing Render service and deploy branch are untouched.
