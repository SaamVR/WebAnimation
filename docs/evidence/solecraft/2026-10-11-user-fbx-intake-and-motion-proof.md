# Solecraft V2 — user FBX intake and visual motion proof

**Date:** 2026-10-11  
**Branch:** `feat/solecraft-v2-user-fbx-intake-20261011`  
**Stage:** Source asset accepted for internal prototype; production release BLOCKED.

## Source received
- User supplied `LAIR_SERIES_2_JORDANS.zip` (4,524,070 bytes; SHA-256 `7f7531d2ffe4f0171dba957ed5280bebfa1602f638437e061a15b2d76564f406`).
- Contains 2 FBX 7.4 files (`LAIR_M_JORDANS.fbx`, `LAIR_F_JORDANS.fbx`), 7 diffuse-color PNG textures, 1 normal PNG, 1 roughness PNG.
- Both shoe models present one combined mesh of 4,364 base vertices and 7,432 triangles. UV and texture maps are present.
- Both import through the device-free Python binary FBX parser and export to physically based GLB using Trimesh.
- Output male GLBs: White, Chicago, Blue, Black, Black_Full, Red, Lair; female White validation output.
- Important: geometry currently has a single combined mesh, not discrete separable sole, lace, and upper nodes. **Six-shot exploded assembly is blocked until genuine separation and rigging.**

## Initial asset hashes
- Chicago GLB: `d39e25dcf1ae7266770ef12cec85b7c933eec5683164dacb55baa459cfd068d9` (1,615,980 bytes).
- White GLB: `156fe62bd5cfa732eeefa52a0985c41678f9bd094a4fcf0c5b4fcedd0882e76a` (1,676,368 bytes).
- Blue GLB: `8e90599d80959833bc56a6ac25e97e7cee13d120676b48b2e35aa23f1526856d` (1,684,308 bytes).

## Verified GPT-runtime work
1. Extracted supplied FBX and all textures, rejecting unsafe zip paths.
2. Implemented binary FBX 7.4 parser, polygon triangulation, per-corner UV transfer and a textured GLB/PBR export.
3. Used VTK to render actual GLB geometry without Blender and generated 3 product key-art stills plus colorway comparison.
4. Created a 12-second H.264, 960×540, 18 FPS **motion proof** of wireframe-to-real-mesh transition, art-directed camera orbit and final hold. Verified through ffprobe and sampled contact sheet.
5. Built a separate portable HTML/CSS/JS product-viewer prototype reading the actual GLB, with camera orbit/zoom, three material colorways and separate film mode. No outside JS/CDN or user device.
6. Used an in-memory Chromium harness to inspect desktop/mobile presentation and tested graceful poster fallback where WebGL2 is unavailable.

**Tests and evidence (fresh in GPT runtime):** 7 Python tests PASS; 2 Node GLB parser tests PASS; 1 in-memory Chromium fallback/mobile test PASS; both portable ZIP archives passed integrity checks; actual film metadata verified.

## Outstanding, not claimed as done
- Browser WebGL2 validation BLOCKED: current GPT runtime Chromium returns no WebGL/WebGL2 contexts, including SwiftShader attempts. Code and GLB parsing were tested; **GPU pixels and actual on-screen 3D interactions were not independently verified**.
- Blender unavailable; physically accurate component separation, animation rigs, and high-fidelity film-grade visual completion remain pending.
- User-supplied asset depicts recognizable Jordan/Nike styling and marks. Public portfolio/showcase rights **unverified**. Keep materials private and do not commit or deploy model binaries publicly until permission is confirmed or a sufficiently original debranded/replaced model is available.
- **No source binaries, renders, or downloadable project packages are contained in this GitHub documentation commit.** Reviewable packages were generated in the ChatGPT artifact workspace; do not present GitHub as already holding the asset data.
- Current Render `main` deployment and legacy `/Project7/` remain unchanged intentionally.

## Next acceptance actions
- Resolve use rights / pick original model, then persist source files in a controlled, license-documented asset store.
- Run the portable viewer in a real WebGL2 browser via an approved GPT-runtime graphics tool and capture actual pixel/interaction proof.
- Separate physical shoe components for genuine assembly choreography, review close-up material quality, then integrate the accepted R3F production viewer on a preview branch.
- Publish to the existing Render site only after QA and rights approval; preserve nine project routes.
