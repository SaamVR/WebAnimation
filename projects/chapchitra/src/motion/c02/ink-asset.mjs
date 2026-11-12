import {inkEdgeX} from './ink-shapes.mjs';
// CHAPCHITRA C02 — single author-supplied 8192x1152 vector ink surface.
// No raster generated, CSS background repetitions or path animation.
export const C02_INK_ASSET=Object.freeze({
 path:'/assets/c02/texture.svg',
 width:8192,height:1152,
 // Measured at SVG y≈540: the last painted source pixels reach x≈8095.
 // Align roller contact to the *visible pigment*, not transparent SVG padding.
 paintedRight:8096,
 press:'#293D2D',
 // Source has a distressed band at SVG y≈154..1005, with intentionally
 // transparent margins at its top/bottom. 1.5x vertical cover scales that
 // original artwork beyond both viewport edges without stretching paths.
 verticalCover:1.5,
 sourceSHA256:'455b6dd824cc1fe4a2f1c1234af345df529db8ce69d9c60c54304c3ccae02ec5'
});
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
export function c02InkAssetPlacement({edgeX,viewportWidth,viewportHeight}){
 const width=Math.max(1,finite(viewportWidth,1));
 const height=Math.max(1,finite(viewportHeight,1));
 const renderHeight=height*C02_INK_ASSET.verticalCover;
 const scale=renderHeight/C02_INK_ASSET.height;
 const paintedExtent=C02_INK_ASSET.paintedRight*scale;
 const left=finite(edgeX)-paintedExtent;
 const top=(height-renderHeight)/2;
 const renderedWidth=C02_INK_ASSET.width*scale;
 return {scale,left,top,renderedWidth,renderHeight,paintedExtent,
  contactX:left+paintedExtent,paintedRight:C02_INK_ASSET.paintedRight};
}

// Use visible viewport geometry for roller, raster and clip together.
export function c02InkVisualViewport(win){
 const visual=win.visualViewport;
 const positive=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0
  ?Number(value):fallback;
 return {
  width:positive(visual?.width,positive(win.innerWidth,1)),
  height:positive(visual?.height,positive(win.innerHeight,1)),
  left:Number.isFinite(visual?.offsetLeft)?visual.offsetLeft:0,
  top:Number.isFinite(visual?.offsetTop)?visual.offsetTop:0
 };
}
// Clip one unchanged, source-derived texture during reveal; never substitute
// a procedural flat-green SVG. Keep the approved organic reveal contour.
export function c02InkRevealClip(progress,width,height){
 if(progress<=0)return 'none';
 if(progress>=1)return 'inset(0 0 0 100%)';
 const points=['100% 0%','100% 100%'];
 for(let i=8;i>=0;i--){
  const y=i*125;
  const x=inkEdgeX(progress,y)*width/1000;
  points.push(x.toFixed(2)+'px '+(y/10).toFixed(2)+'%');
 }
 return 'polygon('+points.join(',')+')';
}
