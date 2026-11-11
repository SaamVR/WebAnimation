# CHAPCHITRA — Artist’s Edit in-desk turn and Regular Tee back registration

**Source baseline:** `5397801fe04af8b653ecb5f6103e3fd3f5deeb50`
**Scope:** CHAPCHITRA standalone only. **Draft; visual approval pending.**
**Request:** Three targeted owner corrections from the annotated screenshot and physical-iPad video supplied November 12, 2026.

## Correction 1 — Front/Back control

- Move the existing accessible `View back / View front` button from `stage.after(viewRow)` to `stage.append(viewRow)`.
- Absolute-position the existing control at the horizontal center of the wooden stage, near the lower open wood below the hem.
- Remove the separate cream footer strip. Retain the original flip transition, reduced motion, per-side uploads and settings, state protection, keyboard and touch.
- For tablet/mobile: retain a **44px hit region** while reducing only the visible control surface as the lower wood strip narrows. Small mobile uses the icon with the complete accessible name. No garment or illustrated-stage scaling was changed.

## Correction 2 — Regular Tee back registration

**Observed problem:** almost-transparent export debris expands the native alpha bounds and shrinks the visible back under the originally fitted stage box.

- Owner's supplied **original PNG**: 4000×2250 RGBA; unchanged and SHA256 pinned `4dfe2de4a4cca7a1730a801bb59d4bbf29cfa60a4ca82d0868d7ac673400aa24`.
- All-nonzero alpha: approx `(1009,245)–(2972,2224)`; **alpha >12 silhouette**: `(1134,375)–(2860,2081)` in native source coordinates.
- Crop for optimized Regular Tee variants: `[1122,363,1750,1730]` with **12 source-pixel antialias margin**.
- Registered worktable stageBox: `[572.8752,178.1472,900.2016,889.9136]`.
- Derived using original approved Regular Tee front alpha bounds and a **single uniform scale** based on the front visible height. This is not a CSS scale hack and does not change the stage, front garment, other three backs, A3/A4 guides or artwork editing.
- Regenerated the three responsive Regular Tee back WebPs (768/1536/2560) and the manifest entry only. Existing decoded-WebP crop-to-reencode alpha matches **exactly, 0 mean / 0 max alpha difference**. Mean RGB change is below **0.5 levels/channel** against the previously delivered pixels.
- The three regular variants together change from **183,578 to 192,456 bytes (+8,878)**, requested lazily on first Back view, not on initial Front load.

### Measured public-baseline vs corrected local browser (same 1440px viewport)

| Worktable design-space bound | Before | After |
|---|---:|---:|
| Regular Tee back visible width | 758.65 | 886.82 |
| Height | 749.63 | 876.53 |
| Top | 245.31 | 184.82 |
| Horizontal center | 1025.34 | 1022.97 |

The approved front is approximately 923.65 wide × 877.57 high with top 184.32. The corrected back matches collar, hem and center to within a few stage units, with natural source shape preserved.

## Correction 3 — Persistent iPad navbar gap: OPEN

**Do not claim a physical-iPad fix.** The supplied real iPad Chrome recording shows the wooden stage exposed above the navigation during scroll. The video does not include `visualViewport` or DOM measurements, and we cannot attach a developer inspector to that device here.

Source inspection: `#app > .site-header` is native `position:sticky;top:0`, the announcement is a normal-flow sibling, root overflow is visible, no scroll-transform compensation is installed. The project already exposes `?navdebug=1` to measure `header.top`, announcement position, `visualViewport.offsetTop` and the topmost DOM element **on a physical iPad**.

Relevant **possible WebKit causes, not confirmed diagnoses**:

- https://bugs.webkit.org/show_bug.cgi?id=297779 — iOS 26 scroll-direction / viewport offset reports, sticky/fixed elements affected.
- https://bugs.webkit.org/show_bug.cgi?id=301172 — WebKit fixed/sticky positioning drift in standalone iOS contexts.
- https://bugs.webkit.org/show_bug.cgi?id=300523 — reported iOS 26 viewport recalculation errors.

A speculative top offset, fake overlay, negative margin, forced transform or repeated scroll-correction loop was **not** added, because it could make the bug worse or conceal it without fixing the layout. The physical next gate is a `?navdebug=1` trace during the visible gap using **Capture and copy iPad measurements**. The report remains local to the browser until manually copied.

## Focused regression evidence (development checkout)

- Full CHAPCHITRA build: pass, including all source tests.
- Existing two-sided editor: **54/54** pass, four garments and six colors.
- Existing desktop/tablet/mobile editor: **137/137** pass.
- Touch gestures: **14/14** pass.
- WebKit selection states: **6/6** pass.
- Responsive view-control geometry: **16/16** pass (desktop, WebKit landscape/portrait tablet, mobile Chromium).
- Regular back before/after dimensions: **5/5** pass.
- Pixel alpha fidelity: **3/3 responsive variants exact alpha**.
- Site-wide scrolling diagnostic in **Chromium + WebKit**: **117/117** measured scroll states; `visualViewport.offsetTop=0` in emulation; **not physical iPad confirmation**.
- All four garment front/back transitions recorded in Chrome with **zero runtime errors**.

## Scope and release gate

No modifications to C01, C05/C06, C08, THREADS, other repositories, `main`, or approved front garment assets. Render review branch must be verified immediately before fast-forwarding; draft PR remains unmerged. A public review may be released with the first two corrections clearly marked **technical PASS**, but **navbar is still open** until real-device trace and verification.
