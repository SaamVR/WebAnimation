# CHAPCHITRA — C05 Final Palette, Ink Hover and Navigation Focus Correction

**Scope:** Existing C05 approved 164×64 compact SVG only; owner-approved illustration, physical travel, 85ms depression, 210ms release, 300ms ink fill, typography, CTA spacing, routes and positioning unchanged. Never touch long buttons or replace their SVG in this phase.

**Source of truth:** The owner's November 9, 2026 annotated A/B/C color reference, not compressed screenshot color sampling. It supersedes all older compact palette tables. Original immutable Illustrator SVG SHA-256: `d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f`.

## Final SVG class-level paint mappings

| SVG paint role | A — Press Green | B — Terracotta | C — Mushroom Gray |
|---|---|---|---|
| Face `.st8` | `#293D2D` | `#8A503B` | `#A6A29B` |
| Original velvet texture `.st7` | `#637565` | `#6E523F` | `#637565` original |
| Inner light border `.st9` | **Warm Beige `#D8CEC2`** | **Warm Beige `#D8CEC2`** | **Cream `#E4E3DE`** |
| Outer outline `.st10` | **Graphite `#232323`** | **Graphite `#232323`** | **Graphite `#232323`** |
| Shadow `.st5` | **Deep Forest `#172419`** | **Dark Olive `#1F2216`** | **Terracotta `#8A503B`** |

The internal source `.st6` preserves its original Dark Olive detail. Palette generation changes only the paint declarations in `scripts/c05-build-palettes.py`, preserving all original handmade paths, polygons, group IDs, artboard geometry, texture outlines and shadow silhouette.

### Why the previous hover failed, and the exact repair

Original `addInkClip()` placed the SVG `rect.cc-compact-ink` using `base.after(ink)` **behind** a subsequent Illustrator group of **69 opaque painted face paths/polygons**. The browser drew those body shapes over the ink, leaving the button face unchanged on hover. The earlier clip attached to the transforming rectangle could also produce inconsistent clipped movement.

The corrected runtime inserts an ink `<g class="cc-compact-ink-shell">` **after** the 69 face paints but **before** the original Warm Beige/Cream border and Graphite outline. The wrapper holds the immutable `clipPath` generated from the exact original face silhouette, while only its child `rect.cc-compact-ink` scales horizontally from 0 to 1. Thus the rectangle cannot leak outside the organic face path, cannot paint over the edge, and cannot touch the separate fixed SVG shadow. The fill is Graphite `#232323`, with 0.94 opacity retaining subtle underlying handmade grain. Original CSS 300ms cubic-bezier ink sweep and existing dual HTML label treatment remain. Exit reverses the same animation. All 3 variants share the same geometry and behavior.

### Why the homepage button displayed an outline after browser Back

A clicked anchor can retain focus/pressed state when restored by browser Back/Forward Cache (BFCache). The compact runtime now remembers **pointer navigation only on an actual `pointerdown`**; on the subsequent anchor click with `event.detail>0`, it blurs that pointer-focused link before navigation. A `pageshow.persisted` handler clears any retained pointer-activation focus/pressed state. Keyboard Enter-generated click `detail=0` is deliberately unaffected. `:focus-visible` and its existing 3px accessible ring remain active for real keyboard focus. Other links, form buttons, long buttons and global focus rules were untouched.

### Browser QA and evidence

- **136/136** full repository tests pass. The two pre-existing Windows CRLF-sensitive C08/Artist's Edit artifacts were normalized only transiently for testing, then restored byte-for-byte.
- **53/53** full local Chrome/WebKit C05 variant, responsiveness, source color, pointer, keyboard, touch and reduced-motion checks pass at 1408/834/430/320 widths.
- **20/20** dedicated Chrome/WebKit pixel and navigation tests pass: all three colored faces visibly change to Graphite on hover, exact clipped region, unchanged shadow strip, no corner leakage, physical 4.5px press/stationary shadow, homepage → About ("Discover the studio") → browser Back clean; keyboard focus ring visible, keyboard Enter navigation works, mobile touch Back clean.
- For Chrome, real Tab traversal to the anchor shows `:focus-visible` and a visible ring. WebKit's Safari default Tab-to-links behavior depends on Full Keyboard Access; after keyboard Tab input, focusing the hero anchor displays the same native `:focus-visible` ring. This platform-specific distinction is documented, not hidden.
- **6/6 original long-button before/after pixel comparisons** were exact (zero changed channel bytes), at 1408 and 430 widths across three long-button colors.
- No redraw, paths, time constants, button position, long-button action, C01 or C08 or Artist's Edit modifications.
- Self-hosted revised SVGs use a versioned compact-only URL query `?c05=final-colors-ink-2` in both static poster and cached inline SVG loader, preventing an old palette from sticking in browser cache.
- The isolated review labels now identify Deep Forest/Terracotta shadows and Warm Beige borders correctly.

## Direct visual evidence

**All three before states:** `docs/c05-evidence/c05-forest-rest.png`, `c05-terracotta-rest.png`, `c05-beige-rest.png` (earlier implementation; originally approved body shapes).

**All three after states:** `docs/c05-final-evidence/c05-final-forest-rest.png`, `c05-final-terracotta-rest.png`, `c05-final-beige-rest.png`.

**After hover:** `docs/c05-final-evidence/c05-final-forest-hover.png`, `c05-final-terracotta-hover.png`, `c05-final-beige-hover.png`.

**After press:** `docs/c05-final-evidence/c05-final-forest-pressed.png`, `c05-final-terracotta-pressed.png`, `c05-final-beige-pressed.png`.

**Live browser recordings:** `docs/c05-final-evidence/c05-final-all-colors-hover-press.webm`, `c05-chrome-homepage-navigation-back.webm`, `c05-webkit-homepage-navigation-back.webm`.

**Keyboard evidence:** `c05-chrome-keyboard-focus.png`, `c05-webkit-keyboard-focus.png`. **Clean Back:** `c05-chrome-hero-back-clean.png`, `c05-webkit-hero-back-clean.png`. **Long before/after:** `c05-long-baseline-1408.png`, `c05-long-unchanged-1408.png`, `c05-long-baseline-430.png`, `c05-long-unchanged-430.png`.

**Machine-readable:** `c05-browser-qa.json`, `c05-final-acceptance.json`, `c05-final-long-equality.json` and `scripts/c05-final-acceptance.cjs` reproduce the tests.

## Review and release boundary

Implementation remains in focused C05 draft PR #75; do **not** merge or start the long-button SVG phase. Deploy only the isolated CHAPCHITRA Render review branch after verifying the live branch head still equals the C05 predecessor SHA. Stop for visual owner approval.
