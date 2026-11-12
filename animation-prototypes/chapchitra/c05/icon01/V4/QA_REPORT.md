# CHAPCHITRA C05 Icon 01 — V4 production and visual QA

**Status:** Isolated review candidate. User approval pending; no website integration.

## Preservation

- User original SVG preserved byte-for-byte. SHA-256: `fa15c66ca47e6f794a0d516b04bfd94de42500b87cde00f5ce07b3fd78e78c09`.
- Exact V3 T-shirt trajectory, timing, scale, rotation, opacity and emergence code: **AST-identical** in generator.
- Five-second choreography at 30 fps, 151 frames including hold pose.
- 15 native Lottie shape layers, 6 animated user-authored page front/back layers, no raster images, no expressions.
- All original source colors retained. New SVG already uses Gallery White `#F6F7F5` for the cat T-shirt fabric.

## Right-page flip changes

- Three opaque right-to-left turns using paired SVG face paths, around the existing diagonal center spine.
- Each front and back is a physically linked paper sheet, shown before/after crossing the edge-on 90° position.
- Original `Spine_x5F_Foreground` has a dedicated foreground copy.
- Inactive copied page fronts/backs are excluded from the animation rendering.
- The back sheet covers the stationary left page during the turn; a stationary `Left_page` mask occludes it during landing. **No opacity fades are applied to turning sheets.**
- `Black_Illustration` stays stationary and is the source of the existing T-shirt emergence.

## Export-layer discrepancy to review

The raw uploaded SVG renders inactive duplicate left-facing page backs over `Black_Illustration`, hiding the black illustration. The animation-ready derivative suppresses those inactive copies to satisfy the requested fixed black printed emergence anchor. The corrected final book illustration therefore differs from the raw exported default stack. No source art path or color was altered. This is a source-layer visibility issue, not a T-shirt choreography change.

## QA completed

- SVG structural integrity, original source checksum, Lottie JSON parsing and zipped `.lottie` manifest: **Pass**.
- Page faces have constant 100% opacity, original path geometry warped with Bezier keyframes: **Pass**.
- Fallback browser review in Chromium at desktop, mobile, iPad viewport sizes (Play/Pause/Scrub): **Pass**, no page script errors.
- Final T-shirt motion identity with V3, by code-AST comparison: **Pass**.

## Outstanding release gates

- Independent native `lottie-web` playback in Chromium: **Not yet certified**.
- WebKit/Safari native playback: **Not yet certified**.
- The 2D projected page curvature is a vector approximation of 3D paper; verify whether the sheet-crossing and landing feels sufficiently physical in the review.
- Owner creative approval: **Pending**.

Do not merge, modify other C-series animations, or proceed to Icon 02.