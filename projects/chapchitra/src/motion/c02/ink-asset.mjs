import {inkEdgeX} from './ink-shapes.mjs';
// CHAPCHITRA C02 — preserve the owner's COMPLETE transparent PNG ink stroke.
// The exact PNG remains immutable; the unified visual compositor is derived
// at build time without changing approved choreography.
export const C02_INK_ASSET=Object.freeze({
 path:'/assets/c02/Ink_swipe_1.png',
 width:2048,
 height:1152,
 // Actual positive-alpha extent measured directly from original source.
 // Blank transparent padding x=1689..2048 MUST NOT anchor the roller.
 paintedRight:1689,
 press:'#293D2D',
 // One build-derived bitmap; no runtime fragments or repeated background.
 composite:Object.freeze({path:'/assets/c02/ink-unified.webp',
  width:8192,height:1152,tail:6144,sourceBlend:256})
});
export const UNIFIED_INK=Object.freeze({
 width:8192,height:1152,tail:6144,feather:52,
 cellWidth:336,cellHeight:288,blendToOriginal:256,
 sampleRightLimit:1150,seed:0xC0222026,
 path:C02_INK_ASSET.composite.path
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
 const renderedWidth=C02_INK_ASSET.composite.width*scale;
 const compositeLeft=left-C02_INK_ASSET.composite.tail*scale;
 return {scale,left,compositeLeft,top,renderedWidth,renderHeight,paintedExtent,
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
