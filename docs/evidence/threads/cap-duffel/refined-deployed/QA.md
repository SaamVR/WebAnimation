# THREADS — Reference-matched cap scale + f3 square-frame re-verification

**Status:** Updated in isolated Render gallery-review preview; awaiting owner's visual approval.

## Live preview
https://threads-final-gallery-replacement.onrender.com

Source commit: `e86f9911ba869020efc750d766421c68ad7c02d8`. Render static review service `srv-dbeithnavr4c73b2qbng`, live deployment `dep-dbeldj5g1s2s73fvnm50`. Auto-deploy off; existing review service reused without provisioning any additional paid resource. Production and approved T01/T02/T04 previews not modified.

## Scope and findings

- Prior 4%-gutter cap correction was valid but left the three replacement covers at **~92.6% silhouette occupancy** of image width, versus **~97%** for unchanged reference hats. This can explain the owner's perceived smaller caps despite passing basic rendered-width tests.
- The `f2` Sunburst Baseball Cap, `hat-01` Sky Blue Two-Tone Cap and `hat-04` Sunshine Monogram Cap were fitted to the **median occupied bounding-box ratios** measured from unchanged `hat-02`, `hat-03`, `hat-05`, `hat-06` independently for cover, front, profile and rear angles.
- New cap cover occupancy: **~97.1% width, ~96.0% height**, matching untouched reference hats. View-specific occupancy targets also match reference front/profile/rear photographs. Cropping/padding only changes the transparent canvas; it does not resize or distort the photographs.
- All 12 re-framed owner photographs retain **every alpha value and every visible RGB pixel exactly**, independently verified against preceding Git commit using Pillow/NumPy. Brims, upper buttons, and all naturally cast shadows remain intact. Lossless WebP encodes the adjusted transparent canvases. No generated photos, product substitutions or CSS zoom.
- The asset-bound recipe at `scripts/threads_cap_padding_trim_20261025.py` reads unchanged reference assets and is verified **idempotent**.
- Existing Homepage, Shop/Search cards, Product Detail main image and gallery thumbnails all continue using `object-fit:contain`.
- The Orange Weekender Duffel `f3` code, gallery images and order were **not edited** in this refinement. Its existing scoped fixed `aspect-ratio:1/1` media frame remains valid with `object-fit:contain`: four views remain square and stable; nearby details do not move. Other product galleries untouched.

## Fresh public-preview QA

- **50/50** source/contract tests.
- **89/89** cap and f3 visual measurements in real Chrome desktop, Chrome mobile and Ubuntu Playwright WebKit at an iPad-sized 820×1180 viewport. All 12 cap gallery views decode and contain; cap card sizes compared against unchanged `hat-02`; all four f3 images preserve the same square frame and adjacent text placement.
- **89/89** additional catalog/gallery/storefront public-browser regressions.
- **7/7** public T01 Spotlight Search / T02 real-cart flight regression checks.
- **69/69** public T04 simulated-checkout steps and payment-overlay regression checks.
- **0 browser JavaScript errors** across those tests.
- Public replacement cover asset served HTTP 200 with updated owner-photo bytes. The production service was not updated.
- **iPad Safari limitation:** connected device test used Playwright Linux WebKit in an iPad-sized viewport. This does **not** establish physical iPad Safari browser/keyboard correctness; owner device visual check is still required.

## Evidence

- [Real public-browser video: revised cap detail pages and all four f3 angles](cap-and-duffel-visual.mp4)
- [Four real Shop cards side by side on desktop: revised f2 / hat-01 / hat-04 / unchanged hat-02](desktop-four-cap-scale-compare.png)
- [Four cards compared in iPad-sized WebKit](ipad-webkit-four-cap-scale-compare.png)
- [New Sunburst product detail](cap-sunburst-detail.png)
- [New Sky Blue product detail](cap-sky-blue-detail.png)
- [New Sunshine product detail](cap-sunshine-detail.png)
- [Unchanged reference hat detail](cap-reference-unchanged-detail.png)
- [Homepage cap presentation](homepage-cap-scale.png)
- [Shop/Search cap presentation](shop-sunburst-cap.png)
- [Orange Duffel cover frame, desktop](chromium-1440-f3-angle-0.png)
- [Orange Duffel fourth angle, desktop](chromium-1440-f3-angle-3.png)
- [Orange Duffel fourth angle, iPad-sized WebKit](webkit-820-f3-angle-3.png)
- [Precise output dimensions and silhouette fill ratio report](cap-reference-metrics.json)
- [Browser visual checks](QA-browser.json)

Four-up comparisons were produced in a QA browser by temporarily filtering the *original rendered Shop cards* with their existing CSS; the storefront was not modified to display that comparison fixture.

## Protected code

- T01 Git blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`, unchanged.
- T02 Git blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`, unchanged.
- T04 Git blob `790088849cc646ffec4553a77cf25a56ff5b0e78`, unchanged.
- Static T03 remains on hold; `SaamVR/EcomCMS` untouched.
- PR remains draft/unmerged until visual approval.
