# CHAPCHITRA Artist's Edit — 80% Terracotta Front/Back Button

**Scope:** Front/Back Compact SVG button only (2026-11-12).

## Visual review

- [Full iPad-sized worktable screenshot](ipad-worktable.svg)
- [Close-up: front/back button and T-shirt hem clearance](ipad-button-closeup.svg)

Both are genuine **834×1112 WebKit viewport**, device-scale-2 browser screenshots, scaled/cropped only for review. The linked portable SVG files embed the actual browser JPEG bytes; no redraw or generated representation of the UI.

## Implementation

- Approved Compact SVG **Terracotta** asset, canonical face color `#8A503B`, via existing `sketchButton({variant:'compact',tone:'terracotta'})`.
- A scoped `scale(.8)` on **only** its face/shadow artwork and text/flip-icon plane at all responsive sizes.
- The original native semantic button box remains unchanged, retaining at least a 44px accessible hit height.
- The front/back row stays horizontally centered. Its scoped position fits below the approved garment hem on desktop and iPad; no garment pixel, print geometry or unrelated worktable element was moved.
- Exact front/back switching labels, active/hover effects, SVG artwork/source, A4 frame move control and pricing are preserved.

## QA provenance

- Browser-check source: `scripts/perf/artist-controls-qa.cjs` (includes exact 80% artwork, Terracotta face, native hit size, state and A4 regression checks).
- **53/53 PASS** with no browser JavaScript errors or failed HTTP responses in desktop Chromium 1440×900, iPad-sized WebKit 834×1112, mobile Chromium 390×844.
- Screenshot pass used the current shared Render website as a baseline and intercepted **only the candidate's two updated frontend files** (`worktable-studio.mjs` and `worktable-studio.css`) for an isolated source-specific preview. These captures are not a claim that the unmerged feature was live.
- Final staging deployment and SHA require independent Render verification after the serial merge.
- Physical iPad Safari was **not tested** by browser automation. Owner hardware check is still appropriate.

## Non-changes

No modifications to A3/A4 guide geometry, touch/drag coordinates, garment art, artwork editing, price/invoice, Grit Roller/C02, or other animation code.
