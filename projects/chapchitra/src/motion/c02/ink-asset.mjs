import {inkEdgeX} from './ink-shapes.mjs';
// CHAPCHITRA C02 — preserve the owner's COMPLETE transparent PNG ink stroke.
// Only cover-phase visual placement uses this file. No animation timeline,
// navigation readiness, roller geometry, or reveal paths are changed.
export const C02_INK_ASSET=Object.freeze({
 path:'/assets/c02/Ink_swipe_1.png',
 width:2048,
 height:1152,
 // Actual positive-alpha extent measured directly from original source.
 // Blank transparent padding x=1689..2048 MUST NOT anchor the roller.
 paintedRight:1689,
 press:'#293D2D',
 // Reflect only dense interior pigment; never duplicate the leading brush edge.
 interior:Object.freeze({path:'/assets/c02/ink-interior-loop.webp',
  cropStart:0,cropWidth:1160,loopWidth:2320})
});
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
export function c02InkAssetPlacement({edgeX,viewportWidth,viewportHeight}){
 const width=Math.max(1,finite(viewportWidth,1));
 const height=Math.max(1,finite(viewportHeight,1));
 // Single UNIFORM image scale. The 6% vertical overscan avoids horizontal
 // stripes from transparent padding across changing viewport heights.
 const renderHeight=height*1.06;
 const scale=renderHeight/C02_INK_ASSET.height;
 const paintedExtent=C02_INK_ASSET.paintedRight*scale;
 const left=finite(edgeX)-paintedExtent;
 const top=(height-renderHeight)/2;
 const renderedWidth=C02_INK_ASSET.width*scale;
 // Repeat only real pigment to the LEFT. Its reflected rightmost column
 // exactly matches the original PNG's first column; no solid backing required.
 const interiorFillWidth=Math.min(width,Math.max(0,left));
 return {scale,left,top,renderedWidth,renderHeight,paintedExtent,
  interiorFillWidth,interiorLoopWidth:C02_INK_ASSET.interior.loopWidth*scale,
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
// During the last part of the roller pass, smoothly fill remaining transparent
// bristle pits with the SAME source-derived interior pigment. Full cover and
// reveal then retain exactly the same textured bitmap on all aspect ratios.
export function c02InkInteriorCoverage(placement,width,progress){
 const visibleWidth=Math.max(1,width);
 const base=Math.min(visibleWidth,Math.max(0,placement.interiorFillWidth));
 const t=Math.max(0,Math.min(1,(progress-.78)/.22));
 const eased=t*t*(3-2*t);
 return base+(visibleWidth-base)*eased;
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
