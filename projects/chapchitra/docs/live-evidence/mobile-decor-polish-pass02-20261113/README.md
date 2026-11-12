# CHAPCHITRA — Artist's Edit mobile decorative refinements, Pass 02

**Source of truth:** owner-annotated screenshot (November 13, 2026). Four intentionally narrow updates to the existing independent mobile decoration/price-tag presentation.

## Genuine browser screenshots

- [Before versus After at 390 CSS px](before-after.png) — side-by-side comparison, prior Pass 01 vs Pass 02
- [390px Chromium — BEFORE Pass 02](chrome390-before.jpg)
- [390px Chromium — AFTER Pass 02](chrome390-after.jpg)
- [390px WebKit — AFTER Pass 02](webkit390-after.jpg)
- [320px narrow phone — AFTER Pass 02](chrome320-after.jpg)
- [430px larger phone — AFTER Pass 02](chrome430-after.jpg)

**Provenance:** Chromium/WebKit Playwright screenshots of the existing Render site `ab9018d13a0ce2d1c5d9f1376e97b0456cc65d07`; BEFORE substitutes the previous PR #100 candidate `worktable-mobile.mjs` from `be255e876217b8fe5f5816b150e9b683f347c4f9`; AFTER substitutes this updated PR #100 candidate's `worktable-mobile.mjs` and `worktable-studio.css` before page load. These captures are **not claims of live staging deployment**. No images were generated or redrawn. Screenshot labels in the side-by-side are overlays for review only.

## Position and scale deltas

| Piece | Prior pass | Pass 02 | Preservation |
|---|---|---|---|
| Total tag | `left:70%;top:6%` | `left:67.5%;top:4.5%` | Existing 32%-width tag, rotation, content and price calculation |
| Lamp | `left:71.5%;top:18%` | `left:74%;top:16.5%` | Existing 24%-width crop and horizontal mirror; lamp light faces shirt |
| Brush pot | `left:40.5%;top:12%;width:15%` | `left:38.5%;top:12%;width:15.75%` | Original asset and orientation; exactly 5% increase relative to prior 15%-width crop |
| Pencil | `left:5%;top:27%` | `left:5%;top:25.5%` | Original pencil angle and 23%-width crop |

The plant, swatches, ink jar, entire garment/worker composition, front/back button, five mobile navigation buttons, popups, zoom, prints and pricing are unchanged. The price-tag CSS change is located entirely in the `@media(max-width:600px)` rule.

## Verification

- **121/121 passing focused browser geometry checks**, zero page errors/HTTP failures, from Chromium 320/360/390/430, WebKit 390, iPad WebKit 834 and desktop Chromium 1440.
- Each mobile viewport measured lamp direction and position, brush pot’s exact +5% width, pencil position, Total tag position and non-collision between lamp and tag; lamp stays within table edge.
- Exact original frame/stage/shirt/nav/flip/plant/swatches/ink registration compared for each paired before/after browser capture; desktop and iPad unchanged.
- Initial 5 pencil positioning test assertions used a sub-2px tolerance that ignored the stage’s existing border inset. Those assertions were corrected to 2.2px against actual DOM geometry and the full browser matrix re-ran successfully.
- Existing CHAPCHITRA GitHub Actions source/build/functional suite must pass on the final commit; physical iPhone Safari not tested.

**Integration:** owner visual review before stage release. The one permanent staging site and all owner-approved C02/C-series motion remain unmodified by this feature branch.
