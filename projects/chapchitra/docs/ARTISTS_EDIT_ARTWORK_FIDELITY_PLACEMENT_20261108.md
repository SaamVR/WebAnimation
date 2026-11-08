# CHAPCHITRA — Artist's Edit Artwork Fidelity and Print Placement

**Scope:** Artist's Edit only, stacked on approved editorial panel PR #68. No merges, C01 integration untouched. Owner visual review required after deployment.

## Root-cause diagnosis

- Uploaded artwork used CSS multiply compositing, allowing dark garment pigments to multiply even opaque white pixels in JPG or PNG artwork and dull bright yellow, blue and red.
- The old A3/A4 print boxes were arbitrary chest rectangles, not proportional portrait paper references.
- The old slider supported only 50–100%, could not enlarge past the nominal area, and labeled its default 100%.
- Dragging and resizing lacked a temporary visible placement boundary and resolution guidance.

## Fix: separate image colors from garment pigments

Only the uploaded artwork's parent and image use normal source-over alpha compositing. The uploaded image also has no filter. Original garment pigment rendering and WebP layers remain unchanged. Transparent PNGs expose garment pigment through transparent pixels. Opaque white, blue, red, yellow, and other artwork colors remain independent of fabric color; no fabric fold filter is applied to artwork. Existing local PNG/JPEG/WebP acceptance, 10MB upload limit, and maximum dimension check remain.

## Relative A3/A4 geometry

Pure module src/worktable-print-placement.mjs uses the existing garment chest guide, conservatively inset to a safe drawable region. The reference labels are:

- A4: 8.27 × 11.69 in; suggested 300 PPI file 2480 × 3508 px.
- A3: 11.69 × 16.54 in; suggested 300 PPI file 3508 × 4961 px.

A3's initial visual area is approximately twice A4's (√2 linear scale). Uploaded landscape, square, portrait and other source aspect ratios are fitted within the portrait reference without stretching or cropping. Initial image position is horizontally centered with a visual collar gap. Dragging can move toward lower chest, limited to the inner garment guide.

**Physical garment measurements have not been provided.** The three- and six-inch collar distances are relative visual design objectives, not exact, measured claims.

## Signed enlargement and manipulation

- Slider nominal range −50% to +100%; **0% equals the fitted A3/A4 reference.**
- Negative adjustments shrink; positive adjustments enlarge around the image center.
- Actual positive maximum is lowered when the selected garment's safe geometry cannot fit a larger image.
- Clamped dragging, pointer capture, touch and keyboard controls share the same geometry model.
- Switching garments and A3/A4 recomputes safe bounds and preserves relative placement where possible.
- Reset returns to the collar reference at 0%; removing artwork clears all feedback.
- A thin outline appears while uploaded artwork is selected, dragged, resized or keyboard-focused; it disappears after the interaction. No persistent print-area frame or expensive image filter.
- A polite status communicates a first collision with the placement boundary, without repeated drag-frame announcements.

## Artwork resolution guidance

Under the primary Upload Artwork button:

**Recommended artwork resolution (300 PPI)**

**A4:** 2480 × 3508 px (8.27 × 11.69 in)
**A3:** 3508 × 4961 px (11.69 × 16.54 in)

"These are recommended dimensions for high-quality printing. Other image sizes are accepted for preview. Final print quality depends on actual print dimensions and production requirements."

Actual upload pixel dimensions and a low-resolution advisory are informational; otherwise accepted uploads are never blocked.

## Genuine before/after screenshots and recordings

These were captured in the browser from the original PR #68 checkout and revised working copy using the same uploaded JPG test source with opaque white, yellow, blue and red quadrants over a black shirt. No mockups or synthetic screenshots are substituted.

- [Desktop before/after original colors](performance-evidence/artwork-placement-20261108/before-after-artwork-fidelity-desktop.webp)
- [Mobile before/after original colors](performance-evidence/artwork-placement-20261108/before-after-artwork-fidelity-mobile.webp)
- [A3 default footprint comparison](performance-evidence/artwork-placement-20261108/before-after-A3-placement.webp)
- [Signed resize and temporary outline](performance-evidence/artwork-placement-20261108/before-after-signed-resize.webp)
- [Original desktop interaction recording](performance-evidence/artwork-placement-20261108/before-1440-workflow.webm)
- [Corrected desktop interaction recording](performance-evidence/artwork-placement-20261108/after-1440-workflow.webm)
- [Original mobile interaction recording](performance-evidence/artwork-placement-20261108/before-390-workflow.webm)
- [Corrected mobile interaction recording](performance-evidence/artwork-placement-20261108/after-390-workflow.webm)

## QA

Unit tests verify the four original garment guides, A3/A4 area relationship, aspect preservation for landscape/portrait/square images, safe bounds and dynamic signed slider, collar-starting position, edge clamping, and nonblocking resolution guidance.

Real Chrome browser tests verify 24 garment/color selections with source-white/yellow/blue/red pixels preserved, opaque JPEG and transparent PNG backgrounds, aspect and print references, drag, keyboard placement, reset/removal and responsive layout. A separate Chrome CDP test simulates real touch events at 834px and 390px, verifying capture, movement, release and boundary cleanup.

Screenshot color comparisons allow ordinary browser resampling, JPEG compression and color management differences. There is no assertion that the preview simulates physical ink transfer or that actual iPad hardware was tested.

- [Artwork browser QA](performance-evidence/artwork-placement-20261108/artwork-browser-qa.json)
- [Native touch-gesture QA](performance-evidence/artwork-placement-20261108/touch-drag-qa.json)
- [Inherited regression summary](performance-evidence/artwork-placement-20261108/regression-summary.json)

## Paired first-frame performance

Same Windows runner and Chrome executable, simulated 70ms RTT, cold-cache, one run per profile:

| Profile | Previous first usable frame | Corrected first frame | Worktable image traffic |
|---|---:|---:|---|
| Mobile 390px / 4Mbps | 2.447s | 2.546s (+99ms) | 40 requests, 283,792 bytes unchanged |
| Desktop 1440px / 10Mbps | 1.661s | 1.630s (−31ms) | 39 requests, 771,756 bytes unchanged |

No new garment image variants, duplicate full-canvas artwork, GSAP or Lottie runtime. These are single local-network simulations, not guaranteed iPad timings. [Raw performance results](performance-evidence/artwork-placement-20261108/first-frame-comparison.json).

## Preservation and release

The approved rich fabric pigment renderer, atomic garment switching, selected artwork elevation/glow, illustrated upload SVG, original PNG/WebP assets, editorial panel design outside its requested artwork tools, C01 Connected Service Benefits and all other website pages must remain byte-identical. Only the existing Render review service may be advanced with a guarded, C01-preserving update.

**Independent Creative Director verdict:** Conditional PASS for owner visual review after the exact live deployment is tested. Physical iPad validation remains pending. All PRs remain draft and unmerged. Stop after providing the clickable review URL.
