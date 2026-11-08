# CHAPCHITRA — C08 Final Animated Roller Logo Integration

**Owner approval:** C08 Version B / Wordmark Reprint / −90°; the uploaded creative package is final. **Website integration is REVIEW ONLY** until owner visual approval.
**Repository:** `SaamVR/WebAnimation`, `projects/chapchitra/`.
**Base:** isolated CHAPCHITRA Render review commit `a42fe4fed6fb11a1bf614f04a0eb501fb87c5846`.
**PR branch:** `feature/chapchitra-c08-wordmark-reprint-20261108`.
**Scope:** Homepage Hero Slide 1, global navbar hover, reusable C08 modules. Footer remains untouched; Artist's Edit and C01 are unchanged.

## Original asset integrity / formats

| Item | Property |
|---|---|
| Approved original C08 Lottie JSON | `src/assets/c08/wordmark-reprint-original.json` |
| SHA-256 | `e3887a7187f845099a4948c3a8a3ff2b85dc650b381635cc6db5e3aa68d33876` |
| Approved master SVG | `src/assets/c08/approved-master-source.svg`; SHA `093b1d63ce8e572caa9f605cf1c786f174a2b3505d228b7279d51982c63cd4a3` |
| Original dotLottie | `src/assets/c08/wordmark-reprint-original.lottie`; SHA `ed802b1986075d88862020206d23175a8a707454b4ad11c165ed5698eb4a5898` |
| Composition | 2400×550, 60fps, 240 frames, exactly 4.0 seconds |
| Layers | ROLLER_ASSEMBLY_MASTER, ROLLER_HANDLE_ROD, ROLLER_CYLINDER, HIDDEN_T, PRINT_REVEAL, BASE_WORDMARK |
| Embedded raster media | None |
| dotLottie manifest | autoplay=false, loop=false, speed=1; −90° turn encoded in original JSON keyframes |

Only Version B **Wordmark Reprint (−90°)** is integrated. No Ink Refresh, +90° alternative, reconstructed logo, retimed easing, or edited vector paths.

**Independent official playback verification:** lottie-web SVG player v5.13.0 rendered the original JSON at frames 0, 30, 60, 100, 140, 180, 210, 239 with no browser JavaScript exceptions. Compared the eight rendered poses with the supplied 60fps reference video and storyboard; composition, roller orientation/travel and returned final logo match the approved concept. Pixel-perfect equality is not claimed because the supplied reference video is raster/codec rendered separately, whereas the website uses the authoritative JSON through a browser SVG engine. Source vectors and all keyframe arrays are byte-identical.

## Exact palette adaptation

Dark navbar reuses the **byte-identical source JSON**, preserving original Graphite `#232323`, Press Green `#293D2D`, and off-white roller details.

Hero uses `src/assets/c08/wordmark-reprint-hero-light.json`, generated reproducibly by `scripts/c08-build-colors.py`. The theme changes **only static fill colors**, verified by complete reverse comparison with original JSON:

- 21 graphite fill occurrences: `#232323` → Cream `#E4E3DE` (owner's suggested wordmark color).
- 6 dark Press Green fill occurrences: `#293D2D` → light green `#9DC39F`, sampled from the website's **existing approved light-logo raster**, to preserve legibility against Deep Forest.
- Existing off-white roller detail stays untouched. No blanket filters, opacity/geometry changes, or raster approximation.
- Confirmed `w`, `h`, `fr`, `ip`, `op`, layer order, shape vertices and keyframe arrays identical after removing only the two palette conversions.

## Hero Slide 1

The original approved hero currently contains a **full textile symbol above the custom wordmark** in `/assets/chapchitra-full-on-dark.webp`. The supplied C08 Lottie animates the wordmark and roller only. To **preserve the existing complete centered hero lockup without inventing symbol animation**, keep the existing full-logo static image in its original flex position and dimensions; position the Lottie on its lower wordmark region only. Once the SVG renderer is ready, the original upper textile symbol stays in place; only the raster's lower 27% is clipped while the original C08 wordmark takes its place. The SVG canvas uses its 2400/550 aspect ratio and content-fitting scale. Measurements show the hero image and overlaid stage have **identical bounding boxes** on desktop, iPad/tablet and mobile.

The original full lockup is visible immediately during loading. Initial homepage C08 playback autostarts **once**, upon ready, without blocking regular page rendering. On completion it holds original frame 239. Desktop pointer-enter once per entry triggers replay (never repeatedly while hovered). On coarse-pointer/touch, tapping the hero logo replays; an accessible replay button also supports keyboard activation. The existing carousel's 4-second timer begins only after the 4.0s logo animation has completed, preventing an autoplay transition from cutting it off; manual hero navigation is not removed.

## Global navbar, footer, reduced motion

The navbar retains the original image link to Home, exactly centered by the existing three-track header. No C08 animation instance is constructed on page load. A desktop mouse hover lazily starts one dark original Lottie playback, holds the final image while hovered, and requires pointer exit/re-entry for a new replay. Touch clicking the navbar follows `href="/"` without starting the Lottie. The navbar behavior is also validated on /shop/ and /artists-edit/; there is no eager C08 player or JSON request on those pages.

The footer still uses `/assets/chapchitra-wordmark-light.webp` statically, with **zero** C08 instances. The logo's SVG rendering is aria-hidden and the hero replay control is accessible. Reduced-motion displays the original full hero and navbar static logos without initializing C08 Lottie, and dynamic preference changes are handled. The SVG renderer is loaded from the **existing C01 self-hosted** `/motion/c01/vendor/lottie.min.js` runtime and shared with C01: only **one** script instance was observed in Chromium/WebKit at 1408/834/430/320 widths, including when C01 is visible. The C01 assets/source/timing remain unchanged.

## Quality gates and evidence

- **C08 specific source tests:** original and derivative source hashes/metadata/keyframes/color mapping pass; C08-only layout and accessibility boundaries pass.
- **Combined repo tests:** 112/112 passed, including the pre-existing 106 CHAPCHITRA/Artist's Edit/C01 tests.
- **Chromium functional QA:** 25/25 checks from source run, expanded with single-script assertion for 26/26 in final QA.
- **Windows WebKit:** 20/20 checks at desktop/tablet/mobile; verified hero autoplay without navbar autoplay, responsive logo position, single shared player script, holding final frame, navbar hover, static footer and reduced motion.
- **Touch:** Playwright coarse-pointer emulation passed hero tap replay and navbar Home navigation.
- **Global navbar:** initial static then hover-once verified on /shop/ and /artists-edit/ without eager runtime.
- **Carousel:** confirmed Slide 1 stays during C08 autoplay, then advances after the unchanged 4-second interval.
- **No cross-project code changes:** C01, Artist's Edit worktable and other homepage animations remain untouched.

### Review files

- `docs/c08-evidence/c08-hero-autoplay-navbar-static.webm` — first homepage animation; navbar stays static.
- `docs/c08-evidence/c08-navbar-hover-reprint.webm` — original dark navbar wordmark hover animation.
- `docs/c08-evidence/c08-hero-autoplay-then-hover-replay.webm` — hero replay on desktop.
- `docs/c08-evidence/c08-hero-mobile-tap-replay.webm` — hero replay on touch profile.
- `docs/c08-evidence/c08-hero-final-desktop.png`, `c08-navbar-hover-desktop.png`, `c08-hero-final-430.png`, `c08-footer-static.png`, `c08-reduced-mobile.png` — visual states.
- `docs/c08-evidence/c08-browser-qa.json`, `c08-webkit-qa.json`, `c08-performance.json` — machine-readable QA.

### Performance qualification

The existing static hero and navbar are retained with high-priority initial image loading; C08 adds about 2.9 KB of scoped CSS, 11.2 KB of on-demand control JS and about 72.6 KB of hero vector JSON. Original dark JSON (~71 KB) loads **only upon navbar hover**. Reuses installed lottie-web, no extra player/vendor package and no runtime dotLottie dependency.

An exploratory **single-run, uncompressed local Python static server** comparison under simulated 4 Mbps + 70ms RTT + 4× CPU (430×900 Chrome) gave:

| Metric | Previous C01 review | C08 integration |
|---|---:|---:|
| DOMContentLoaded wall time | 1232ms | 1182ms |
| First-contentful paint | 2412ms | 2316ms |
| Initial transfer after 1.6s | 723106 B | 738611 B |
| Original full static hero/nav images available at 1.6s | Yes | Yes |
| Cold C08 hero player ready after navigation | N/A | 4960ms |

These are **not statistical performance improvements**, not a public Render CDN benchmark and not a physical-iPad result. They do substantiate that C08 does not delay first static rendering and avoids duplicate heavyweight players. Hardware iPad/Safari owner visual approval is required.

## Release boundary

**C08 is a separate draft PR.** Publish only to the existing isolated Render review branch, preserving concurrent Artist's Edit and approved C01. Verify the live SHA and browser playback; stop for owner visual approval. **No merge, no production publishing, no changes to THREADS, EcomCMS or other projects.**

## Post-deployment review correction — versioned Artist's Edit navbar

A real public Chromium review detected `HTTP 404` for `/releases/<build>/motion/c08/logo-player.mjs` on the Artist's Edit route because that route deliberately loads a version-pinned copy of `app.mjs`. The worktable itself was ready and unaffected. C08 now imports its *unchanged* module from the canonical `/motion/c08/logo-player.mjs` root path on both the homepage and non-home routes. The C08 module idempotently loads its own scoped `/motion/c08/logo-player.css` only if the versioned page did not already include it. This preserves the frozen Artist's Edit app, C01, the original Lottie assets, and the navbar Home link. New source regression test covers both route styles; retest the public versioned artist editor after the deployment.