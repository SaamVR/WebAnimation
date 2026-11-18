# SUPERSEDED — V16 transition-zoom proof, not the current design

This folder documents the **rejected** earlier V16 approach that grew from small to large after ingredients entered. The owner explicitly rejected this behavior. It remains solely for audit/history. **Do not show it as the current review.**

The authoritative corrected fixed-size review is [`docs/qa/owner-v16-fixed/`](../owner-v16-fixed/), with constant 1.755× camera across all frames, retargeted ingredient paths, QA results and actual desktop/mobile recordings. The live Render site still runs V15.

---

# ZESTRY V16 — review-only, NOT DEPLOYED

**Request:** 30% larger than the deployed V15 F01 foreground, not 30% larger than V14.
**Verified target:** 1.30 × 1.35 = 1.755× the V14 artwork size.
**Background:** original 756.6px wooden circle and yellow accent unchanged.
**Motion:** original 261-frame/8.7s timing, vector paths and easing preserved. Camera enlargement after the safe entrance and derived position-only retargeting at factor 0.82 for moving ingredient centers avoids new circular clipping.

Native Chromium captured and checked all 261 frames at desktop, tablet and mobile viewports, plus natural-speed desktop/mobile recordings, reduced-motion check, and a same-frame side-by-side before/after visual. Any early f51–f52 edge-band pixels belong to the unchanged 1× baseline entrance, not the new enlarged frames.

**Do not merge or deploy until the owner explicitly approves the visual.** The existing Render service and deploy branch are untouched.
