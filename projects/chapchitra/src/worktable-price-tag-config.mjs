/**
 * CHAPCHITRA — illustrated price tag registration (editable presentation only).
 *
 * The uploaded 2048×1152 PNG has a mostly transparent canvas. For reliable
 * responsive scaling we preserved its pixels and trimmed transparent padding:
 * original alpha bounds x=1497..1793, y=27..153; 8px safety margin.
 * PNG here is 312×142 RGBA, unchanged color/texture/alpha.
 *
 * Coordinates are independent 2048×1152 WORKTABLE units; do not alter garment
 * registration or printing geometry to position the tag.
 * Text percentages are local to the PNG (no price numbers rasterized).
 * Mobile x/y are pixel offsets from the centered below-stage fallback area.
 */
export const WORKTABLE_PRICE_TAG=Object.freeze({
 assetPath:'/assets/worktable/price-tag/price-tag.png',
 original:Object.freeze({width:312,height:142}),
 desktop:Object.freeze({x:1485,y:28,width:308,maxWidth:330}),
 tablet:Object.freeze({x:1475,y:30,width:330}),
 mobile:Object.freeze({x:0,y:0,width:330,displayWidth:235}),
 rotation:0,
 text:Object.freeze({xPercent:63,yPercent:51,fontSizeCqw:11.5,align:'center'}),
});
