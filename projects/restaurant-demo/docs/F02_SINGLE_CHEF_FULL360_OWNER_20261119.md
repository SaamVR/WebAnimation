# ZESTRY — One Chef, Full 360° Clockwise F02 (owner replacement)

**Authoritative input:** user-uploaded `F02_Chef_In_Action_FULL_360_CLOCKWISE_COMPLETE(1).zip` on 2026-11-19.  
**Website scope:** `SaamVR/WebAnimation/projects/restaurant-demo/`.  
**Status:** Source integration only; **NO preview deployment**.

## One animated chef — replacing both older illustrations

The kitchen section previously showed two incompatible chef styles:

- `f02-orbit` — earlier decorative 52° orbit.
- `f02-cooking` — separate chef rendering and pan-toss animation.

**Neither is used by the updated page.** One primary `data-animation="f02-chef-full360"` hosts the latest submitted illustration. The section headline now reads **One chef. Plenty of flair.** The paragraph and closing line were revised to describe a single chef, a natural pan toss, and surrounding clockwise ingredients. The rest of the ZESTRY site and its copy remain unchanged.

## Source provenance and immutable art

The owner's upload contains the final native vector file `F02_Chef_In_Action_Full_360_Clockwise.json`, a matching `.lottie` archive, MP4/GIF previews, source artwork, a baseline 52° JSON, and a reproduction script.

- **Final Lottie SHA-256:** `e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa`.
- Source composition **2268×2268**, **30 FPS**, **210 frames / 7 seconds**, 84 vector layers, no embedded raster images.
- All original chef movements, pan-toss choreography, and 16 thrown vegetable pieces are preserved.
- Exactly 13 outer garnish controllers follow a complete clockwise orbit, returning to their exact starting transforms at frame 209.
- Rebuild script `zestry-v3-editorial/rebuild_owner_f02_360_exact.py` reproduces the **exact submitted JSON bytes**, using the uploaded original builder and geometry-derived static bounds. It refuses to write if the output SHA differs from the owner's file. This addresses the size limitation of transferring a large source through the GitHub connector without substituting newly drawn artwork.
- Original source is saved as `assets/lottie/f02-chef-full360.json`; the same bytes appear in the served review ZIP as `assets/lottie/f02-chef-full360.json`.
- Earlier historical F02 JSON files are retained for provenance, but neither is loaded. The user requested their **website removal**, not destructive rewriting of Git history.

## Site integration policy

- One illustration only, large square aspect, native SVG paths, `preserveAspectRatio=xMidYMid meet`, `overflow:visible` — no crop, extra orbit, reverse, shape retiming, zoom, SVG replacement, or faux GSAP motion.
- Lottie is played **forward only**, once, at original 30fps and holds its final frame, following the uploaded `.lottie` manifest's `loop:false` policy. This avoids the previous V18 reverse motion and unintended reset.
- The kitchen copy and responsive single-chef layout were revised; F01 V4 pasta, F03 coffee, F04 demo checkout, F05 interactive menu, F06 process, and F07 reservation stay unchanged.
- Existing live Render service `srv-dbtkitifngtc73cua2p0` has autoDeploy disabled. This task **does not deploy another preview or update the public website**. The new single-chef section is staged in GitHub until separately authorized to deploy.

## Native rendering QA

The owner's package explicitly left official `lottie-web` browser compatibility unverified. This integration therefore tests the **actual shipped native Lottie-web player** in isolated Chromium desktop (1600×900) and mobile (390×844) at original frames 0, 30, 60, 105, 150, 180, 209, plus a complete natural-speed 7-second playback and final hold. It verifies SVG integrity, source SHA, absence of either old chef, absence of crop/overflow, and preservation of other website animations.

Evidence is in `docs/qa/owner-f02-single-360-source-only/` including machine report, original browser screenshots and real desktop/mobile WebM recordings.

**Creative approval remains with the owner. No new preview deployment.**
