# THREADS T03 — Stage A, live experimental browser verification

**Decision: NOT READY for creative approval; additional separated artwork needed.** No Stage B promotional cards or T04.

## Isolated live Stage A preview
https://threads-t03-stage-a-backpack-20261019.onrender.com/#deal

Render static service `srv-dbb1sjeq1p3s73dhk2mg`, deploy `dep-dbb1sjuq1p3s73dhk3s0`, status LIVE, workspace My Workspace. Manual deployment, auto-deploy OFF, no paid compute enabled.

Source branch: `feat/threads-t03-stage-a-backpack-20261019`
Stage A code SHA: `bae9f8c1b46c42be2f82cc43a207efdb97dda7b4`.
Previous T02 protected checkpoint: `checkpoint/threads-t02-approved-20261019`, exact prior source `ec7e32686be55a6f3bdc6acf954ac7757c111fb0`.
T01 SHA `73f792ca988779e97cd02b83ed6ff96c13024f30`, T01 module blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`; no approved source edited.

## Actual Chrome recordings from deployed Render preview
- [Desktop opening and closing (6.08s MP4)](desktop-stage-a.mp4)
- [Mobile opening and closing (5.64s MP4)](mobile-stage-a.mp4)
- [Closed endpoint, desktop](desktop-closed.png)
- [Opened endpoint, desktop](desktop-opened.png)
- [Intermediate buckles/flap test, desktop](desktop-opening.png)
- [Opened endpoint, mobile](mobile-opened.png)
- [Closed again, desktop](desktop-closed-after.png)
- [Browser QA telemetry](QA-browser.json)
- [T02/storefront preservation regression](integration-regression.json)

## Tests performed
- 37/37 source/contract checks passed, with T01 and T02 contracts intact and T03 Stage A checks updated.
- 21/21 deployed Chrome tests passed (toggle closed/open, closed again, desktop/mobile/reduced motion, no inserted deal cards, T01 spotlight).
- 17/17 deployed Chrome T02/storefront regression checks passed (add-to-cart/media, cart, checkout).
- Zero browser JavaScript errors on the verified rerun.

## Important technical and creative limitations
Two images are different full-scene illustrations rather than mechanically separated layers of the same rig. The closed original is preserved as the resting image. The opened original is affine-aligned using common landmarks, and a geometric mask transitions the scene as an extracted flap rotates in 3D. The full-body mask does NOT keep the unrelated cap/sneaker/bottle completely pixel-stationary; their positions shift slightly. The upper edge of the provided open flap is clipped, leaving a straight cut in the opened endpoint. Image masks alone cannot restore missing pixels or accurately create the flap's unseen reverse surface. Thus this experiment is **not** convincing enough for Stage A creative sign-off.

**Precise required assets** are in [README.md](../README.md): isolated fully uncropped closed flap front, opened flap underside with matching hinge/pivot; a true flap-free bag/cavity plate with unchanged surroundings; two detachable straps plus buckles; separate foreground mouth rim/occlusion matte. All same coordinate system/transparency/scale as closed master illustration.

The existing "Shop the Deals" CTA triggers this Stage A demo on ordinary click; modifier-click still follows its existing Shop link. This temporary interaction is isolated to this Stage A branch and should be revisited after visual approval.

Do not merge this PR or start Stage B/T04 until the owner supplies layers and approves the physical opening.
