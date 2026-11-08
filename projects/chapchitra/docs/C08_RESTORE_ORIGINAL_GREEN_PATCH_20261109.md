# CHAPCHITRA C08 — Original Green Clothing-Patch Restoration

**Scope:** C08 Homepage Hero Slide 1 static clothing patch and its static fallback composition only. Wordmark/roller Lottie, light-surface navbar, static footer, C01, Artist's Edit, and other projects must remain unchanged.

**Starting C08 draft PR #73 head and existing Render review SHA:** `49bdc3ddc628ce14961d5bef274e39b3d0d6b1eb`.

## Design-source separation

The upper clothing-patch symbol is **not** part of the recolored C08 logo. The original green patch retains its original green pigments, fabric folds, stitch highlights, brushwork, shape, proportions, alpha/transparency and position. The lower wordmark and roller retain the approved Cream `#E4E3DE` and Terracotta `#8A503B` colors.

The original approved hero source is retained, byte-for-byte, in:

`scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp`

SHA-256 `d4298171361cf355eeea2d92a4d93b713397afbba11db49323115ea94de4d0d9`.

The previously approved Cream/Terracotta lower wordmark is frozen independently as:

`scripts/c08-fallback-originals/chapchitra-full-terracotta-before-patch-restoration.webp`

SHA-256 `3acec051748757e05501e759f497c938e69097b6c0f88f19c5a6c3bb6f288f00`.

The idempotent `scripts/c08-recolor-static.mjs` now **never recolors either component**. It assembles exact original RGBA pixel values from the original patch (rows 0–774 and the minimal independently verified antialias fringe up to row 829, x below 840) with the already-approved RGBA pixels from the lower wordmark. This exact source separation preserves the faint antialiasing strands at the symbol boundary and prevents accidental recoloring on future builds.

The static composite remains **1250×1052**, with the patch unchanged at exactly the original source position. The active cache-safe hero URL is:

`/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp`

The two previous fallback URLs (`chapchitra-full-on-dark.webp` and `chapchitra-full-on-dark-cream-terra.webp`) are also updated to the identical approved composite to eliminate inconsistent old/green logo fallback states.

**Composite SHA-256:** `1f5fc3845bc0d6ccfb840cb174bba65eea180203fe33fcab965758db0e00cd9d`.

The old C08 hero raster mask now reveals the full original patch up to the actual source separation and clips only the lower **26.35%** for the unchanged C08 animated wordmark. No geometry, hero composition positions, rotations, font sizes, overlay placement, or animation timing were modified.

## Independent visual and pixel QA

- **125/125** combined repository tests passing on the corrected build.
- **46/46** Chromium/WebKit rendered-state checks passing at 1408, 834 and 430 CSS-pixel widths, for frames 0/70/120/180/239, static footer, reduced motion, C01 content, navbar source and geometry.
- Pixel-by-pixel independent audit: **529,891 original patch pixels** preserved as the exact source RGBA; **83,759 lower-wordmark pixels** preserved as exact RGBA from the already approved two-color asset.
- Visual comparison of the clothing-patch region in browser screenshots at animation frames 0, 120 and 239: **zero differing channel samples** across the checked patch region; no color shift or flash.
- Reduced-motion still shows the complete original green patch with the approved two-color static wordmark and no C08 player.
- The original C08 animated vector JSON and approved source SVG hashes remain unchanged; no new Lottie path or choreography.
- Footer source remains byte-identical to SHA `e9b70e1af14dc71c2c065777415998c874c8af5517ac480297c127f1f6c489c5`.
- Artist's Edit is a separate versioned worktable and receives no source edits. Only the existing isolated Render CHAPCHITRA review branch may be updated, after checking live branch ancestry; no production merge.

The corrected lossless RGBA composite is approximately **579 KB**, versus approximately **250 KB** for the unauthorized all-Terracotta source; the larger single file is required to preserve all original rich green patch pixels exactly and remains self-hosted.

## Before and after evidence

**Before (incorrect Terracotta patch):** `docs/c08-evidence/dark-palette/c08-dark-chromium-1408-f239.png`

**After (original green patch, approved wordmark):** `docs/c08-evidence/patch-restoration/c08-patch-chromium-1408-f239.png`

**After at frame 120:** `docs/c08-evidence/patch-restoration/c08-patch-chromium-1408-f120.png`

**Reduced-motion static hero fallback:** `docs/c08-evidence/patch-restoration/c08-patch-reduced-static-1408.png`

**Mobile hero:** `docs/c08-evidence/patch-restoration/c08-patch-reduced-static-430.png`

**Machine-readable pixel evidence:** `docs/c08-evidence/patch-restoration/c08-patch-pixel-qa.json`

**Browser QA:** `docs/c08-evidence/patch-restoration/c08-patch-qa.json`

## Release boundary

C08 PR #73 stays draft/unmerged. Stop after deploying the isolated CHAPCHITRA review preview and verifying public playback. The owner will provide a future manually recolored patch SVG through a separate approval workflow; no SVG replacement is anticipated or created in this change.
