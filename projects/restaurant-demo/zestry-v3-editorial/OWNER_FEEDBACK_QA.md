# ZESTRY V5 — Owner correction and runtime proof (2026-11-17)

The user supplied **F01_Pasta_Bowl_V4(1).zip** and **F01_Pasta_Bowl_Final_V4_Full_Preview(2).mp4**.

- Original F01 V4 composition is **8.70 seconds, 30 fps, 261 frames, 32 shape layers**, with broth pouring at approx. 4.48–4.97 seconds and the completed bowl held at 7.4–8.7 seconds.
- **SHA-256 match**: the current ZESTRY F01 and uploaded final master are byte-for-byte identical: \`7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37\`.
- **Root cause reproduced in actual Chromium**: the original JSON Broth layer (index 28) has native animated \`masksProperties\` but omits the Lottie-web \`hasMask\` flag. In an isolated browser comparison, unmodified original data rendered an empty white bowl at frame 258, while adding \`hasMask:true\` to an **in-memory runtime copy** rendered dark brown broth under the completed pasta. The master JSON remains unchanged and its hash is asserted.
- Another integration defect: F01 previously looped; now it is one-shot and holds final frame.
- F01 hero: remove photo; use yellow organic clipping shape containing only the original F01 animation.
- F03: remove real coffee photograph; center original F03 portrait animation with generous spacing. Retain one-shot.
- F02: enlarge Cooking variant beside the copy, retaining Orbit variant on the left; no source animation alterations.
- F04 only in simulated checkout confirmation; F05 interactive menu; F06 full cooking narrative; F07 alongside reservation and confirmation, none removed. F08 excluded.
- Keep changes under \`projects/restaurant-demo/\`; render on existing review service only after QA. All ordering/booking remain simulations.

## Runtime acceptance
Verify F01 native Lottie at frames 0, 138–150, 180, 220, 258; broth visible after pour and beneath final pasta. Verify F01 looping is false, F03 one-shot, footer/cart/checkout/booking and F04/F05/F06/F07 on desktop and mobile. Check no horizontal overflow and no photos inside hero and coffee sections.

The supplied preview MP4 is a vector reconstruction, not an official Lottie-web capture; runtime compatibility was established by direct Chromium before making the adaptation.
