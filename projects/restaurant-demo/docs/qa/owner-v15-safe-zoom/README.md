# ZESTRY V15 — 35% F01 foreground enlargement with safe ingredient entry

**Owner requirement:** Enlarge the visual F01 bowl and flying ingredients by **35% over V14**, approaching the green-marked region of the 756.6px wooden circle, without cutting off flying ingredients.

**Implemented:** Frame-synchronized camera zoom of the complete original F01 vector composition from 1.00× at frames 0–92 to **1.35×** by frame 128, holding at 1.35× through frame 260. No Lottie keyframes, vector artwork, layer order, or 8.7-second duration altered. Keeps the original wood tabletop and yellow accent.

**Reason for graduated zoom:** Simple constant 1.35× cropping was reproduced at frames 21–24 (tomato), 34–35 (basil), 43–44 (mushrooms), 46–59 (noodles), and 84–85. The full-zoom visually larger composition is safe after the entrance motion clears.

**Real browser QA:** 261 frames inspected at 1600×900 desktop, 768×1024 tablet and 390×844 mobile. No horizontal overflow, JavaScript errors, missing assets, or enlargement-induced circular clipping at frames 92–260. Desktop frames 51–53 have 12–13 outer-band antialias pixels at **1.00× original framing**, logged as a pre-existing baseline-only warning (no V15 zoom at those frames). No mobile/tablet failures. Reduced-motion remains supported at 1.00×.

**Function tests:** F05 menu navigation / dish added to cart, F04 8s checkout-only confirmation, and F07 reservation test passed. Original F01, F03, F04, F07 Lottie assets remain checksum-identical. Full 8.7s natural playback actually captured in desktop/mobile Chromium WebM files.

**Creative qualification:** 35% zoom is not constant at every frame. It ramps after ingredients safely enter; a static 35% scale from frame 0 would violate the owner's no-clipping requirement.

**Deployment:** update only existing Render service `srv-dbtkitifngtc73cua2p0` after merge and live QA; this review artifact does not create any new service.
