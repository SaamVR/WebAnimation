# CHAPCHITRA — Persistent selection glow and atomic garment/color rendering

**Repository:** `SaamVR/WebAnimation` · **Starting point:** draft PR #64 at `8d82ce1940cd6236d5d67ea156b1ac2a78e4e8a5`, stacked on #63, #62, #61, #60 and #59. **Review:** existing `chapchitra-webanimation.onrender.com` service only. **All PRs remain draft/unmerged.**

## 1. Persistent selected-state glow

The prior selected-state alpha shadow had a softer filter than the approved selected+hover filter; on pointer exit the image visibly lost illumination. The new `.is-selected` rule uses **exactly the same CSS filter declarations as the already-approved `.is-selected.is-hovered` rule**:

`brightness(1.065) saturate(1.03) drop-shadow(2.1px 5px 1.8px rgb(30 23 15 / .53)) drop-shadow(0 0 2.4px rgb(248 235 204 / .52))`

The **unselected hover** and **selected-hover** rules were not changed. The original owner-approved **garment 4.5px, hanging size tag 3.5px, paint pot 5.5px, A3/A4 4px** persistent lifts remain. Selected objects retain the silhouette-following light after pointer exit. Previous options return to their original resting transform and shadow. Original paper/paint textures and the wooden tray-front occlusion remain intact. No rectangular border, ink recoloring or glow animation was introduced.

## 2. Root cause and atomic rendering solution

**Old failure mechanism:** A decoded white garment layer was replaced in the DOM and a **separate CSS mask image** was changed afterward, potentially painting a white garment before CSS mask/tint became available—especially during progressive hydration or rapid changes.

**New rendering contract:**

1. Keep the previous complete garment visible. Record requested `garment` and `color` as a last-writer-wins state. Do not show an intermediate white replacement.
2. Decode only the appropriate **existing alpha-trimmed WebP** for the requested garment (four-decoded-image cache).
3. Draw the garment into a temporary in-memory `canvas` at the original crop dimensions and apply the **same 74% multiplied fabric tint** to its original RGB pixels, preserving alpha. White requires no tint. All six original fabric-color swatches remain unchanged.
4. Before fine layers finish hydrating, construct a **complete new scene in a separate canvas**, using a static shared garment-free background composed from 34 original verified layers, then draw the fully colored garment, then the three original foreground workers **in correct order**.
5. Only after all necessary pixels exist, synchronously swap the new scene canvas for the existing complete preview. When fine detail layers are ready, synchronously remove the preview and show one already-complete cropped garment canvas in the original stage position, with separate paper/worker layers on top.
6. For a garment or color change **after hydration**, generate only one cropped garment canvas and replace the previous complete garment in a single synchronous update. Prepare the uploaded-artwork placement before the reveal, not afterward.
7. Every asynchronous attempt has a generation token. A stale completion never overwrites a newer selection. A decode failure leaves the **previous fully rendered garment** visible and announces actionable feedback; it cannot produce a half-tinted garment.

There is **no 24-image color catalog, added GSAP/Lottie runtime, artificial delay, double-garment crossfade or animation dependency**. The only newly packaged asset group consists of **three responsive shared garment-free background WebPs** (768/1536/2560) requested only when a user switches garment/color before background hydration finishes. All original **43 master source PNGs, 129 trimmed layer variants, 12 assembled previews, source hashes, multi-angle designs and the approved Upload Artwork SVG/microanimations** remain unchanged.

## 3. Recordings and browser screenshots

All screenshots and recordings are real Chromium browser output from the exact same 1440×900 worktable test viewport, not generated illustrations. The two videos each document the same selection sequence: Regular Tee → select green → switch Hoodie → switch Drop Shoulder, with a short hold on each completed state.

- [BEFORE recording — CSS garment tint and mask pipeline](performance-evidence/atomic-color/before-old-css-tint.webm)
- [AFTER recording — complete atomic-tinted garment](performance-evidence/atomic-color/after-atomic-composite.webm)
- [Before/after completed **green Hoodie** side-by-side](performance-evidence/atomic-color/before-after-green-hoodie.webp)
- [Before/after persistent **selected red paint pot glow**, pointer exited](performance-evidence/atomic-color/before-after-selected-pot-glow.webp)
- [Complete green Regular Tee](performance-evidence/atomic-color/green-regular.webp)
- [Complete green Hoodie](performance-evidence/atomic-color/green-hoodie.webp)
- [Green Hoodie composited during forced slow hydration](performance-evidence/atomic-color/green-hoodie-during-hydration.webp)
- [Persistent red selected-pot glow after pointer exit](performance-evidence/atomic-color/selected-red-pot-after-exit.webp)
- [Full machine-readable automated QA report](performance-evidence/atomic-color/atomic-visual-qa-report.json)

The legacy recording demonstrates the actual prior implementation's selection sequence; **the white-flash defect is reported on the owner's physical iPad**, not claimed to be reproduced in every Linux Chromium video. The new rendering contract is verified by browser state observations and by testing all colorized canvas pixels before the corresponding garment becomes visible.

## 4. Verification evidence

- **83/83 source tests**: registered artwork, verified archive, original Upload SVG, selected glow visual filter equality, 4×6 runtime compositor source contract, no pre-generated color variants.
- **302/302 automated browser assertions**: all **24 garment-color pairs** in Chromium and WebKit; green Regular Tee → green Hoodie first visible completed canvas is green; rapid last-writer-wins; forced slow hydration, foreground worktable layering, selected glow after pointer exit on desktop/834px tablet/390px mobile; after-change local image upload, resize/reset/removal; no initial/garment overflow or JavaScript errors.
- Original general browser behavior: passing, including original responsive and native upload checks.
- Original delayed first-frame, early-upload and worker-image failure injection: passing; a failed foreground worker keeps the original complete preview.
- Previous physical-button hover/selected/accessibility tests: **102/102 passing** with the new persistent glow contract.
- Previous persistent-selection and reduced-motion regression test: independently rerun, including all six pots, mouse/pointer exit, keyboard, rail changes, touch and hydration.
- Before/new **green Hoodie** comparison (same view): mean absolute RGB difference **0.535/255** over the central garment region, and **0.254/255** outside it (the outside area also contains deliberately changed selected highlights). The previous fabric texture and newly tinted fabric remain visually consistent.

### First usable scene — controlled paired cold-cache browser measurements

Headless Chromium on the same Linux runner; simulated 70ms latency, one run per profile. These are **not physical iPad measurements**, nor a statistically significant performance guarantee.

| Profile | Before first usable scene | After first usable scene | Before / after image transfer |
|---|---:|---:|---:|
| Mobile 390px, 4 Mbps | 2.382s | 2.245s | 347,790 B / 283,792 B |
| Desktop 1440px, 10 Mbps | 1.742s | 1.560s | 812,644 B / 771,756 B |

The first frame still uses the existing preassembled, responsive WebP scene. The shared garment-free plate is **not loaded at first paint**, preserving the existing progressive pipeline; it is only needed for an early switch.

## 5. Independent visual QA and owner acceptance

**Creative/Rendering QA verdict: Conditional PASS for owner review.** The revised selection maintains the approved lift and hover, but now retains the exact hover-style glow after exit. Colored garment changes do not reveal a white intermediate garment: no asynchronous mask update remains at the visibility handoff. The paint-tray front panel stays in front of its pots; the vector upload illustration, its hover inversion and idle float are unchanged.

**Physical 2021 iPad Safari/Chrome remain owner visual acceptance gates.** Do not merge #59–#65 and do not modify garment-color motion beyond the specified fix, the lower manual/editorial controls, Upload Artwork animation or unrelated sites. Stop after deploying to the existing Render review and request owner's visual approval.
