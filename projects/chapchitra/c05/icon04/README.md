# CHAPCHITRA C05 — Icon 04 / Onto What You Wear

**Status:** V3 SOFT BOUNCE — owner visual review pending. **DO NOT INTEGRATE OR DEPLOY.**

This folder belongs to the standalone Making Lottie lane; it is **not imported by the CHAPCHITRA site**. Icons 01–03 and the main site are untouched.

## Files

- CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.json: preserved native Lottie V2 baseline (unchanged).
- produce_icon04_drop_in_V2_ORIGINAL.py: exact prior editable source generator, preserved as reference (its source SVG is not bundled here).
- CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V3_SOFT_BOUNCE.json: V3 native Lottie, 512 × 512, 30 fps, 60 frames.
- CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V3_SOFT_BOUNCE.lottie: ZIP-based native dotLottie package, manifest.json plus the matching V3 animation JSON.
- refine_icon04_soft_bounce.py: reproducible V2-to-V3 motion-only source refiner. Execute python3 refine_icon04_soft_bounce.py in this directory.
- ICON04_V3_LOCAL_REVIEW.html: local standalone Lottie-web player; keep lottie.min.js in the same folder.
- lottie.min.js, LOTTIE_WEB_LICENSE.md: unmodified MIT-licensed Lottie-web v5.12.2 review runtime and required license.

## One top-shirt movement

| Frame | Time (30 fps) | Position Y, px | Meaning |
| --- | ---: | ---: | --- |
| 0 | 0.00s | -121 | Existing entrance above composition |
| 16 | 0.533s | 194 | Near contact |
| 18 | 0.600s | 240.5 | Soft landing/contact |
| 21 | 0.700s | 233 | Single rebound at 6px above resting position |
| 27 | 0.900s | 239 | Exact final rest |
| 59 | 1.967s | 239 | Stable final hold |

No X drift, no opacity change, no geometry deformation, no matte/mask, no looping, no secondary bounce. The top layer's .65-degree micro-tilt during the descent ends at contact. Both lower layers are unchanged.

## Local review (no hosted preview)

Download this folder from the feature branch and open ICON04_V3_LOCAL_REVIEW.html in a local browser. The player uses bundled **native Lottie-web** and supports replay, pause, and per-frame scrubbing. The circle is a static **review-only** background guide; it does not clip the animation.

**QA distinction:** Exact native JSON source comparisons and keyframe invariants have been checked in this session. A native Lottie-web runtime is bundled, but independent end-to-end browser playback and a real recording from this final V3 file still require a visual capture run. Do not call them passed until a recording and browser evidence exist.

**Approvals:** Icons 01–03 previously owner-approved; Icon 04 V3 **awaiting owner visual approval**. After approval, hand off paths/formats/SHAs/playback instructions to Animation Integration (not to staging directly).

**Deployment: NONE — per no-automatic-preview policy.**
