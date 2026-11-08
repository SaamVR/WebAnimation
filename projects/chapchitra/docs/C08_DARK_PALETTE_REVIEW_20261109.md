# CHAPCHITRA — C08 Final Cream + Terracotta Inverted Logo Correction

Status: Isolated visual review; owner approval required. No production merge.
Starting review SHA: f2fd3693de08c0f28d41a9952adf1d5ba27e2db1

## Source-of-truth note

The user's latest instruction references an attached inverted-color SVG, but no new SVG was present among the conversation's accessible attachments. The current implementation therefore follows the explicitly stated color mapping, using the site's existing Cream #E4E3DE and Terracotta #8A503B design tokens. The unavailable SVG cannot be claimed as independently visually matched.

## Exact vector mapping (original Lottie artwork remains unchanged)

- 21 Graphite #232323 fills become Cream #E4E3DE.
- Six Press Green #293D2D fills become Terracotta #8A503B.
- One Gallery White #F6F7F5 roller-head fill becomes Cream #E4E3DE.
- All geometry, easing, transformations, keyframes, layer hierarchy and the original four-second / 240-frame / 60-fps playback are identical.
- Original dark-navbar JSON SHA-256 e3887a7187f845099a4948c3a8a3ff2b85dc650b381635cc6db5e3aa68d33876.
- Original approved SVG SHA-256 093b1d63ce8e572caa9f605cf1c786f174a2b3505d228b7279d51982c63cd4a3.
- Derived JSON: src/assets/c08/wordmark-reprint-dark-inverted-v2.json; legacy dark variant JSON has also been corrected.
- Derived SVG: src/assets/c08/wordmark-reprint-dark-inverted-v2.svg; this is a paint-only derivation, not a replacement for the immutable master.

## Static logo fallback fidelity

The hero (1250x1052) and footer (1400x316) use corrected lossless WebP with exactly two visible pixel RGB values: Cream and Terracotta. Both original dark-surface fallback URLs have also been corrected. New versioned active URLs avoid browser caches:
- /assets/chapchitra-full-on-dark-cream-terra.webp
- /assets/chapchitra-wordmark-cream-terra.webp

Original source fallbacks are kept as auditable local build inputs in scripts/c08-fallback-originals. The static textile artwork retains its exact silhouette coverage, individual stitching and illustrated folds. The original textile depth is represented through varying opacity of Terracotta ink without adding another hue. The light-background navbar's static WebP and original Lottie remain unmodified. The footer remains entirely static.

## Quality gates

- 124/124 combined repository tests passed.
- 46/46 Chromium and WebKit real-render browser checks passed at 1408/834/430 CSS px, frames 0,70,120,180,239.
- All 28 non-clipping painted Lottie SVG paths have only Cream or Terracotta fills in-browser. Non-painted clip-path helper masks may contain default black/white and are not visible.
- Each dark-surface raster fallback decoded and passed pixel-level exact-palette verification; no green pixel remains in the active variants.
- Hero and navbar alignment, C01 unchanged labels, reduced-motion and static footer checked.
- One transient WebKit 430px ResizeObserver delivery notice occurred during the first run; the final suite had no application JavaScript errors.
- No extra runtime animation players or network dependencies.
- Image bytes: hero 302,954 before / 250,474 corrected; footer 55,754 before / 24,112 corrected.

## Screenshots / recording

- docs/c08-evidence/dark-palette/c08-dark-chromium-1408-f0.png
- docs/c08-evidence/dark-palette/c08-dark-chromium-1408-f120.png
- docs/c08-evidence/dark-palette/c08-dark-chromium-1408-f239.png
- docs/c08-evidence/dark-palette/c08-dark-chromium-footer.png
- docs/c08-evidence/dark-palette/c08-dark-webkit-1408-f239.png
- docs/c08-evidence/dark-palette/c08-dark-qa.json
- docs/c08-evidence/dark-palette/c08-inverted-hero-autoplay.webm

## Release rule

Deploy to the isolated Render review service, stop for owner visual approval. Do not merge or publish production. Artist's Edit, C01, other homepage features, EcomCMS and THREADS are not modified.
