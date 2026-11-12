# CHAPCHITRA C05 Icon 03 — GSAP Gate A Physical Motion Proof

**Creative status:** Gate A ready for owner review. **Not an approved production animation.**
**Branch:** `feature/chapchitra-c05-icon03-hand-block-printing-20261112`
**Scope:** Only Icon 03 motion proof. Icons 01, 02, 04 and the main CHAPCHITRA website are unchanged.

## Files
- `index.html`: interactive Play / Pause / Replay / Scrub review. Loads local `gsap.min.js`.
- `standalone-self-contained.html`: same review with the official GSAP 3.15.1 library embedded inline; useful for browser previews of a single GitHub file.
- `gate-a-motion.js`: editable grouped-SVG GSAP timeline controller.
- `More_than_a_tshirt_Icon_3_ORIGINAL.svg`: original user-supplied named SVG, unchanged.
- `gsap.min.js`: GSAP core bundled from the official GreenSock repository, version 3.15.1.

## Observations from user-supplied printing reference
The reference starts with the plain reverse face **already touching fabric**, uses a short pressure hold, lifts one edge and then translates the block upwards. The impression becomes visible when uncovered. Gate A deliberately reproduces only this contact-to-separation section.

## Measured geometry (512×512 SVG)
- Floral orientation `Wood_block`: x=73.70, y=99.29, width=257.94, height=223.11.
- Reversed orientation `Wood_x5F_Block_x5F_Flipped`: x=170.78, y=194.94, width=257.93, height=224.26.
- `Print_over_cloth`: x=196.00, y=241.50, width=215.58, height=152.75.
- Hinge: x=422, y=410, the rightmost contact edge of the reversed block. The other edge rotates upward first.
- The two block drawings differ by approximately (+97.08, +95.65) in SVG-space bounding-box origin, which must be normalized in Gate B. Gate A uses the reverse illustration in its supplied contact position.

## Gate A timeline (2.35s)
- 0.00–0.34s: contact and pressure hold; no bounce.
- 0.34–0.80s: left edge lifts around right contact axis to 11.5°.
- 0.80–1.55s: rigid group lifts; spatial clipping progressively uncovers existing floral ink paths.
- 1.55–2.06s: complete separation and final uncovering.
- 2.06–2.35s: final review hold.

The floral face is hidden in Gate A by design; the reverse block and fabric are the only moving/printing objects. `Print_over_cloth` remains 100% opaque and becomes visible only through an SVG clip rectangle. No added shadows, hands, generated art, or 3D effects.

## QA completed
- Original 512x512 SVG path art preserved; SHA-256 of original file: `e22c5547c398bc44ad5049273a16037e4de79166e38c89c55c9a706951bfdd37`.
- Offline Chromium SVG-motion-reference rendering: desktop, mobile, iPad-size, no JS page errors; 9 checkpoint captures and continuous 30fps GIF/MP4.
- Reduced-motion initial state: completed printed composition, no autoplay.
- The GitHub file includes a **real GSAP timeline**, and the official GSAP library is included on this branch. Native GSAP runtime on public hosting and actual WebKit have **not yet passed independent remote browser QA**.
- Vercel separate preview creation failed: team reached API deployment quota (402).
- Render separate static-site creation failed: Hobby workspace reached 25-service limit.
- Local HTML opens as a standalone preview; when GSAP is unavailable it explicitly labels the deterministic SVG-reference fallback.

**Approval gate:** Do not add the floral-face start/return until the owner approves Gate A. Do not merge or integrate to the website.
