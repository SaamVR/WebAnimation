// CHAPCHITRA C02 — deterministic source-image quilting; no live tiled layer.
// Every sample originates in the checksum-pinned owner PNG's dense interior.
import sharp from 'sharp';

import {UNIFIED_INK} from '../src/motion/c02/ink-asset.mjs';
export {UNIFIED_INK};
const clamp01=x=>Math.max(0,Math.min(1,x));
const smooth=t=>{const x=clamp01(t);return x*x*(3-2*x);};
function seededRandom(seed){
 let state=seed>>>0;
 return ()=>{
  state=(state+0x6d2b79f5)>>>0;
  let x=state;
  x=Math.imul(x^(x>>>15),x|1);
  x^=x+Math.imul(x^(x>>>7),x|61);
  return ((x^(x>>>14))>>>0)/4294967296;
 };
}
const taper=(t,span)=>smooth(t/span);

// One unified texture: irregular source-origin patches are feathered
// internally, then fused to the source's real left edge. Never mirror/flip,
// repeat CSS backgrounds, mutate the right edge, or add procedural noise.
export async function quiltInkRGBA(originalBytes){
 const cfg=UNIFIED_INK;
 const {data:original,info}=await sharp(originalBytes)
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==2048||info.height!==cfg.height||info.channels!==4)
  throw Error('C02 quilt requires exact 2048x1152 RGBA source');
 const outWidth=cfg.width,h=cfg.height;
 const extended=cfg.tail+cfg.blendToOriginal;
 const W=cfg.cellWidth,H=cfg.cellHeight,F=cfg.feather;
 const patchW=W+2*F,patchH=H+2*F;
 const acc=new Float32Array(extended*h);
 const weights=new Float32Array(extended*h);
 const rand=seededRandom(cfg.seed);
 const provenance=[];
 for(let gy=-1;gy<=Math.ceil(h/H)+1;gy++){
  for(let gx=-1;gx<=Math.ceil(extended/W)+1;gx++){
   const x=gx*W-F,y=gy*H-F;
   const x0=Math.max(0,x),y0=Math.max(0,y);
   const x1=Math.min(extended,x+patchW),y1=Math.min(h,y+patchH);
   if(x1<=x0||y1<=y0)continue;
   const srcX=16+Math.floor(rand()*(cfg.sampleRightLimit-patchW-32+1));
   const srcY=Math.floor(rand()*(h-patchH+1));
   provenance.push({cell:[gx,gy],source:[srcX,srcY],size:[patchW,patchH]});
   const wx=new Float32Array(x1-x0);
   for(let xx=x0;xx<x1;xx++){
    const u=xx-x;
    wx[xx-x0]=taper(u,F)*taper(patchW-u,F);
   }
   for(let yy=y0;yy<y1;yy++){
    const v=yy-y;
    const wy=taper(v,F)*taper(patchH-v,F);
    const srcRow=(srcY+v)*info.width*4;
    const targetRow=yy*extended;
    for(let xx=x0;xx<x1;xx++){
     const wt=wy*wx[xx-x0],k=targetRow+xx;
     weights[k]+=wt;
     acc[k]+=original[srcRow+(srcX+xx-x)*4+3]*wt;
    }
   }
  }
 }
 const result=Buffer.allocUnsafe(outWidth*h*4);
 // Preserve the owner's exact Press Green; only source-derived alpha varies.
 // Far-left bristle details attenuate gently, preventing recognizable copies
 // of the original's 1000px interior marks across ultrawide viewports.
 for(let y=0;y<h;y++){
  const destRow=y*outWidth*4,accRow=y*extended;
  for(let x=0;x<extended;x++){
   const k=accRow+x;
   if(weights[k]<0.001)throw Error('C02 uncovered quilt pixel '+x+','+y);
   const sampledAlpha=acc[k]/weights[k];
   const inkStrength=.72+.22*smooth((x-(cfg.tail-1500))/1500);
   const blendedAlpha=Math.max(155,Math.min(255,
    Math.round(255-(255-sampledAlpha)*inkStrength)));
   let a=blendedAlpha;
   if(x>=cfg.tail){
    const srcX=x-cfg.tail;
    const t=smooth(srcX/(cfg.blendToOriginal-1));
    const originalAlpha=original[y*info.width*4+srcX*4+3];
    a=Math.round(blendedAlpha*(1-t)+originalAlpha*t);
   }
   const o=destRow+x*4;
   result[o]=41;result[o+1]=61;result[o+2]=45;result[o+3]=a;
  }
  // Source pixels from x=256 onward remain BYTE-EXACT, including the
  // distinctive distressed silhouette, pits and transparent right edge.
  const srcFrom=cfg.blendToOriginal*4,srcTo=info.width*4;
  original.copy(result,destRow+(cfg.tail+cfg.blendToOriginal)*4,
   y*info.width*4+srcFrom,y*info.width*4+srcTo);
 }
 return {rgba:result,source:original,provenance};
}
export async function generateUnifiedInk(originalBytes){
 const result=await quiltInkRGBA(originalBytes);
 const cfg=UNIFIED_INK;
 const webp=await sharp(result.rgba,{
  raw:{width:cfg.width,height:cfg.height,channels:4}
 }).webp({lossless:true,effort:4}).toBuffer();
 return {webp,...result};
}
