# CHAPCHITRA C05 Icon 02 — Rooted in Bengal

**Creative status: standalone V1 prototype, awaiting owner's approval.**

This folder contains a genuine vector-based Lottie derived from the supplied, unchanged 512 × 512 Illustrator SVG. No illustration paths, palette colors, motifs or outline proportions have been redesigned.

**Files:** `More_than_a_tshirt_Icon_2_ORIGINAL.svg` (original master), `CHAPCHITRA_C05_Icon02_Rooted_in_Bengal_V1.json` (Lottie), `C05_Icon02_produce.py` (editable vector generator), `C05_VECTOR_PARSER_REFERENCE.py` (reusable path parser), `QA_REPORT.md`.

The full standalone review ZIP, including compressed `.lottie`, animation GIF, MP4, self-contained interactive HTML, storyboard, asset manifest and QA, is supplied in the C05 Icon 02 animation-production chat.

## Motion

The circle is stationary, followed by staggered reveals of the named source groups: flora/bird, rice, arch, lotus, fish, boat, rickshaw, tiger, ornamental leaves, and the border. Individual slide/unfold/sway motions are restrained. All objects return to their exact source paths and original positions at the final frame.

Runtime: 30 fps, 115 frames, approximately 3.83 seconds. Production plays once; loop is available only in the review page. Reduced-motion displays the source composition.

## Build

In a Python environment with `lxml`, `Pillow`, and `cairosvg` installed:

```sh
python C05_Icon02_produce.py
```

The generator writes JSON and `.lottie` into this directory. If ffmpeg is installed, it also writes an MP4. The generated review HTML loads official lottie-web from a CDN when available, and explicitly labels GIF fallback when unavailable.

## QA and release gate

- Master SVG SHA256: `a97ce0b239904b0bf41da45b40e2018dfb8bcb4a192e688aad7c568d929db5ab`.
- Final frame of independent SVG reference matches master SVG pixel-for-pixel at 512px.
- Native Lottie renderer compatibility remains subject to browser QA, particularly Safari/WebKit.
- No website integration or C05 Icon 03 work permitted without creative approval.

**Branch and file placement are isolated:** no changes to any existing CHAPCHITRA page, C01, C02, C05 Icon 01, or other website assets.
