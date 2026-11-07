# CHAPCHITRA — Artist's Edit P0 performance recovery

**Scope:** Only `projects/chapchitra` Artist's Edit browser-delivery/runtime/tests. No changes to other routes, shared navbar, branding, THREADS, or artwork masters.

**Original baseline:** `0cd26b8b7d89ce4de69ff61e6643101cb430d4b7`, PR #59. Existing release service: `chapchitra-webanimation` / `deploy/chapchitra-render-review`. This document is a technical QA record, not production authorization.

## Diagnostic conclusions
1. Original `app.mjs` requested a manifest plus five HEAD checks before starting the worktable.
2. Forty-three independent 4000×2250 PNG files were published directly from the original archive (39 painted layers in the initial worktable, with other garments available), making the image payload very large.
3. All 39 image elements were eagerly fetched and `Promise.all(image.decode())` barred completion; instrumentation recorded **39 simultaneous decode operations**, with **351,000,000 decoded image pixels** (~1,339 MiB of uncompressed 4-byte RGBA pixel equivalents, not total browser RAM). This risks mobile/iPad memory thrashing.
4. The original Chromium browser occasionally stalled while taking 4K-layer worktable screenshots. This is recorded as a baseline limitation, not a passing visual test.

## Implementation
- **Immutable masters:** the six checked source archive segments are preserved. Before publication, every original 4000×2250 PNG is reconstructed and verified against its per-file SHA-256 and archive SHA-256 `b86cd5425bb28c58de39bc7db75c7724005c4530da00fc19c81567293e7769bb`.
- **Generated delivery:** `npm run optimize:artwork` derives 768/1536/2560 stage-width transparent WebP variants with a precisely registered source alpha bbox plus 3 source-pixel safety padding, backed by a per-file source checksum and separate generated-asset checksums. `npm run build` validates all variants and publishes only browser delivery assets; **zero original 4K PNGs or full-composition references are served**. The build is repeatable from the source archive and does not need the owner's ZIP.
- **Initial composition:** an authored-asset-only, preassembled regular-tee first frame has three responsive sizes (768/1536/2560). This is a performance cache built from the **same 39 independent layers**, not a redesigned replacement, unapproved illustration, or source-only reference.
- **Progressive runtime:** manifest validation, fetch-priority initial scene, atomic worktable reveal on first scene decode, 2 bounded concurrent async image decoders for independent layers, responsive `srcset/sizes`, reusable resource URLs, atomic swap of predecoded garment variants, cropped garment tint mask, fallback to safe preview on deferred layer failures. The five route-level HEAD checks and mandatory all-image decode barrier are removed.
- **Unmodified interactions:** four garment choices, five sizes, six fabric colors, A3/A4, local-only upload/move/resize/reset/remove, focus/keyboard, hover/selected states, responsive rail, and reduced-motion semantics.

## Reproducible cold-cache comparison (same conditions)
- Browser: headless Linux Chromium, CDP network instrumentation, JavaScript and image resource collection, fresh incognito context, cache disabled, `latency=70ms` and throughput throttled at 10 or 4 Mbps.
- Source builds: exact baseline at `0cd26b8` and new branch served separately from the same local host; no additional Render CDN assumptions. 1440 px desktop / 390 px mobile simulated viewport (not physical iPad).
- **First complete worktable displayed, desktop 10Mbps:** 22.16 s original → **1.90 s optimized**.
- **First complete worktable displayed, 390px mobile 4Mbps:** 51.75 s original → **2.33 s optimized**.
- **All individual layers hydrated:** 22.19 s → 3.47 s desktop; 51.78 s → 4.02 s mobile.
- **Image transfer measured by browser:** 24,805,008 bytes original → **830,232 bytes** optimized desktop; 24,805,008 → **309,249 bytes** optimized mobile.
- **All-request transferred bytes including document/fonts/scripts:** 25,319,504 bytes original → **1,447,097 bytes** optimized desktop; 25,319,504 → **926,005 bytes** optimized mobile.
- **Entire 129 image-variant artifact:** 2,248,956 bytes; three ready-scene WebPs 887,896 bytes collectively; optimized published worktable directory ~3.4 MiB. These are artifact sizes, not necessarily a single page download.

## Decode / memory pressure
Separate unthrottled same-machine Chromium instrumentation wrapped `HTMLImageElement.decode`, measuring decode calls and concurrency, resource bytes, pixel counts and CDP main-thread metrics:
- Original: peak 39 simultaneous image decodes, cumulative 23.1 s of decode-promise elapsed time, largest individual 620 ms, ~351 million decoded pixels / ~1,339 MiB RGBA-equivalent.
- Optimized: peak 2 simultaneous image decodes, cumulative 1.5 s of decode-promise elapsed time, largest individual 192 ms, ~2.14 million decoded pixels / ~8 MiB RGBA-equivalent.
- Warm-cache optimized useful display: **0.32 s** observed on one same-machine reload; complete hydration ~0.44 s. Unthrottled timings are not comparable to throttled mobile results. The original warm reload exhibited severe variability/stall; do not extrapolate its 42 s observation as a typical warm-cache value.
- **Limit:** computed RGBA-equivalents are decoded-image pixels, *not measured resident memory or browser/GPU peak allocation*. Main-thread CDP metrics reflect Chromium runner only; physical iPad unavailable.

## Visual fidelity / interaction
- All four final garment browser screenshot crops compared at identical 1440×810 resolution to a reconstruction of the original untouched full-resolution PNG runtime layer stack with the matching garment.
- Comparison screenshots and difference heatmaps are in `docs/performance-evidence/`, along with `visual-diff.json`.
- Mean absolute RGB differences (0–255): Regular **2.865**, Drop Shoulder **2.859**, Full Sleeve **2.826**, Hoodie **2.972**. Differences include selected-state outlines in browser output that do not appear in the independently assembled original source layer stack, plus WebP resampling.
- Browser QA: **35/35 assertions passed**, four garment screenshots, five sizes, six colors, A3/A4, upload, resize, reset, removal, keyboard focus, responsive 1194/834/390/320 widths with no horizontal overflow, 44px mobile upload, reduced-motion. **63/63 automated build tests passed.**
- **Limits:** four separately supplied *full-composition reference PNG binaries* are not included in the checksummed runtime source archive. Prior PR #59 reports comparing original layer assembly to those references; this run additionally verifies source-layer-to-browser visual fidelity. Physical Safari/Chrome on the owner's iPad have not been exercised; touch/mobile Safari memory behavior and actual release-server speed remain an owner validation gate.

## Independent critic / release decision
**REVIEW CANDIDATE CONDITIONAL PASS**, not production acceptance:
- Proof: the same original image layers were trimmed/registered; no source artwork recolored/redrawn; tests and controlled cold-cache measurements meet numerical delivery/interaction targets.
- Residual risks: compression creates small measurable pixel differences, intentionally selected controls differ from static reference imagery, WebKit/iPad not verified, and a first-frame fetch failure forces slower layer-by-layer recovery. Initial preview depicts the default garment while a selection made during its brief background hydration is queued; it resolves once the matching decoded layer is ready.
- Approval remains with owner following Render visual review and physical iPad. No unrelated features or merge are authorized.

## Rebuild / rollback
Run `cd projects/chapchitra && npm ci && npm run optimize:artwork && npm run build`. The master originals are checked and used **only at build time**. To roll back this review deployment, restore `deploy/chapchitra-render-review` to known good `0cd26b8b7d89ce4de69ff61e6643101cb430d4b7` and let the same existing Render service redeploy. Do not merge PR #59 or this performance PR as an implicit release action.
