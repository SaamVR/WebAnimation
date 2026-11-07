# CHAPCHITRA — iPad Artist's Edit cache and fallback blocker

**Scope:** Performance-recovery follow-up to draft PR #60, source baseline `6f952188452ca4d872275bedf1e31d5311b6a102`. Keep PR #59 and #60 draft/unmerged, leave THREADS and all other storefront routes unchanged.

## Code-level root cause

The old shipped Artist's Edit entry called `fetch('/assets/worktable/manifest.json', {cache:'force-cache'})`. If a browser retained the prior full-PNG manifest, the manifest lacked the optimized `delivery.variants`/four-scene data, so `artworkReady` was false. That returned the page to the old rendered "Compose your idea" form **without an on-page diagnostic**. A later WebP manifest or code-loader failure could also restore the old form in its catch branch. The reported iPad screen recording is consistent with this failure path. An iPad network trace was not available, so **the specific on-device failed request is not proven**.

## Correction

1. The build creates a **new unique /artists-edit/review/<FULL_GIT_SHA>/** URL for each commit. The HTML, every relative JavaScript module, worktable CSS, and optimized manifest are released under **/releases/<FULL_GIT_SHA>/** so prior Safari/Chrome HTML and JavaScript caches cannot supply a prior build to the direct link.
2. The release-stamped manifest includes `__deliveryBuild`. The browser fetches the versioned URL with `cache:'no-store'` and validates build identity, five required source layer descriptions and the optimized responsive scenes before mounting.
3. While validating, the old configurator is hidden. Failures show accessible diagnostic codes `MANIFEST_VALIDATION_FAILED`, `WORKTABLE_RENDER_FAILED`, `BOOT_FAILED`, or `MODULE_FETCH_FAILED` with the build revision and a direct current-review retry link. The site does not silently display "Compose your idea" as a substitute.
4. The successful worktable exposes a small visible build revision below the page introduction, and code can inspect `document.body.dataset.reviewBuild`, `document.body.dataset.worktableStatus` and `window.__chapchitraArtistDiagnostic`. Release metadata are available at `/releases/<SHA>/release.json` with the expected manifest SHA-256.
5. The 43 checksum-verified original master PNGs remain source-only; WebP assets, stage coordinates, controls and print interactions are unchanged. No service workers or local Cache Storage writes were identified in the project's Artist's Edit source.

## Verification in local and live environments

- Run `npm run build`: 66/66 Node tests passed before release.
- Run `CHROMIUM_PATH=/snap/bin/chromium node scripts/perf/ipad-review-qa.cjs <BASE> <SHA>`: test unique build URL, resource request paths, manifest version, correct mounted stage, no legacy form or page errors, and force stale/failed manifest and module fetch cases.
- Local browser engine tests: **33/33** before adding visible version-marker assertion, then **36/36** after. Tests include Chromium with Safari-like and Chrome-on-iPad UA strings, and installed **Linux Playwright WebKit** engine. These are NOT browser runs on a physical iPad.
- Full browser controls and responsive QA: **35/35**, additional delayed-asset and simulated worker failure passed. Four garment render screenshots continue to match approved optimized rendering.
- The source branch and existing Render service are the only release targets; no new service and no production merge.

## Reviewer instructions

Open the **direct, full-SHA review URL** supplied with the live release rather than a previously saved /artists-edit/ tab. The worktable should appear with the small visible build revision. If a failure panel appears, it shows an exact error code and a recovery link; capture that code for diagnostics. If the direct link works but the original plain URL does not, compare browser HTTP cache/shortcut behavior before making further code changes.

**Independent critic verdict:** code-path recovery verified on Chromium and Linux WebKit. Physical Safari and Chrome on the user's iPad are still an owner-side empirical verification gate, not automatically accepted.
