import { GARMENT_VARIANTS } from './worktable-stage.mjs';

// Portrait-proportioned print guides: visual reference, not physical calibration.
export const PAPER_REFERENCES=Object.freeze({
 A4:Object.freeze({widthIn:8.27,heightIn:11.69,widthPx:2480,heightPx:3508}),
 A3:Object.freeze({widthIn:11.69,heightIn:16.54,widthPx:3508,heightPx:4961}),
});
export const MIN_ADJUSTMENT=-50,MAX_ADJUSTMENT=100;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const finite=n=>Number.isFinite(n)&&n>0;
export const normalizedRotation=angle=>(Math.round((Number(angle)||0)/90)*90%360+360)%360;
export function printableRegion(garment){
 const c=GARMENT_VARIANTS[garment]?.chestGuide;
 if(!c)throw new RangeError('Unknown garment');
 const xi=c.width*.045,yi=c.height*.025;
 return {x:c.x+xi,y:c.y+yi,width:c.width-2*xi,height:c.height-2*yi};
}
/** Guide proportions and default position never depend on uploaded image. */
export function printGuideGeometry({garment='regular',preset='A4'}={}){
 const region=printableRegion(garment),paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 const height=region.height*.70/(preset==='A4'?Math.SQRT2:1);
 const width=height*paper.widthIn/paper.heightIn;
 const x=region.x+(region.width-width)/2,y=region.y+region.height*.085;
 return {x,y,width,height,preset,region,centerX:x+width/2,centerY:y+height/2};
}
/** Rotated bounds clamp against actual garment guide; original pixels unchanged. */
export function placementGeometry({garment='regular',preset='A4',imageWidth,imageHeight,
 adjustment=0,rotation=0,dx=0,dy=0,constrainToGuide=false}={}){
 const frame=printGuideGeometry({garment,preset}),region=frame.region;
 if(!finite(imageWidth)||!finite(imageHeight))throw new RangeError('Image dimensions must be positive');
 const ratio=imageWidth/imageHeight;
 const baseW=Math.min(frame.width,frame.height*ratio),baseH=baseW/ratio;
 const turn=normalizedRotation(rotation),quarter=turn===90||turn===270;
 const rotBaseW=quarter?baseH:baseW,rotBaseH=quarter?baseW:baseH;
 const limit=Math.min(2,region.width/rotBaseW,region.height/rotBaseH);
 const maxAdjustment=Math.max(MIN_ADJUSTMENT,Math.min(MAX_ADJUSTMENT,Math.floor((limit-1)*100+1e-7)));
 const wanted=Number.isFinite(adjustment)?adjustment:0;
 const adj=clamp(wanted,MIN_ADJUSTMENT,maxAdjustment),scale=1+adj/100;
 const width=baseW*scale,height=baseH*scale;
 const rw=quarter?height:width,rh=quarter?width:height;
 const withinFrame=rw<=frame.width+1e-6&&rh<=frame.height+1e-6;
 const bounds=constrainToGuide&&withinFrame?frame:region;
 const desiredX=frame.centerX+dx,desiredY=frame.centerY+dy;
 const cx=clamp(desiredX,bounds.x+rw/2,bounds.x+bounds.width-rw/2);
 const cy=clamp(desiredY,bounds.y+rh/2,bounds.y+bounds.height-rh/2);
 return {x:cx-width/2,y:cy-height/2,width,height,
  rotatedX:cx-rw/2,rotatedY:cy-rh/2,rotatedWidth:rw,rotatedHeight:rh,
  centerX:cx,centerY:cy,frame,region,preset,baseW,baseH,refW:frame.width,refH:frame.height,
  rotation:turn,adjustment:adj,maxAdjustment,dx:cx-frame.centerX,dy:cy-frame.centerY,
  constrained:wanted>maxAdjustment||cx!==desiredX||cy!==desiredY,
  exceedsReference:adj>0,inGuide:withinFrame};
}
export function printScaleLabel(adjustment){
 return adjustment>0?'+'+adjustment+'%':adjustment<0?'\u2212'+Math.abs(adjustment)+'%':'0%';
}
export function resolutionGuidance({preset='A4',imageWidth,imageHeight,adjustment=0}){
 const paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 if(!finite(imageWidth)||!finite(imageHeight))return {low:false,text:''};
 const ratio=imageWidth/imageHeight;
 const fitW=Math.min(paper.widthPx,paper.heightPx*ratio),fitH=fitW/ratio;
 const factor=1+Math.max(MIN_ADJUSTMENT,adjustment)/100;
 const low=imageWidth+1<fitW*factor||imageHeight+1<fitH*factor;
 const prefix='Image '+imageWidth+' \u00d7 '+imageHeight+' px. ';
 if(low)return {low:true,text:prefix+'Below the suggested 300 PPI resolution for this '+
   preset+' visual footprint'+(adjustment>0?' at the enlarged preview size':'')+'; preview is still available.'};
 if(adjustment>0)return {low:false,text:prefix+
   'Enlarged beyond the nominal '+preset+' visual reference; final print dimensions require production calibration.'};
 return {low:false,text:prefix+
   'Suitable for the nominal visual reference at 300 PPI; production requirements may differ.'};
}
