# CHAPCHITRA — C05 Compact Approved SVG Integration

**Status:** Isolated review only. **Do not merge or publish production without owner visual approval.**
**Source repository:** `SaamVR/WebAnimation`, `projects/chapchitra/`.
**Baseline for this branch:** `4292f0e5bedd3d333dfeacd3f3fd70710dc509bd` — preserves C01, C08 restored original green textile patch, and the latest independent A3/A4 Artist's Edit work.
**Scope:** `.cc-sketch--compact` only, excluding existing `.cc-sketch--inline` compact-sized form controls. Product Add to Bag and all `.cc-sketch--long` stay untouched.
**Owner source:** `src/assets/compact/compact-button-approved-original.svg`, SHA-256 `d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f`.

## Exact artwork audit and color mapping

The supplied Adobe Illustrator SVG has a 164 × 64 viewBox, two authoritative root groups `BUTTON_FACE` and `BUTTON_SHADOW`, 114 path elements, and 10 polygon elements. No source geometry, IDs, irregular edges, texture vector, border, shadow or proportions have been rewritten. `scripts/c05-build-palettes.py` creates three derived color versions solely by substituting six original vector paint token definitions; it proves every other source byte remains identical except Windows line endings.

| Layer role | Press Green | Terracotta | Mushroom Gray |
|---|---|---|---|
| Main face `.st8` | `#293D2D` | `#8A503B` | `#A6A29B` |
| Velvet grain `.st7` | `#637565` | `#6E523F` | `#637565` (original grain preserved) |
| Inner border `.st9` | `#637565` | `#637565` | `#E4E3DE` |
| Outer outline `.st10` | `#232323` | `#293D2D` | `#232323` |
| Visible shadow `.st5` | `#293D2D` | `#1F2216` | `#6E523F` |

A source line `.st6` represents a zero-length invisible shadow helper path; retained as-is except matching the existing dark olive token in all variants. `.st7` remains the original approved lighter green on Press Green; it is intentionally not normalized to the brand palette.

## Application integration and animation

- The existing common `sketchButton()` renderer creates a `<button>` or `<a>` with the exact original HTML label, href, attrs and action semantics. For *only* compact non-inline buttons, it mounts the self-hosted matching SVG source as a static poster followed by a lazy, idempotent `/compact-button-runtime.mjs` module.
- The app loads only the SVG palette variants present on the page. One cached HTTP fetch per variant; no Lottie or GSAP dependency.
- Runtime imports original SVG groups and every approved path without modifying geometry. It transfers static original palette classes to **inline fill properties** to prevent different variants' global `.stN` class rules interfering when multiple SVGs appear on one page. The original SVG master is immutable.
- Native CSS moves only the complete `BUTTON_FACE` group **4.5px downward** and the separate HTML label in exact synchronization during pointer press or Space/Enter activation. The entire `BUTTON_SHADOW` remains stationary; no squash, scale, stretch or global button translation.
- Release uses restrained 210ms CSS spring-like easing; depression uses 85ms ease-out. Pointer cancel, release outside, pointer leave, lost capture and window blur clear the held state.
- The existing left-to-right 300ms ink transformation is preserved and is clipped by an exact copy of the original SVG face-fill path via `clipPathUnits=userSpaceOnUse`, inserted behind the existing unchanged outer border and grain. The original two-layer HTML label remains centered, legible and synchronized with the wipe.
- Accessible visible keyboard focus is retained. Decorative SVG is aria-hidden; native text remains present. Reduced-motion disables timed transformations without hiding content.
- Mobile displays 145×58 layout with the SVG's original 164×64 geometry preserved by `preserveAspectRatio=xMidYMid meet` and `object-fit:contain`; desktop default remains 164×64.

## Strict boundaries

- All long/full-width buttons keep original CSS markup, colors, hover wipe, width and Add to Bag `ADDED` behavior. No long CSS selectors were changed. `button-system.css` has appended C05-scoped rules only.
- Existing inline forms (Search, newsletter, filters, etc.) keep the old responsive CSS pill appearance and do not mount C05.
- Artist's Edit illustrated selectors, C01 benefits, C08 wordmark/green-patch source, product-card interactions, routing and unrelated standalone projects were not edited.
- A new isolated preview is at `/buttons/compact/`. The previous `/buttons/` page remains available as a comparison.

## QA

- Original Illustrator SVG source SHA locked; 3 variants proved paint-only. C05-specific source tests pass.
- Combined project full build and regression suite passed **136/136 tests**. Pre-existing Windows line-ending artifacts in the C08 master SVG and worktable CSS were normalized *temporarily during build*, and restored byte-for-byte after testing; they are not included in this PR.
- Independent Chromium and Playwright WebKit suite passed **53/53 interactive/layout checks** across 1408, 834, 430 and 320 px: colors, exact paths, clipping, shadow stability, pointer press/cancel/release, hover, Space keyboard, touch tap and reduced-motion.
- All six **long-button before/after screenshot pairs were pixel-identical (zero changed channel samples)** at 1408 and 430 widths, across all three existing long-button tones.
- Homepage, Shop, product detail, About and Artist's Edit route smoke: only actual full compact CTAs mount C05; long and inline controls continue using CSS pills, and no application page errors were observed.

## Visual evidence

- Three color board screenshots in `docs/c05-evidence/c05-*-rest.png`, `c05-*-hover.png`, `c05-*-pressed.png`.
- `c05-desktop-physical-press.webm`, `c05-tablet-touch-press.webm`, `c05-mobile-touch-press.webm` — actual browser recordings.
- `c05-chrome-mobile.png`, `c05-webkit-mobile.png` — responsive screenshots.
- `long-before-1408.png`, `long-after-1408.png`, `long-before-430.png`, `long-after-430.png`.
- `c05-long-pixel-equality.json`, `c05-browser-qa.json` — machine-readable QA.

## Release gate

Create **one isolated C05 draft PR**. Deploy only to the CHAPCHITRA review Render service after checking its current branch head and preserving ongoing Artist's Edit changes. **Do not merge** until owner approves the new compact button's tactile motion. Future long/elongated SVG integration is explicitly outside scope.
