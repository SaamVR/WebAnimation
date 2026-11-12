/**
 * CHAPCHITRA — illustrated price tag registration (editable presentation only).
 *
 * Owner's revised source: Price_tag(2).png (2048x1152 RGBA).
 * Measured alpha bbox: (1497,28)-(1793,153) with nonzero alpha.
 * Crop rectangle: (1489,19)-(1801,161), preserving an approved
 * 312x142 registration and the replacement's original RGBA pixels.
 * The word "Total" is printed on the PNG itself: NEVER overlay a title.
 *
 * Coordinates are independent 2048×1152 WORKTABLE units; do not alter garment
 * registration or printing geometry to position the tag.
 * Text percentages are local to the PNG (no price numbers rasterized).
 * Mobile x/y are pixel offsets from the centered below-stage fallback area.
 *
 * HTML contains ONLY the live amount. It is positioned under the
 * already-printed "Total" and angled to follow the paper's edge.
 * Never rotate or reposition the PNG: image layout is owner-approved.
 * Owner's final font choice: Hind Siliguri 700 for the dynamic amount.
 * Keep the printed "Total" on the original PNG, with Noto Serif Bengali
 * fallback for the taka glyph; no new external font asset is required.
 * Amount size uses container-query width units for responsive scale.
 */
export const WORKTABLE_PRICE_TAG=Object.freeze({
 assetPath:'/assets/worktable/price-tag/price-tag.png',
 original:Object.freeze({width:312,height:142}),
 desktop:Object.freeze({x:1485,y:28,width:308,maxWidth:330}),
 tablet:Object.freeze({x:1475,y:30,width:330}),
 mobile:Object.freeze({x:0,y:0,width:330,displayWidth:235}),
 rotation:0,
 text:Object.freeze({
  xPercent:58.5,yPercent:66.5,
  rotationDeg:-2.5,
  fontSizeCqw:15.5,
  fontFamily:'"Hind Siliguri","Noto Serif Bengali",sans-serif',
  fontWeight:700,
  widthPercent:70,
  letterSpacingEm:-0.025,
  lineHeight:1.1,
  align:'center',
 }),
});
