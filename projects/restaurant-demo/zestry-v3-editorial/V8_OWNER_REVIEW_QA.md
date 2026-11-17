# ZESTRY V8 — Owner Feedback QA (2026-11-18)

**Scope:** SaamVR/WebAnimation / projects/restaurant-demo only.
**Review branch:** feat/zestry-v8-editorial-fixes-20261118.
**Deployment:** NOT DEPLOYED. Existing Render public service remains unchanged pending explicit approval.

## Six owner corrections
1. F05 fits one window: Book canvas, illustrated navigation and close button now scale together from both iframe width and height, with sticky-header clearance. No fixed oversized min-height.
2. No persistent click box: Pointer-triggered buttons are blurred; no rectangular yellow focus overlay. Keyboard focus keeps a circular accessible focus-visible ring.
3. Food photograph/card contained: Single dish page is inset within right page's gold boundary. Category heading remains unobstructed. Original F05 dotLottie unchanged.
4. Repeated dining/reservation material removed: Former table photo and request-a-table section replaced with distinct Order & Pickup story; F07 remains dedicated reservation-story section.
5. Hero blob: Asymmetrical curved SVG clipping path around original F01. No changes to animation vectors or keyframes.
6. F04 visible and functional: Order & Pickup section preview plus original simulated checkout confirmation. Runs once and holds its final frame.

## Chrome QA — five viewport sizes
| Viewport | Header bottom | Book frame top–bottom | Horizontal overflow | Controls clipped |
|---|---:|---:|---|---|
| 1818×828 | 77 | 110–824 | No | No |
| 1440×900 | 77 | 110–870 | No | No |
| 1024×768 | 77 | 110–764 | No | No |
| 390×844 | 66 | 108–558 | No | No |
| 320×690 | 66 | 108–558 | No | No |

The QA used instant scroll-to-anchor to evaluate the final target rather than the intermediate smooth-scrolling position. All illustrated navigation and close hitboxes are inside the iframe. No JavaScript page errors or failed asset requests in the full browser integration run.

- F05 displayed a real Main Course photo with title/price inside the page.
- Clicking Next did not leave any persistent rectangular focus indicator.
- F04 preview loaded 240 native SVG frames, loop disabled.
- Bag → sample checkout → F04 confirmation overlay rendered its 240-frame SVG and showed Sample order received.
- Four categories and four unique dish leaves each preserved (16 items).
- F01, F03, F05, F07 approved source checksums were asserted before and after packaging.
- F06 continuous cooking remains; F08 remains excluded.

## Immutable master SHA-256 values
- F01 JSON: 7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37
- F03 JSON: 136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68
- F07 V5 JSON: a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b
- F05 original dotLottie: 3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645

## Release policy
Owner creative approval is still required. No Lottie source artwork, animation timing or vector layers changed. The migration script apply_owner_layout_v8.py is intended as a strict one-time patch from the verified V7 bundle; do not apply a second time to a V8 package. Existing Render build command and service configuration untouched. Only deploy after explicit owner request.