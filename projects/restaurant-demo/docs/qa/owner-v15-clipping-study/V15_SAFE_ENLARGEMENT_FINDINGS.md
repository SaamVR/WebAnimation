# ZESTRY V15 — owner green-boundary F01 enlargement diagnostic

**Status: Not approved / DO NOT DEPLOY.** Baseline: merged V14 `df31c06c51130adcffecfde1ee97a0b7e889cf7d`; existing Render service unchanged.

## Owner request
Increase only the F01 ingredient/bowl animation within the large original wood-textured circle toward the hand-drawn green outline **without clipping any flying ingredient**.

## What was tested
- 756.6px original wood circle, original F01 8.7s Lottie assets and timing.
- 35% larger foreground SVG while keeping the wood backdrop and yellow accent unchanged, both with native overflow hidden and visible; same clipping defects.
- 261 deterministic real Chromium frames at 1.35×; sampled comparison at 1.05×–1.30×.
- Alternative per-layer group scaling; visually rejected because bowl/ingredient compositing changes and food falls behind the plate in unintended ways.

## Evidence
- Frames **21–24, 34–35, 43–44, 46–48, 53–59, and 84–85** produced edge-touching painted pixels for the 1.35× uniform zoom.
- `baseline-frame22.png` vs `rejected-1_35-frame22-tomato.png` visibly demonstrates the **cut tomato**.
- `rejected-1_35-frame34-herb.png` and `rejected-1_35-frame43-mushroom.png` show other chopped entrances.
- `rejected-1_35-frame60-looks-safe.png` and `rejected-1_35-frame240-looks-safe.png` show why approval based on only selected attractive frames would be misleading.
- At 1.10×, even the critical sampled frames registered edge-paint at frame 20. 1.05× had no edge-band pixels in the subset but is far below the owner's green-outline size.

## Independent creative critic
**Reject** a uniform +35% zoom and the per-layer group scale workaround. Both violate the no-clipping or approved-composition requirements. No unsafe patch is shipped.

## Next technically sound solution
Build an **isolated derived F01 rig with adjusted ingredient entrance/flight trajectories**, preserving the supplied vector artwork and duration/easing, then run 261-frame pixel-boundary screening, desktop/mobile full recorded-browser visual review, F04/F05/F07 regression, and owner approval. Original approved F01 JSON must not be changed without the owner's explicit approval to retarget movement. This diagnostic PR is not that permission.

**Deployment: NONE.** No approved live website/source file was changed.
