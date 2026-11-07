# CHAPCHITRA — Artist's Edit Worktable Asset / Placement Handoff

STATUS: PRE-ASSET ARCHITECTURE ONLY. NOT RENDERED. Awaiting the owner's transparent SVG/PNG ZIP.

Repository: SaamVR/WebAnimation | Route: /artists-edit/ | Stable Render review: https://chapchitra-webanimation.onrender.com/

## Reviewed art and exact dimensions

Five PNG uploads were inspected: one clean desk background and FOUR finished compositions. Each actual file is **4000 x 2250 RGBA** (16:9); the requested stage design coordinate system is **2048 x 1152** (also 16:9). Pixel-to-stage scale is exactly **0.512**. Use a single SVG artboard with viewBox 0 0 2048 1152 and preserveAspectRatio xMidYMid meet, with no cropping of the background and no independent object positions calculated with breakpoint percentages.

| Reference filename | Role | SHA-256 |
| --- | --- | --- |
| Artist-edit-backdrop-1(2).png | Untouched base/background | 92285314a0f9c8b54344ec0e39f7ef7d21bdf91fc091d87374d537c3b6be923f |
| Composition-1-regular-tshirt.png | Approved placement reference: Regular Tee | 2e816f49c5fba252b1337d581075ed61cfb264272042af94fa005a3bb2f05b5d |
| Composition-2-drop-shoulder.png | Approved placement reference: Drop Shoulder | e2787b0614a8648993a7256b582173ac20fa99f3661d0cf04d43e3f78f4c6743 |
| Composition-3-full-sleeve.png | Approved placement reference: Full Sleeve | 0489a88f1a5e34bca6101fc44d9c4660bdc185d6d0893ed0b93ac23c15e7b346 |
| Composition-4-hoodie.png | Approved placement reference: Hoodie | 9846bf9a0f3ad8d08b4140d6f668073107ea178145e5db5d50a4879a0f407bea |

All five originals exist as uploads in this conversation. **These originals have NOT been committed to the repository**. The base is supplied, but its actual binary still must be transferred into the app during the asset handoff. Do not pass off a generated recreation, screenshot crop, or substitute SVG as the supplied artwork.

The base already contains the plant/books, green desk lamp, paintbrush jar, washi tape, scissors, pencil, diagonal ruler, sample swatch card, green ink jar/lid, woodgrain and desk stains. Never redraw those static objects or duplicate them as overlays.

## Complete composition reading

All four references share these desk zones:
- Top: one draped size rope, a Size paper label and FIVE separate S, M, L, XL, XXL paper tags.
- Left: Garment Style pinned paper sign, olive board and FOUR independent garment cards.
- Bottom-left: T-Shirt Colors taped label, timber tray, SIX independent paint pots, top row Black/White/Red and bottom row Yellow/Blue/Green.
- Right: spiral-bound Upload Your Art sketchbook with upload action in the paper.
- Bottom-right: Print Size taped paper sign, terracotta board and TWO independent A3/A4 cards.
- Center: one large white garment, differing between four references; three miniature workers overlay the fabric: a botanical art holder at left, roller-on-ladder worker at right, and hem-finishing worker near bottom.

IMPORTANT: Painter clothing, tools, ladder, and worker/fabric overlaps are integral. No substitute character artwork or new motion may be invented.

## Coordinate contract (all values x,y,w,h in 2048x1152 stage units)

These are **provisional measured bounds**, NOT final per-asset alpha margins. The four main silhouette positions were cross-checked using contiguous bright-garment regions; all must be visually registered against the full-composition reference after the layered ZIP arrives.

| Garment | Silhouette rectangle | Preliminary chest guide only (not print mask) |
| --- | --- | --- |
| Regular Tee | 565,188,915,870 | 830,360,355,378 |
| Drop Shoulder | 575,186,901,872 | 820,360,350,390 |
| Full Sleeve | 619,193,818,864 | 835,345,330,382 |
| Hoodie | 624,216,805,845 | 840,410,325,320 |

The hoodie pocket and seams need a distinct print mask; never print directly on the guide rectangle without calibrated garment-specific clipping/shading.

| Shared element / independent layers | Position(s), x,y,w,h | z |
| --- | --- | --- |
| Original wood desk | 0,0,2048,1152 | 0 |
| Style board / pinned sign | 72,451,468,194 / 175,323,275,145 | 10/15 |
| Four style cards | (102,494,90,125); (207,494,89,125); (314,494,89,125); (421,494,90,125) | 18 |
| Color tray / taped sign | 86,819,345,246 / 25,696,312,134 | 10/15 |
| Pots Black, White, Red | (117,832,91,94); (211,832,92,94); (305,832,92,94) | 21 |
| Pots Yellow, Blue, Green | (117,921,91,94); (211,921,92,94); (305,921,92,94) | 21 |
| Rope / Size sign | 672,0,713,122 / 701,80,196,110 | 12/16 |
| S, M, L, XL, XXL tags | (914,80,57,91); (987,80,57,91); (1059,80,57,91); (1131,80,62,91); (1201,80,67,91) | 22 |
| Upload sketchbook | 1555,167,409,504 | 16 |
| Print Size board / sign | 1687,858,286,211 / 1664,752,333,113 | 10/15 |
| A3 / A4 paper cards | 1707,880,132,163 / 1847,896,107,149 | 18 |
| Selected garment | Variant rectangle above | 35 |
| Future uploaded artwork | Disabled until per-garment print masks are supplied | 38 |
| Botanical worker / roller ladder worker / hem worker | (559,481,159,207); (1208,316,218,226); (706,911,153,172) | 60 |

The four garment references presently show the shared controls and workers in consistent positions. If the ZIP includes garment-specific worker poses, override using approved reference coordinates, NOT responsive percentages. Do not invent or separately shift elements to fill tablet/mobile space.

## Next ZIP — required independent components

Please provide transparent images (PNG RGBA or authored SVG) with their original positions, layers, alpha edges, natural shadows, and object pivots:

1. Four garments: Regular Tee, Drop Shoulder, Full Sleeve, Hoodie, ideally each with a printable-chest alpha mask and shadow separated if animation requires it. Print zones and any distortion/crease/pocket masks are mandatory before overlaying uploaded designs.
2. Size rope, Size label and FIVE separate paper tags.
3. Garment Style sign/clip, board and FOUR separate garment-style cards.
4. T-Shirt Colors sign, timber tray and SIX separate paint pots (individually selectable).
5. Spiral upload sketchbook, ideally separate cover/page if opening animation is desired.
6. Print Size sign, board and separate A3/A4 cards. Confirm the proportional print-placement differences for each garment, not merely paper label graphics.
7. THREE separate illustrated miniature workers: left botanical art holder, right ladder/roller worker, lower hem worker. If they should animate physically, supply segmented hands, arms, brush/paper/ladder and their pivots.
8. Optional per-asset manifest with bounding rect in reference pixels, pivot, z-order, shadow provenance and garment-variant assignment. Preserve existing source filenames and add a mapping manifest rather than renaming the only original.

The user-supplied clean background is available in this chat. The transparent cutouts, print masks, pivot metadata, and style-specific shadow masks are NOT yet available. Do not infer stock, garment dye behavior, printable area, or worker rig from flattened pixels.

## Prepared implementation architecture

Source: src/worktable-stage.mjs (pure module; currently **not imported** into existing app.mjs).

- WORKTABLE_VIEWBOX and BACKDROP record one shared 2048x1152 logical stage and untouched 4000x2250 base provenance.
- GARMENT_VARIANTS records four reference-target states, provisional silhouettes and chest alignment guides.
- COMMON_LAYERS provides deterministic z-sorted independent controls and worker sprites.
- resolveWorktableLayers(variant) resolves correct garment with one fixed placement system.
- stageTransform() and pointToStage() convert screen points through ONE letterboxed scene transform; props do not drift at tablet or mobile breakpoints.
- createWorktableState() and worktableReducer() model local garment, size, paint color and print A3/A4 selection; no upload, checkout, AI art, stock, payment or network operations.
- User-facing accessibility will require actual button/radio semantics, aria-pressed or checked state, visible focus, hover/press, touch-safe alternatives and reduced-motion handling.
- Mobile should retain the same whole-stage registration with a synchronized accessible control rail or user-controlled whole-canvas pan/zoom; never create individual percentage placements.

Future upload: accept locally verified PNG/JPEG/WebP with limits and cleanup; sanitize SVG before inline use. Artwork must be clipped/shaded/warped by garment-specific print masks, adjustable within verified printable bounds. Add worker hover/press and subtle GSAP/CSS motion ONLY after individual layers and pivots arrive and choreography is approved.

## QA and release boundary

PRE-ZIP: test coordinate invariants, 4 garment variants, 5 size tags, 4 style cards, 6 pots, 3 workers, 2 print cards, z ordering, state transitions and responsive letterbox transform; run normal CHAPCHITRA build. Do not modify the live Artist's Edit screen.

POST-ZIP: verify exact per-asset alpha bounds; register transparent layers against each of the four full compositions. Pixel-difference/review screenshots at desktop, iPad landscape and portrait, mobile, test garment-specific upload clipping and A3/A4 changes, selected/focus/press states, touch/keyboard, reduced motion, no cropping/overlap/overflow. Owner approves visuals and behavior BEFORE pushing to the existing deploy/chapchitra-render-review branch and same Render service.

THREADS and other projects must remain untouched. This contract is a handoff, not a claim of visual integration.
