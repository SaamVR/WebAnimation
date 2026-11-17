# CHAPCHITRA Hero 01 — Exact Illustrator tear and diffused Mushroom Grey shadow: creative QA receipt

**17 November 2026 — owner review only.** No merge, staging write, production deployment, preview deployment or unrelated project changes were performed in this correction. PR [#113](https://github.com/SaamVR/WebAnimation/pull/113) was **already merged independently on 16 November 2026**, so its open state cannot be restored; the unmerged correction is submitted as draft [#118](https://github.com/SaamVR/WebAnimation/pull/118).

## Source fidelity and implementation

- Original attached file: `torn_paper_V.svg`, Illustrator 24.1.2, original source byte SHA-256 **`59e41fb28ec39c3d1a539c4a53ca42e46b10dd27f01f96e16892088e80851f5b`**, one `<path>` containing **45,667** characters of unmodified `d` data, path data SHA-256 **`64125d0490d2ab91cc205747e67d8758a01a327ca2270dc16c25918c2f9c21cd`**.
- Authoritative repo master already stored at `projects/chapchitra/assets/hero01/torn_paper_V.svg`; exact `HERO01_TORN_PAPER_PATH` in `projects/chapchitra/src/app.mjs` was independently compared against both the user upload and repository master, **byte-for-byte equal**. `viewBox="0 381 4200 812"` presents the original paper silhouette at the approved depth without editing path commands.
- Replaced the earlier **crisp duplicated translated shadow path** with **one original paper path**. Gallery White fill `var(--color-gallery-white)` resolves to `#F6F7F5`. `#hero .hero01-paper-edge` now uses **`filter:drop-shadow(0 4px 5px color-mix(in srgb,var(--color-mushroom-gray) 36%,transparent))`** following native alpha contours, using approved Mushroom Grey `#A6A29B`. Computed `box-shadow:none`. No fiber strokes, textures, grain, new paper layers or outlines.
- Original combined illustrated logo uniform **90% scale**, navbar, type, slider, C08 integration and all other animation source unchanged.

## Focused checks actually performed

1. Source contract `projects/chapchitra/tests/hero01-header-contract.test.mjs` was executed against exact GitHub file contents with an **isolated V8 Node-assert-compatible adapter**: **9/9 PASS, 0 FAIL**. This does NOT claim a native Node test runner or full app build; the test file's original assertions were exercised, without reinterpretation, against fetched source paths.
2. `scripts/hero01-header-qa.mjs` ESM top-level async script was syntax-parsed in the V8 isolate **PASS** after stripping its import declarations. Runtime Playwright on the full site **NOT_RUN**; external device connection to the source checkout was unavailable. Script was updated to demand one original path, an alpha-following CSS drop-shadow, and produce completed Hero 01 stills plus desktop / 834px iPad-width edge close-ups.
3. **Actual local Chromium browser — isolated artwork only** at **1440×520 desktop** and **834×520 iPad-width emulation**. Browser page content was generated directly from the exact original owner `d` path and the same resulting production SVG/CSS shadow declarations (no reconstructed geometry). Chromium DOM computed: **one SVG**, **one path**, `fill: rgb(246, 247, 245)`, `filter: drop-shadow(color(srgb 0.65098 0.635294 0.607843 / 0.36) 0px 4px 5px)`, `box-shadow: none`; native path V bounding-box bottom **1185.9277496**. All checks passed.
4. Genuine isolated Chromium PNG output — actual screenshots (not image-generated). Four local ChatGPT artifacts with SHA-256:
   - desktop isolated tear and shadow (1440px): `f468d2ef6adc092b2e9054bdcb56d231aa87a809da07cabdee979905892a7d4b`
   - desktop isolated edge detail: `5217a4b441078d94519e0b34a9c09779e67511d69e9a9c71fee3279fa063070d`
   - iPad-width isolated tear and shadow (834px): `743871c3826fe6aaa65b0dfe43f910db202357ef1cec169bcf3152609e075088`
   - iPad-width isolated edge detail: `fabf5f01fcd5eaf96fc677eb84338545af6bec1d445ebd5883cef8cc467c4778`

**Critical limitation:** These four images **are not complete site Hero 01 screenshots**: they contain only the actual owner SVG and its browser-rendered background/shadow without the approved navbar, full lockup, C08 animation, typography, slider or C02 navigation. Do not submit them as complete composition or creative signoff. The exact production app's desktop and iPad-width **full-Hero screenshots remain NOT_CAPTURED**; browser QA on that site, WebKit/iPad hardware QA and independent creative director approval are **NOT_OBTAINED**. Do not reuse prior merged #113 screenshots to claim current #118 CSS behavior.

## Review/merge gates

- Draft #118 remains **OPEN, UNMERGED** against `deploy/chapchitra-render-review`; the base has advanced independently since merged #113, so conflict/rebase and combined-site QA belong to the serial Integration Owner.
- First safe follow-up: execute `npm ci`, source tests, local Next-free static preview, then `node scripts/hero01-header-qa.mjs` in the **actual full Chapchitra site** with both desktop Chromium and iPad WebKit and inspect **C08-complete** hero, two close-ups, carousel and navbar after scroll. Require complete screenshot files with source commit SHA and visual review.
- **Deployment: NONE**, per no-automatic-preview owner directive; no new hosted URL.
