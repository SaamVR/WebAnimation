# CHAPCHITRA C05 — Icon 01 V6 (updated page backs; opacity-free T-shirt)

**Creative status: Work in progress. Do not merge this folder or integrate into the CHAPCHITRA website.**

This isolated continuation of V5 preserves the approved 1.5x right-page timing and the full T-shirt position, scale, rotation, easing and mask trajectories.

## Targeted updates
- Use the exact uploaded source `More_than_a_tshirt_Icon_1_PageBacks_Updated_ORIGINAL.svg`.
- Back 01 and Back 02 use the matching initial-page artwork from the uploaded SVG. Back 03 retains the exact final landing artwork, avoiding a geometric jump.
- Remove only the T-shirt floating layer's animated opacity. It is a 100%-opacity vector layer with an in-point at frame 60.
- A progressive geometric mask temporarily separates the *printed* T-shirt from the floating garment; that printed artwork returns by the final frame without alpha flashes.
- 512×512 composition, 151 frames at 30fps.

## Source files
- `C05_Icon01_V6_produce.py`: editable V6 producer based on the V5 pipeline
- `More_than_a_tshirt_Icon_1_PageBacks_Updated_ORIGINAL.svg`: original SVG, preserved byte-for-byte
- `QA_REPORT.md`: local validation evidence and remaining native runtime gate

For full reproducibility, unpack the V6 review ZIP from the production conversation into one folder and run `python C05_Icon01_V6_produce.py` with `lxml`, `Pillow`, `cairosvg`, and `ffmpeg`. The ZIP contains the three inherited V4/V3 baseline helper files required by that generator; they are not committed again here.

The updated vector Lottie JSON and .lottie are in the downloadable review package. The latest downloaded package, not any older V5 export, is the approval candidate.

**QA:** final source composition matches at 640px with zero changed pixels. Chromium SVG reference controls/12 frame seeks passed. Native Lottie-web in Chromium and Safari/WebKit remains unverified in this session. No production release is authorized.

Do not start Icon 02 until creative approval.
