# CHAPCHITRA — Artist's Edit uploaded vector control integration

**Scope:** Worktable upload icon only, stacked on the latest unmerged Artist's Edit development source (PR #63, `1463011d1c83010c950f9308b5582f921ee6d415`). PR #59–#63 must remain draft/unmerged, and the new refinement must remain a draft until owner acceptance. Existing review service: `chapchitra-webanimation.onrender.com`.

## Source inspection (the actual owner archive)

The uploaded `UPLOAD.rar` (RAR v5) contains exactly one Illustrator-created `UPLOAD.svg`, **5,783 original bytes**, SHA-256 `3ea32afbf3a1ef9d6f7ff08b5e14ba871e8bd81d54846edd672beb30cbfba1ab`. The unmodified SVG is retained at `src/assets/worktable-upload/UPLOAD.svg`.

- Original `viewBox="0 0 512 512"`; SVG art bounding pixels approximately `x=38..462, y=110..411` when rendered at 512².
- Original groups (inspected, not assumed): `MOUNTAINS_SUN`, `FRAME_LINES`, `CIRCLE_FOR_PLUS`, `PLUS`. Total 15 path nodes, one circle and one ellipse.
- Original paints: Press Green-like `#283D2D` and warm offwhite `#F6F6F4`, retained exactly at rest. The requested canonical Press Green `#293D2D` and Gallery White `#F6F7F5` appear **only on hover** in the background ellipse and the actual plus path. Original white ring, mountain strokes, corner frame, notebook title and paper are not recolored.
- The SVG artwork's source paths and original source colors are not changed. Its rendering `viewBox="32 104 440 327"` crops the export's transparent margins to fit the existing artwork crop **without changing geometry/path data**; `preserveAspectRatio="xMidYMid meet"` retains vector proportions.

## Stage integration, duplicate prevention and performance

The old transparent PNG target was `Upload image notebook/Upload_image_notebook_upload_button_4.png` at registered stageBox `[1625.6,382.976,275.456,204.8]` on the 2048×1152 stage. Its invisible semantic button and 7px alpha-derived hitbox expansion remain **unchanged**. The SVG is mounted as a single inline vector in that same stageBox, using the previously approved silhouette-shadow and 3px hover-lift CSS. The unchanged notebook image, title layers, desk, paint tray and garment illustrations retain their original coordinates and alpha masks.

The optimized first-frame assembled WebPs formerly contained the raster target. To avoid duplication and a visible icon swap, all **12 responsive garment previews** were regenerated from the *same original checksum-verified layers* **excluding only** that raster icon. They use unique `-svg3ea32afb` URLs to defeat stale CDN cache. All **43 original master PNG entries**, the full source stack, the **129 cropped WebP variants**, source checksums and 4 garment types are preserved. The old target PNG does not create an `<img>` or a network request at runtime, while the inline SVG is visible from first-stage ready and through deferred progressive hydration.

Regenerated 12 preview variants: **3,523,114 bytes** vs previous **3,574,158 bytes**, down **51,044 bytes**. Entire three-width WebP delivery: **5,772,070 bytes** vs **5,823,114 bytes** before. The SVG is embedded in a tiny imported JavaScript module, rather than fetching a Lottie/GSAP runtime or external animation.

## Motion and interactions

- **Idle:** icon-only CSS `translateY(-1.6px)`, gentle 4.2-second wave with a substantial resting interval, no swing/bounce. An IntersectionObserver plus `document.visibilitychange` pause the animation when the icon is offscreen or the document is hidden. Reduced-motion disables the idle float and transform animations.
- **Hover:** existing approved parent 3px rise and alpha-following shadow remain; only the original circle background and plus path crossfade `#283D2D/#F6F6F4` → `#F6F7F5/#293D2D` in 200ms. Idle float pauses during hover/focus; the mountain/frame and white ring remain original.
- **Click:** 1.5px SVG micro-acknowledgment is triggered on pointerdown/click; `file.click()` occurs synchronously in the same native event handler, with no fake loading wait. The acknowledgement clears after ~180ms. Cancel leaves the upload unset; successful PNG/JPEG/WebP upload uses all existing local image-preview, positioning, resizing, reset/removal logic.
- **Accessibility:** original native button hitbox, keyboard Enter, focus-visible shadow, touch interaction, minimum mobile stage target and lower manual-upload button remain supported. The notebook background is still noninteractive.

## QA and visual evidence

- [Actual before vs after notebook target screenshot](performance-evidence/upload-svg/before-after-notebook-target.webp) — screenshot comparison of old raster (left) and owner SVG (right).
- [SVG idle vs hover inverted colors](performance-evidence/upload-svg/idle-versus-hover-inversion.webp) — resting green-circle/white-plus (left), Gallery-White circle/Press-Green-plus (right).
- [Full illustrated worktable first-frame SVG capture](performance-evidence/upload-svg/svg-first-frame-full-stage.webp).
- [Mobile worktable capture](performance-evidence/upload-svg/svg-mobile-worktable.webp).
- [Machine-readable browser QA report](performance-evidence/upload-svg/upload-svg-qa-local.json).
- **79/79** Node/source integrity tests pass (including original SVG SHA and all old source archive checks).
- **95/95** dedicated Chromium/WebKit desktop/tablet/mobile checks pass: original vector groups/colors, alpha hitbox, original 3px hover, exact inversion and non-recolored frame, 4.2s quiet float, offscreen/hidden-tab pause, reduced motion, 180ms acknowledgment, native chooser, real local PNG preview, resize/reset/remove, touch widths 834/390/320, and selected glow/lift **byte-identical** to the approved pre-SVG source in all four groups.
- **102/102** physical-control browser regression checks pass; **168/168** selected elevation/manual-switch/deferred-hydration checks pass; original full-browser regression passes all **35/35** assertions, and existing early-image failure recovery reports `ok: true`.
- Paired 70ms latency Chromium benchmark, cold cache and a single run per configuration: **390px/4Mbps first useful stage 2.575s before vs 2.479s after**; **1440px/10Mbps 2.126s before vs 2.191s after**. Image bytes: mobile **355,469 → 347,790**; desktop **830,232 → 812,644**. A single profile run cannot prove real iPad timings or strictly zero CPU/GPU impact; no meaningful first-screen load regression was observed.
- 1440px stage screenshot pixel-difference check, excluding the original icon crop: **mean absolute RGB change 0.052/255** outside the icon region, consistent with surrounding paper/notebook/desk remaining unchanged except negligible WebP re-encode differences.
- The unmodified baseline and candidate are built and browser-tested independently. Independent GitHub CI must pass before advancing the existing Render review branch. A physical iPad Safari/Chrome acceptance remains the owner's review gate.

## Independent creative and performance QA

**Conditional PASS for candidate visual review only** provided browser and Render gates pass. The original scene geometry remains stable; the SVG paths are vector-sharp at all viewport widths and the circle inversion is restrained. No garment/color switching changes, no lower editorial/manual-control redesign, no PR merges. Stop after existing Render review deployment and owner approval request.
