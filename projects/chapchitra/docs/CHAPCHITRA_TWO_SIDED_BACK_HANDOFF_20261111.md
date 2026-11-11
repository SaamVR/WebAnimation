# CHAPCHITRA — Four back garment assets and independent two-sided editing

## Production state

**DRAFT / optimized asset pack installed; integrated browser QA and owner visual acceptance are required before release.**

- Source base: `b99fe7b1648aa870c782a6ecda3deef0f5a838c5`
- Original owner upload: `Tshirt back.zip`
- Original alpha RGBA source images are **4000×2250**, not 2048×1152 as stated in the initial brief. Runtime stage coordinates remain 2048×1152.
- Source changes are confined to CHAPCHITRA's Artist's Edit and its build validator.
- The four back-view originals remain byte-preserved outside the runtime tree. The 12 WebP browser variants and registration manifest were installed on this draft branch at commit `3497bf442a94b12e7d51e1c71f0083fe6a2f27a3`.
- **Do not merge or update the shared Render review branch until integrated browser QA passes and concurrent changes have been reconciled.**

## Owner-supplied exact PNG checksums

| Garment | SHA-256 of original owner PNG |
|---|---|
| Regular | `4dfe2de4a4cca7a1730a801bb59d4bbf29cfa60a4ca82d0868d7ac673400aa24` |
| Drop Shoulder | `97bbda67b4df4a210f3432cc86f8dfcecfe5bc725d7b288bf971460596427d68` |
| Full Sleeve | `4505c681629d629ea3dee1bd7d46575bebf79650ac192ffa45953a9d117b106d` |
| Hoodie | `b26e7771a605d79d217c6fcfb03001f35cada4894d82b830bede09c0a24b06af` |

## Registration: stage space

The 2048×1152 stage coordinates below are measured/fitted from the owner's actual PNG alpha extents. **Only the back assets were resized/re-registered; the original front assets are unchanged.**

| Garment | Back X | Back Y | Back width | Back height |
|---|---:|---:|---:|---:|
| Regular | 588.8188 | 185.8019 | 867.3623 | 874.3962 |
| Drop Shoulder | 580.2995 | 183.4443 | 890.4009 | 877.1114 |
| Full Sleeve | 616.4517 | 192.5558 | 823.0966 | 864.8885 |
| Hoodie | 644.2867 | 213.4502 | 764.4267 | 850.0996 |

## Asset installation

The **separate downloadable companion package** delivered to the owner includes:
- `browser-assets/worktable/back/manifest.json`
- `browser-assets/worktable/back/variants/{regular,dropShoulder,fullSleeve,hoodie}.w{768,1536,2560}.webp`
- `owner-originals/` with all four unmodified RGBA PNGs
- a registration report and contact sheet

The `browser-assets/worktable/back/` subtree is now installed in this feature branch. Preserve the four originals separately (outside the published browser-assets directory). This supplies the 12 compact, exact SHA-pinned optimized WebPs and their registration manifest. Nothing in the original front manifest, front sources, workers, color-pots, or scene must be overwritten.

Once files exist, run from `projects/chapchitra`:
```sh
npm ci
npm run build
npm run preview
CHROMIUM_PATH=/path/to/chrome CC_QA_URL=http://localhost:4457/artists-edit/ node scripts/perf/two-sided-qa.cjs
```
The build deliberately **fails closed** when the back manifest/variants are absent or their checksums drift; this prevents a broken front/back control from reaching the public Render preview.

## Implementation

- Small, external `View back`/`View front` control below, rather than covering, the illustrated 16:9 desk.
- Default Front. Approximately 400ms pure 2D turn-in animation; honors reduced motion.
- Native `worktable-two-sided-state.mjs` maintains two independent local object URLs, bitmaps, A3/A4 presets, edit offsets, scale, rotation, selected mode.
- Switching preserves shared garment/size/color and can reload the correct back asset by style.
- Only the back variant is decoded on first back request. Direct first frame/front hydration path is unchanged.
- Existing pigment renderer and atomic backplate compose are reused; back stage registration is adjusted independently.
- Original Move, Resize, Rotate, Reset, Remove, slider, keyboard, and upload interface continue to operate on the active side.
- Side-owned object URLs are revoked when the side is replaced/removed or on pagehide/destroy, not on view changes.

## Gates still required

- ✅ Asset bundle installed on the **same** feature branch; full cloud build and 149/149 source tests passed at commit `3497bf4`.
- Browser and image checks: 4 garments × 2 sides, all six pigments, A4/A3 guide alignment, several switches, simultaneous front A/back B.
- Inspect all screenshots and desktop/tablet/mobile recordings; physical iPad remains unverified until owner tests it.
- Check performance: no back files fetched on initial Front visit.
- **Only then** consider coordinated deployment to the shared CHAPCHITRA Render review, and stop for owner visual approval.
- No `main` merge, no unrelated project changes.
