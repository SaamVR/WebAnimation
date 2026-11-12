# CHAPCHITRA C05 Icon 01 — V5 selective page speed

**Creative status: work in progress. Do not merge or integrate into CHAPCHITRA website.**

The user-supplied master SVG has two stationary left-page states and three right turning-sheet pairs. This V5 generation preserves exactly the approved V4 T-shirt transform/opacity and mask keyframes, but compresses the three page-turn windows from nominal frames 0–61 to frames 0–41 (approximately 1.5×), leaving the rest of the 5-second/30-fps timeline at 1×.

- V5 windows: (0–13), (13–27), (25–41) at 30fps.
- T-shirt still emerges at frame 60 (2.0s); the transition does not retime it.
- `Left_Page_Initial` remains stationary until last turn; `Left_Page_Final` is shown at the natural landing, not faded.
- User-exported third sheet back has a different silhouette from `Left_Page_Final`. Therefore its **animated back** is derived from exact `Left_Page_Final` artwork to ensure identical landing. The original master is left untouched.
- Both faces remain 100% opaque. Lottie renders vector shape morphs instead of raster frames.
- Static final matches its intended final SVG composition at 640px with 0 changed pixels (reference raster).

## Source files in this isolated V5 folder

- `C05_Icon01_V5_produce.py`: targeted generator, reads the already-committed sibling `V4` review HTML for exact T-shirt baseline and `V3` SVG parsing infrastructure.
- `More_than_a_tshirt_Icon_1_named_SVG_TEXT.svg`: text-form copy of the new Illustrator SVG; the exact byte-level original (SHA-256 `e50b8029141a31da005bddd73b73e1ceb30ff467a871a3e5a024d0ad86e86560`) is inside the separate ZIP artifact supplied for creative review. GitHub's UTF-8 contents API may normalize line endings.

### Regeneration

Run `python C05_Icon01_V5_produce.py` from this folder. Requires Pillow, lxml, CairoSVG and ffmpeg (for MP4). It recreates JSON, .lottie, GIF, MP4, storyboard and isolated HTML; the complete review package additionally bundles V4 baseline data and V3 parser to run outside the GitHub checkout.

**QA:** Structural native vector Lottie validation passed; Chromium SVG-reference desktop/tablet/mobile controls passed. **Native lottie-web playback and WebKit/Safari remain unverified for V5**. Do not claim production browser certification. Owner creative approval pending.

**No C02, other C05 icons or website files were changed.**