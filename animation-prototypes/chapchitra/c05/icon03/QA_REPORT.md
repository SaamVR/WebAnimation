# C05 Icon03 — Technical QA (V1)

- **Source:** `More_than_a_tshirt_Icon_3(2).svg` uploaded by user; original source bytes preserved in ZIP, SHA-256 `5e585d1b65796b32f17a3f22cccb43056e3ed62dd0e123779de2205939b206ad`.
- **Canvas:** 512×512. **Frame rate/duration:** 30fps/3.2s; plays once and holds completed artwork.
- **Artwork counts:** 409 original SVG paths, seven original polygons, one original circle preserved as vector groups; zero image layers and zero external image dependencies.
- **Lottie layers:** `Wood_block`, `Wood_block_shadow`, `Print_over_cloth`, `Cloth`, `Icon_Circle`.
- **Motion:** Only `Wood_block` animated (position/scale). Impression `Print_over_cloth` uses diagonal path mask, not opacity fades. Static cloth, shadow and background preserved.
- **Structural checks:** JSON parsed, dotLottie archive integrity passed, generated artifacts present.
- **Final frame:** Pixel-identical to original source in 640×640 CairoSVG reference raster (zero changed pixels).
- **Chromium SVG-reference QA:** Desktop, iPad-size, mobile: no page errors, controls and scrubbing passed; reduced-motion final static pose passed.
- **Isolated Vercel site:** https://chapchitra-c05-icon03-standalone-review-mnp78zf4e-samvrc.vercel.app/; deployment state READY. Bundled official `lottie-web` v5.12.2 script.
- **Outstanding:** Independent visual confirmation of official/native `lottie-web` playback in Chromium and Safari/WebKit. The offline browser test exercised the equivalent inline-SVG reference when CDN access was blocked; do not mislabel it as native Lottie certification.
- **Known artistic limitation:** Isometric 2D stamp uses simple diagonal translation and restrained compression rather than genuine 3D underside deformation; the existing source art is not modified.
- **Creative gate:** Awaiting user approval. No website or other C-series changes.
