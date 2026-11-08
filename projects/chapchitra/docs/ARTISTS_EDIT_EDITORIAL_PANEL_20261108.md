# CHAPCHITRA — Artist's Edit Editorial Customization Panel Redesign

Repository: SaamVR/WebAnimation. Starting point: draft PR #66, source SHA 631d33958d931b999e0305411204aa9b59141fd5. Page: /artists-edit/. Scope: ONLY the manual customization panel below the illustrated worktable. Preserve existing standalone Render review service; keep all draft PRs unmerged.

## Design correction

The original customization row used four bordered fieldsets, tiny generic chips, Georgia/system-ui headings and an undifferentiated upload form. The update keeps native semantics but removes the generic visual borders in favor of a restrained editorial layout matching CHAPCHITRA's existing approved brand.

Canonical brand values come directly from src/styles.css; that file is not modified:
- Gallery White #F6F7F5 on the primary panel, Warm Beige/Cream for a single refined artwork-management surface, Press Green #293D2D for selected options and the primary upload action, Terracotta #8A503B only as a restrained heading accent.
- Noto Serif Bengali for the large editorial heading and the four numbered group headings; Hind Siliguri for labels, controls, disclaimers, feedback.
- Editorial heading "Customize your print" with an understated supporting line; four numbered, visually unbordered native fieldsets and accessible legends.
- Garment Style: Regular Tee, Drop Shoulder, Full Sleeve, Hoodie. Size: S, M, L, XL, XXL. Fabric Color: Black, White, Red, Yellow, Blue, Green. Print Size: A3, A4.
- Fabric colors are visible named buttons with circular 24px pigment swatches. Each swatch uses the ALREADY APPROVED independently calibrated fabric colors: black #222629, white #ffffff, red #DE1F30, yellow #F3C916, blue #145FCE, green #087B47. Original illustrated paint-pot colors and their immutable PNG/SVG assets are completely unchanged.
- A distinct, quiet cream-toned "Artwork tools" row contains the original primary Upload Artwork button, artwork-size slider with live percentage, Reset Placement and Remove Artwork secondary actions. Functional disabled states, native chooser and all artifact checks remain.
- The production printing disclaimer is preserved verbatim.

## Layout and accessibility

Four-column desktop (>1100px), balanced two-column tablet (601–1100px), stacked single-column mobile (≤600px). All 17 manual-option buttons have at least 44px of hit height at 320px. Page has no horizontal overflow. Selection remains clear in normal, selected, hover, disabled and keyboard-focus states; strong pressed colors provide readable labels without relying only on circular pigment swatches.

The exact same existing worktable state is reused: the original worktableReducer, paintSelection, buttons click handler, aria-pressed and aria-live status. A panel selection changes the illustrated selection and garment/size/print/pigment immediately through the original update path. A stage illustration click likewise changes the selected panel button; one choice per group remains active. The original screen-reader announcements are still polite. The original responsive choice to hide microscopic illustrated hotspots on very small mobile screens is retained; the manual controls remain available.

Native image upload, PNG/JPEG/WebP validation, image positioning and resizing, reset/removal, original SVG upload hover/float, alpha-silhouette artwork glow and elevations, atomic color switching and original calibrated rich fabric colors are strictly preserved.

## Source confinement

Only worktable-studio.mjs panel markup and editorial group/button presentation, worktable-studio.css panel rules and panel-specific reduced-motion selector, and added source/browser QA and evidence files changed. src/styles.css, src/worktable-fabric-pigments.mjs, all 43 source PNG layers, responsive WebP manifest and variants, supplied upload SVG and all unrelated website pages including C01 and THREADS are unchanged.

## Genuine browser comparisons and screenshots

All images are actual Chromium/browser page captures, not generated mockups. Before source = PR #66 SHA 631d3395...; after source = this draft PR.

- [Desktop 1440px before/after](performance-evidence/editorial-panel/before-after-desktop.webp)
- [Tablet 834px before/after](performance-evidence/editorial-panel/before-after-tablet.webp)
- [Mobile 390px before/after](performance-evidence/editorial-panel/before-after-mobile.webp)
- [Desktop selected Hoodie / XL / Red / A3](performance-evidence/editorial-panel/desktop-selected-editorial.webp)
- [Tablet selected state](performance-evidence/editorial-panel/tablet-selected-editorial.webp)
- [Mobile 390px selected state](performance-evidence/editorial-panel/mobile-selected-editorial.webp)
- [Mobile 320px selected state](performance-evidence/editorial-panel/small-mobile-selected-editorial.webp)

The capture script temporarily hides only the site's approved sticky header during isolated panel screenshots to prevent a cropped element-scrolling overlay. The application header itself is unmodified.

## Independent original artwork fidelity QA

Compared before/after direct browser screenshots of the illustrated stage at 1440×810, with the same selected state and settled animation:
- Resting Regular Tee / White: exactly ZERO differing pixels.
- Selected Hoodie / Red: RGB mean absolute difference 0.0000337/255 across 1,166,400 pixels; just ONE pixel differing by more than 2/255.
- Original 40 image-layer stage children, 4 selected illustrated states, and complete colored canvas are identical. No stage art, color, shadow, mask or upload SVG change.
- [Raw stage-fidelity report](performance-evidence/editorial-panel/stage-fidelity-report.json).

## Browser QA and release gate

The dedicated browser suite tests real Chromium and WebKit desktop/tablet/mobile and Chromium 320px, every selected option, font/brand tokens, responsive columns, calibrated swatches, all 17 buttons' aria-pressed semantics, selected exclusivity, panel-to-stage / stage-to-panel synchronization, keyboard navigation, visible focus, touch target heights, native file chooser, actual PNG image upload/resize/reset/remove, polite announcements, original production disclaimer and zero overflow. [Machine-readable dedicated QA report](performance-evidence/editorial-panel/panel-browser-qa.json).

All automated test lanes passed on the isolated candidate:
- **99/99 Node/source tests** validating exact paint-pot source colors, rich pigment engine, approved animated upload and new semantic panel.
- **768/768 dedicated editorial-panel browser assertions** across Chromium/WebKit at desktop 1440px, tablet 834px, mobile 390px and narrow mobile 320px. Each group exclusivity, typography, four/two/one responsive columns, 17 accessible buttons, circular calibrated fabric swatches, both directions of stage/panel selection, native file chooser, actual image upload/resize/reset/remove, 44px touch height, keyboard Enter, visible focus, screen-reader announcements, reduced motion and no horizontal overflow.
- **302/302** original 24 garment/color and atomic rapid-switch/no-white-flash browser assertions.
- **735/735** exact fabric alpha-mask/pigment assertions on Chromium/WebKit desktop, Retina tablet and mobile.
- **102/102** original illustrated physical-button hover/focus/elevation assertions.
- **168/168** persistent selection/glow and manual-switch/deferred-hydration assertions.
- **95/95** original animated Upload Artwork SVG native-chooser/touch/keyboard assertions.
- **35/35** original general browsing/responsive/print-artwork functionality checks.
- **PASS** on deliberately slow/failing image hydration: old fully prepared preview retained on asset failure.
- [Machine-readable aggregated regression outcomes](performance-evidence/editorial-panel/regression-summary.json).

### Controlled paired cold-cache first-frame performance

The same headless Chromium Linux runner with simulated 70ms RTT, one comparison pair repeated twice; these are **not physical iPad** performance numbers.

| Profile | Previous first display average | Editorial panel first display average | Delta | Worktable images |
|---|---:|---:|---:|---|
| Desktop 1440px / 10Mbps | 1.6305s | 1.6955s | +65ms | 39 requests, **771,756 bytes unchanged** |
| Mobile 390px / 4Mbps | 2.3855s | 2.2765s | -109ms | 40 requests, **283,792 bytes unchanged** |

The 2-run desktop results [before 1.610 / 1.651s, after 1.812 / 1.579s] illustrate runner variability: average +65ms, not a meaningful regression. All tested first-useful frames remain under 3 seconds. Full layer hydration averaged desktop **3.201 → 3.224s**, mobile **4.0475 → 3.956s**. Browser resource entries show zero added WebP image requests and no change in image transfer bytes. The panel adds only modest HTML/CSS/DOM complexity and no image, GSAP or Lottie dependencies. The detailed [machine-readable paired performance report](performance-evidence/editorial-panel/performance-comparison.json) preserves each individual trial.

GPU/OS-level and physical iPad RAM are not measured. Only browser-visible timings and image network transfer are claimed.

## Independent Creative Direction verdict

CONDITIONAL PASS for owner visual review upon successful final browser checks and live Render deployment. The updated panel now follows CHAPCHITRA's editorial, restrained print-studio identity with a legible hierarchy and properly integrated colors and tools, without touching approved worktable rendering. Subjective design acceptance and physical iPad Safari/Chrome remain the owner's final gate.

All existing draft PRs must remain unmerged. Do not touch C01 Connected Service Benefits or other website pages. Stop after existing Render review deployment and request owner visual approval.
