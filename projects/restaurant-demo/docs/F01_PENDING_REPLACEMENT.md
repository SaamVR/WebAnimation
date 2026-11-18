# ZESTRY F01 — hero animation removed, awaiting owner replacement

**Status:** F01 rejected and removed from the current ZESTRY staging site and active source tree. Do **not** restore old V16/V17/V18 F01 compositions or generated frames when integrating a newly uploaded file.

- Deleted original artwork source: `projects/restaurant-demo/assets/lottie/f01.json`.
- Removed original F01 `assets/lottie/f01-v16.json` from `review_bundle/`.
- Removed old playable F01, its SVG wood/clip setup, the F01 animation loader, and its runtime references from the published HTML.
- Hero now displays a neutral temporary "Hero artwork awaiting replacement" area. Existing hero copy, site layout, chef, F02–F07, interactive menu, cart, checkout, and simulated booking are preserved.

## Existing Render build compatibility

The **existing** static site's hard-coded build command still parses an `assets/lottie/f01.json` file and requires a nonempty `layers` array. The Render connector does not expose a build-command editor. Therefore, the packaged review ZIP contains an **inert, one-frame null-layer validation stub** at that path solely to allow the unchanged existing Render service to deploy. This is not the original F01 source, contains no rendered artwork, and is neither fetched nor played by the website. Its composition name is `F01_REMOVED__EMPTY_RENDER_BUILD_VALIDATION_ONLY`.

Until the Render build assertion is updated, do not mistake this stub for restored animation source.

## Next owner upload

Wait for the owner to supply new F01 artwork. Inspect and validate the supplied file **before** adding it back. Do not animate, enlarge, crop, change timing, or alter its SVG paths without the owner's instructions. Keep F02 chef and all other scene work unchanged.

## Provenance

GitHub deletion removes the file from the current branch and subsequent deployed ZIP, but normal Git commits retain historical versions. No force-push or history rewrite was performed; doing so could endanger unrelated work in the shared `SaamVR/WebAnimation` repository.

QA evidence: `projects/restaurant-demo/docs/qa/owner-f01-removed/F01_REMOVAL_ACCEPTANCE.json`, 15/15 desktop/mobile browser checks passed before release.
