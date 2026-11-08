# CHAPCHITRA — A3/A4 Print Guide and On-Garment Three-Tool Editor

**Repository:** SaamVR/WebAnimation.
**Approved input:** draft PR #69, SHA 6ba7fbf93478301f43171231374230d1f7483a4d.
**Scope:** ONLY the Artist's Edit print preview and its supporting tests/evidence.
**Deployment:** Existing CHAPCHITRA Render review service only. Never merge draft PRs.

## Root-cause correction

The prior selected boundary was attached to the uploaded image. Its rectangular
geometry changed for source portrait, square, landscape and other aspect
ratios, so it could not act as a constant paper/print-area reference.

The new worktable uses two **independent** layers:

1. A noninteractive, independent A3 or A4 portrait reference computed from the
   existing garment chest guide. The paper guide is never transformed by
   image upload, image aspect ratio, resizing, dragging or rotating.
   A3 nominal area is about twice A4. It is drawn as a neutral gray
   line at approximately 52% opacity, with **no fill or permanent overlay**.
   Paper selection briefly shows the frame even with no uploaded image.
   While the image is selected the frame stays visible; it fades after
   editing ends.
2. A transformed uploaded image, which maintains its source pixels,
   source image aspect, color, transparent PNG alpha and original WebP
   source-over rendering. A separate axis-aligned selection boundary is only
   visible in **Resize** mode, around the **actual rotated image bounds**.

A3/A4 dimensions are only relative physical-paper references.
No manufacturer-supplied garment size or verified inch-to-pixel conversion
exists. The relative collar gap and safe printable chest zone remain grounded
in the original registered garment geometry.

## One shared image transform

The approved signed slider and the floating editor write the same
transformation object: horizontal/vertical offset, signed adjustment,
and clockwise rotation in 90-degree increments. No second independent
resizing system is created.

- **Auto-fit:** at 0%, complete source image fits proportionally inside
  the selected portrait paper frame, regardless of its aspect ratio.
  The image is centered on the nominal print area; no cropping or stretching.
- **Move:** click or tap uploaded image to select and reveal tools; the Move
  tool activates pointer-captured direct dragging and native keyboard
  arrow/Shift-arrow repositioning. All transformations remain inside the
  existing garment-safe region.
- **Resize:** four restrained draggable corner controls around the *actual
  image bounding box* scale proportionally around the center. Hit targets
  are 44px, while the visible circular dots remain only 11px. The
  signed slider updates as the corners move. Enlargement can exceed the
  nominal A3/A4 footprint until a genuine garment-safe limit.
- **Rotate:** click Rotate to turn exactly +90, +180, +270, 0 degrees
  clockwise, keeping the image center fixed. The geometry calculates
  the actual 90-degree axis-aligned bounding box and clamps any
  oversized rotation inside the garment.
- **Dismiss:** clicking away closes the three tools without removing
  the uploaded image. The nominal guide fades after exit.
- **Reset:** sets offsets to zero, restores the selected paper's nominal
  centered fit, signed scale 0%, clockwise rotation 0 degrees.
- **Responsive:** the toolbar stays near but outside the image where
  space permits, and is clamped within the actual stage dimensions
  on tablet/mobile rather than overflowing its viewport.
- **Keyboard/accessibility:** native semantic toolbar, named buttons,
  aria-pressed mode state, visible focus, keyboard Move and corner resize,
  small circular handles with independent 44px hit areas. No extra
  animation library; reduced-motion removes optional transitions.

The uploaded source image's fitted geometry is installed before its
newly decoded pixels are displayed, preventing a transient image/layout
aspect mismatch during rapid successive uploads.

## Screenshot comparisons

All pictures below are direct browser screenshots of the approved original
illustrated worktable, without generated/recreated artwork.

- [A4 vs A3 guide, **no upload**](performance-evidence/print-guides-tools/A4-vs-A3-before-upload.webp)
- [A4 vs A3 guide, **with source-fitted artwork**](performance-evidence/print-guides-tools/A4-vs-A3-with-artwork.webp)
- [Portrait auto-fit](performance-evidence/print-guides-tools/auto-fit-portrait.webp)
- [Landscape auto-fit](performance-evidence/print-guides-tools/auto-fit-landscape.webp)
- [Square auto-fit](performance-evidence/print-guides-tools/auto-fit-square.webp)
- [Unusually tall auto-fit](performance-evidence/print-guides-tools/auto-fit-tall.webp)
- [Selected Move tool](performance-evidence/print-guides-tools/toolbar-move-selected.webp)
- [Resize tool and four corner handles](performance-evidence/print-guides-tools/toolbar-resize-four-handles.webp)
- [Rotation 90 degrees](performance-evidence/print-guides-tools/rotation-90.webp)
- [Rotation 180 degrees](performance-evidence/print-guides-tools/rotation-180.webp)
- [Rotation 270 degrees](performance-evidence/print-guides-tools/rotation-270.webp)
- [Rotation 360 degrees / original 0-degree pose](performance-evidence/print-guides-tools/rotation-360.webp)
- [Tablet touch editor](performance-evidence/print-guides-tools/touch-editor-834.webp)
- [Mobile touch editor](performance-evidence/print-guides-tools/touch-editor-390.webp)

## Actual browser recordings

The desktop recording demonstrates A4/A3 selection before uploading,
source fitting of multiple image ratios, Move selection, all four
corner-resize gestures, full 360-degree rotation, signed-size slider,
reset, garment switch, and click-outside dismissal.

- [Desktop Chromium — complete tool workflow](performance-evidence/print-guides-tools/chromium-desktop-tool-workflow.webm)
- [Tablet WebKit — full tool workflow](performance-evidence/print-guides-tools/webkit-tablet-tool-workflow.webm)
- [Mobile Chromium — full tool workflow](performance-evidence/print-guides-tools/chromium-mobile-tool-workflow.webm)

Native touch actions are separately reproduced using real Chrome touch
pointer events at 834px and 390px; these tests are not recordings of
a physical iPad. The supplied artwork is original synthetic pixel
test input only; the studio composition remains the owner's PNG/SVG.

## Tests / performance

- Node geometry tests cover all four registered garment chest regions,
  A3/A4 area relation, independent guide placement across source ratios
  and rotations, complete auto-fit, all four clockwise rotation states,
  source-image aspect, signed limits and absolute garment safety.
- Browser tests verify A3/A4 before/after upload, portrait/landscape/square/
  unusually tall imagery, select/three-tool visibility, four independent
  proportional corner drags, 90/180/270/360 rotation, slider sync,
  keyboard reposition, reset, click-outside dismissal, responsive toolbar,
  and original source-over blending.
- Touch tests drive Chrome touchStart/touchMove/touchEnd through a tablet
  and a mobile viewport; not mouse simulations mislabeled as touch.
- Inherited regressions independently protect original animated SVG,
  garment/color atomic switching, alpha pigment, physical hover,
  selected permanent glow, editorial panel, delayed hydration and
  failure fallback.

See [browser test report](performance-evidence/print-guides-tools/browser-qa.json),
[touch test report](performance-evidence/print-guides-tools/touch-qa.json),
[combined regression ledger](performance-evidence/print-guides-tools/regression-summary.json),
and [paired benchmark](performance-evidence/print-guides-tools/performance-comparison.json).

The verified QA ledger records **112/112 Node tests**, **137/137 new-browser
tool tests**, **14/14 real Chrome touch gestures**, **302/302 atomic garment/color
checks**, **735/735 pigment/alpha checks**, **102/102 original physical-button
checks**, **95/95 approved Upload Artwork SVG checks**, **768/768 editorial
controls**, **35/35 general worktable checks**, and **PASS** for delayed-image
hydration and failure recovery. A focused WebKit settled-state test verified all
six paint pots at their exact approved −5.5px lifts. One long-running legacy
WebKit test sampled the yellow pot at −5.16px mid-transition under concurrent
load; the CSS and choreography were not modified. That intermediate sample
is disclosed rather than erased.

The paired cold-cache test runs the original approved print-placement
implementation alongside this candidate using the **same Chromium Linux
runner**, 70ms RTT, simulated mobile 390px/4Mbps and desktop
1440px/10Mbps:

| Profile | Original first display | Print-guide candidate | Image network |
| --- | ---: | ---: | --- |
| Mobile 390px/4Mbps | 2.653s | 2.768s (+115ms) | 40 image requests, 283,792 bytes unchanged |
| Desktop 1440px/10Mbps | 1.889s | 1.811s (−78ms) | 39 image requests, 771,756 bytes unchanged |

Both remain below the established 3-second first-scene target; image
bytes and counts are exactly unchanged. These are single-run simulated
results, **not** physical iPad or GPU-memory measurements.

All original source PNG/SVG, WebP assets, garment pigment colorizer and
atomic garment switching remain untouched. Independently approved C01 and
C08 are **not part of this source patch**.

## Independent Creative Director gate

**Conditional PASS for owner visual review only** after live Render
deployment and source-pinned public-browser validation. Original
CHAPCHITRA artwork and pigment remain intact, and controls use
minimal restrained Gallery White/Press Green styling. The relative print
guides should not be mistaken for manufacturer-calibrated production
boundaries. The actual iPad owner must visually approve the scale,
tool placement and gesture comfort. No draft PR may be merged.

STOP after publishing the verified existing Render preview and requesting
owner visual approval. Do not start unrelated implementation.
