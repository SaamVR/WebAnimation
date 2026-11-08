import { GARMENT_VARIANTS } from './worktable-stage.mjs';

/** Relative placement only. Real garment dimensions require manufacturer data. */
export const PAPER_REFERENCES=Object.freeze({
 A4:Object.freeze({widthIn:8.27,heightIn:11.69,widthPx:2480,heightPx:3508}),
 A3:Object.freeze({widthIn:11.69,heightIn:16.54,widthPx:3508,heightPx:4961}),
});
export const MIN_ADJUSTMENT=-50;
export const MAX_ADJUSTMENT=100;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const finite=n=>Number.isFinite(n)&&n>0;

export function printableRegion(garment){
 const chest=GARMENT_VARIANTS[garment]?.chestGuide;
 if(!chest)throw new RangeError('Unknown garment');
 const xInset=chest.width*.045,yInset=chest.height*.025;
 return {x:chest.x+xInset,y:chest.y+yInset,
  width:chest.width-2*xInset,height:chest.height-2*yInset};
}
export function placementGeometry({garment='regular',preset='A4',imageWidth,imageHeight,
 adjustment=0,dx=0,dy=0}){
 const guide=printableRegion(garment);
 if(!PAPER_REFERENCES[preset])throw new RangeError('Unknown print reference');
 if(!finite(imageWidth)||!finite(imageHeight))throw new RangeError('Image dimensions must be positive');
 const paper=PAPER_REFERENCES[preset];
 const paperRatio=paper.widthIn/paper.heightIn;
 // An A3 page has twice A4's visual area: sqrt(2) in each linear dimension.
 const refH=guide.height*.70/(preset==='A4'?Math.SQRT2:1);
 const refW=refH*paperRatio;
 const imageRatio=imageWidth/imageHeight;
 const baseW=Math.min(refW,refH*imageRatio),baseH=baseW/imageRatio;
 const geometricLimit=Math.min(2,guide.width/baseW,guide.height/baseH);
 const maxAdjustment=Math.max(0,Math.min(MAX_ADJUSTMENT,Math.floor((geometricLimit-1)*100+1e-8)));
 const normalizedAdjustment=clamp(Number.isFinite(adjustment)?adjustment:0,MIN_ADJUSTMENT,maxAdjustment);
 const scale=1+normalizedAdjustment/100;
 const width=baseW*scale,height=baseH*scale;
 // The collar gap is visual, NOT a claimed number of measured inches.
 const startX=guide.x+(guide.width-baseW)/2;
 const startY=guide.y+guide.height*.085;
 // Resize from artwork center to avoid upper-left anchored layout jumps.
 const resizedBaseX=startX-(width-baseW)/2,resizedBaseY=startY-(height-baseH)/2;
 const requestedX=resizedBaseX+dx,requestedY=resizedBaseY+dy;
 const x=clamp(requestedX,guide.x,guide.x+guide.width-width);
 const y=clamp(requestedY,guide.y,guide.y+guide.height-height);
 return {x,y,width,height,region:guide,preset,baseW,baseH,refW,refH,
  maxAdjustment,adjustment:normalizedAdjustment,dx:x-resizedBaseX,dy:y-resizedBaseY,
  constrained:adjustment>maxAdjustment||x!==requestedX||y!==requestedY,
  exceedsReference:normalizedAdjustment>0};
}
export function printScaleLabel(adjustment){
 return adjustment>0?'+'+adjustment+'%':adjustment<0?'\u2212'+Math.abs(adjustment)+'%':'0%';
}
export function resolutionGuidance({preset='A4',imageWidth,imageHeight,adjustment=0}){
 const paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 if(!finite(imageWidth)||!finite(imageHeight))return {low:false,text:''};
 const imageRatio=imageWidth/imageHeight;
 const fitW=Math.min(paper.widthPx,paper.heightPx*imageRatio),fitH=fitW/imageRatio;
 const factor=1+Math.max(MIN_ADJUSTMENT,adjustment)/100;
 const low=imageWidth+1<fitW*factor||imageHeight+1<fitH*factor;
 const prefix='Image '+imageWidth+' \u00d7 '+imageHeight+' px. ';
 if(low)return {low:true,text:prefix+'Below the suggested 300 PPI resolution for this '+
   preset+' visual footprint'+(adjustment>0?' at the enlarged preview size':'')+
   '; preview is still available.'};
 if(adjustment>0)return {low:false,text:prefix+
   'Enlarged beyond the nominal '+preset+' visual reference; final print dimensions require production calibration.'};
 return {low:false,text:prefix+
   'Suitable for the nominal visual reference at 300 PPI; production requirements may differ.'};
}
