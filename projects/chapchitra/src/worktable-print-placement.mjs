import { GARMENT_VARIANTS } from './worktable-stage.mjs';

/** All measurements are DESIGN-SPACE positions; no garment inches are claimed. */
export const PAPER_REFERENCES=Object.freeze({
 A4:Object.freeze({widthIn:8.27,heightIn:11.69,widthPx:2480,heightPx:3508}),
 A3:Object.freeze({widthIn:11.69,heightIn:16.54,widthPx:3508,heightPx:4961}),
});
export const MIN_ADJUSTMENT=-50;
export const MAX_ADJUSTMENT=100;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const positive=n=>Number.isFinite(n)&&n>0;

export function printableRegion(garment){
 const chest=GARMENT_VARIANTS[garment]?.chestGuide;
 if(!chest)throw new RangeError('Unknown garment');
 const xInset=chest.width*.045,yInset=chest.height*.025;
 return {x:chest.x+xInset,y:chest.y+yInset,
  width:chest.width-2*xInset,height:chest.height-2*yInset};
}
/** Stable reference; independent of upload image ratio, scale or rotation. */
export function paperGuide(garment='regular',preset='A4'){
 const region=printableRegion(garment);
 const paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 const height=region.height*.70/(preset==='A4'?Math.SQRT2:1);
 const width=height*(paper.widthIn/paper.heightIn);
 return {x:region.x+(region.width-width)/2,y:region.y+region.height*.085,
  width,height,region,preset};
}
export function placementGeometry({garment='regular',preset='A4',imageWidth,imageHeight,
 adjustment=0,dx=0,dy=0,rotation=0}){
 if(!positive(imageWidth)||!positive(imageHeight))throw new RangeError('Image dimensions must be positive');
 const guide=paperGuide(garment,preset);
 const region=guide.region;
 const normalizedRotation=((Math.round(rotation/90)*90)%360+360)%360;
 const sideways=normalizedRotation===90||normalizedRotation===270;
 const sourceRatio=imageWidth/imageHeight;
 // Preserve all source pixels; fit & center within nominal portrait guide.
 const nominalWidth=Math.min(guide.width,guide.height*sourceRatio);
 const nominalHeight=nominalWidth/sourceRatio;
 const fitWidth=sideways?nominalHeight:nominalWidth;
 const fitHeight=sideways?nominalWidth:nominalHeight;
 const baseReduction=Math.min(1,region.width/fitWidth,region.height/fitHeight);
 const baseW=nominalWidth*baseReduction,baseH=nominalHeight*baseReduction;
 const baseBoundsWidth=sideways?baseH:baseW,baseBoundsHeight=sideways?baseW:baseH;
 const geometricMax=Math.min(2,region.width/baseBoundsWidth,region.height/baseBoundsHeight);
 const maxAdjustment=Math.max(0,Math.min(MAX_ADJUSTMENT,Math.floor((geometricMax-1)*100+1e-8)));
 const normalizedAdjustment=clamp(Number.isFinite(adjustment)?adjustment:0,MIN_ADJUSTMENT,maxAdjustment);
 const factor=1+normalizedAdjustment/100;
 const width=baseW*factor,height=baseH*factor;
 const boundsWidth=sideways?height:width,boundsHeight=sideways?width:height;
 const initialCenterX=guide.x+guide.width/2,initialCenterY=guide.y+guide.height/2;
 const requestedCX=initialCenterX+(Number.isFinite(dx)?dx:0);
 const requestedCY=initialCenterY+(Number.isFinite(dy)?dy:0);
 const centerX=clamp(requestedCX,region.x+boundsWidth/2,region.x+region.width-boundsWidth/2);
 const centerY=clamp(requestedCY,region.y+boundsHeight/2,region.y+region.height-boundsHeight/2);
 const bounds={x:centerX-boundsWidth/2,y:centerY-boundsHeight/2,width:boundsWidth,height:boundsHeight};
 return {
  x:centerX-width/2,y:centerY-height/2,width,height,bounds,
  centerX,centerY,guide,region,preset,
  baseW,baseH,refW:guide.width,refH:guide.height,
  maxAdjustment,adjustment:normalizedAdjustment,rotation:normalizedRotation,
  dx:centerX-initialCenterX,dy:centerY-initialCenterY,
  constrained:adjustment>maxAdjustment||Math.abs(centerX-requestedCX)>1e-7||Math.abs(centerY-requestedCY)>1e-7,
  exceedsReference:normalizedAdjustment>0,
 };
}
export function printScaleLabel(adjustment){
 return adjustment>0?'+'+adjustment+'%':adjustment<0?'\u2212'+Math.abs(adjustment)+'%':'0%';
}
export function resolutionGuidance({preset='A4',imageWidth,imageHeight,adjustment=0}){
 const paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 if(!positive(imageWidth)||!positive(imageHeight))return {low:false,text:''};
 const imageRatio=imageWidth/imageHeight;
 const fitW=Math.min(paper.widthPx,paper.heightPx*imageRatio);
 const fitH=fitW/imageRatio;
 const factor=1+Math.max(MIN_ADJUSTMENT,adjustment)/100;
 const low=imageWidth+1<fitW*factor||imageHeight+1<fitH*factor;
 const prefix='Image '+imageWidth+' \u00d7 '+imageHeight+' px. ';
 if(low)return {low:true,text:prefix+
  'Below the suggested 300 PPI resolution for this '+preset+' visual footprint'+(adjustment>0?' at the enlarged preview size':'')+'; preview is still available.'};
 if(adjustment>0)return {low:false,text:prefix+
  'Enlarged beyond the nominal '+preset+' visual reference; final print dimensions require production calibration.'};
 return {low:false,text:prefix+'Suitable for the nominal visual reference at 300 PPI; production requirements may differ.'};
}
