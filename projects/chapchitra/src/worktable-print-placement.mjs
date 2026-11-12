import { GARMENT_VARIANTS } from './worktable-stage.mjs';

/**
 * CHAPCHITRA print-space contract, in the original 2048×1152 garment design
 * space. No viewport, browser scroll or physical manufacturing millimeters.
 * The OWNER'S calibrated A3 rectangle is the hard torso-printing boundary.
 * A4 is a fixed-size, movable portrait subrectangle of that same A3.
 */
export const PAPER_REFERENCES=Object.freeze({
 A4:Object.freeze({widthIn:8.27,heightIn:11.69,widthPx:2480,heightPx:3508}),
 A3:Object.freeze({widthIn:11.69,heightIn:16.54,widthPx:3508,heightPx:4961}),
});
export const MIN_ADJUSTMENT=-50;
export const MAX_ADJUSTMENT=100;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const valid=n=>Number.isFinite(n)&&n>0;
const finite=n=>Number.isFinite(n)?n:0;
const EPSILON=1e-8;

// The previous guide's exact A3 dimensions and anchor are preserved.
export function printableRegion(garment='regular'){
 const variant=GARMENT_VARIANTS[garment];
 if(!variant)throw new RangeError('Unknown garment');
 const chest=variant.chestGuide;
 const height=chest.height*1.18;
 const width=height*(PAPER_REFERENCES.A3.widthIn/PAPER_REFERENCES.A3.heightIn);
 const centerX=variant.box.x+variant.box.width/2;
 return {x:centerX-width/2,y:chest.y+chest.height*.005,width,height};
}

/** The A4 frame translates as a rigid rectangle, within the A3 rectangle. */
export function paperGuide(garment='regular',preset='A4',{frameX=0,frameY=0}={}){
 const a3=printableRegion(garment);
 if(!PAPER_REFERENCES[preset])throw new RangeError('Unknown print reference');
 if(preset==='A3')return {...a3,region:a3,preset,frameX:0,frameY:0};
 const width=a3.width/Math.SQRT2,height=a3.height/Math.SQRT2;
 const homeX=a3.x+(a3.width-width)/2,homeY=a3.y;
 const x=clamp(homeX+finite(frameX),a3.x,a3.x+a3.width-width);
 const y=clamp(homeY+finite(frameY),a3.y,a3.y+a3.height-height);
 return {x,y,width,height,region:a3,preset,frameX:x-homeX,frameY:y-homeY};
}

export function placementGeometry({garment='regular',preset='A4',imageWidth,imageHeight,
 adjustment=0,dx=0,dy=0,rotation=0,frameX=0,frameY=0}){
 if(!valid(imageWidth)||!valid(imageHeight))throw new RangeError('Image dimensions must be positive');
 const guide=paperGuide(garment,preset,{frameX,frameY});
 const ratio=imageWidth/imageHeight;
 // Preserve source aspect ratio. The 0% scale occupies about 78% of the
 // selected print frame so +enlargement remains meaningful up to its edge.
 const nominalWidth=Math.min(guide.width,guide.height*ratio);
 const nominalHeight=nominalWidth/ratio;
 const normalizedRotation=((Math.round(finite(rotation)/90)*90)%360+360)%360;
 const radians=normalizedRotation*Math.PI/180;
 const cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians));
 const fit0=.78;
 const rotatedW=nominalWidth*cos+nominalHeight*sin;
 const rotatedH=nominalWidth*sin+nominalHeight*cos;
 const rotationFit=Math.min(1,guide.width/(rotatedW*fit0),guide.height/(rotatedH*fit0));
 const baseW=nominalWidth*fit0*rotationFit,baseH=nominalHeight*fit0*rotationFit;
 const baseBoundsW=baseW*cos+baseH*sin,baseBoundsH=baseW*sin+baseH*cos;
 const maxFactor=Math.min(1+MAX_ADJUSTMENT/100,guide.width/baseBoundsW,guide.height/baseBoundsH);
 const maxAdjustment=Math.max(0,Math.min(MAX_ADJUSTMENT,Math.floor((maxFactor-1)*100+EPSILON)));
 const desiredAdjustment=finite(adjustment);
 const safeAdjustment=clamp(desiredAdjustment,MIN_ADJUSTMENT,maxAdjustment);
 const factor=1+safeAdjustment/100;
 const width=baseW*factor,height=baseH*factor;
 const boundsWidth=width*cos+height*sin,boundsHeight=width*sin+height*cos;
 const initialCenterX=guide.x+guide.width/2,initialCenterY=guide.y+guide.height/2;
 const requestedCX=initialCenterX+finite(dx),requestedCY=initialCenterY+finite(dy);
 const centerX=clamp(requestedCX,guide.x+boundsWidth/2,guide.x+guide.width-boundsWidth/2);
 const centerY=clamp(requestedCY,guide.y+boundsHeight/2,guide.y+guide.height-boundsHeight/2);
 const bounds={x:centerX-boundsWidth/2,y:centerY-boundsHeight/2,width:boundsWidth,height:boundsHeight};
 const movedFrame=preset==='A4'&&(Math.abs(guide.frameX-finite(frameX))>EPSILON||
  Math.abs(guide.frameY-finite(frameY))>EPSILON);
 return {
  x:centerX-width/2,y:centerY-height/2,width,height,bounds,
  centerX,centerY,guide,region:guide.region,preset,
  frameX:guide.frameX,frameY:guide.frameY,
  baseW,baseH,refW:guide.width,refH:guide.height,
  maxAdjustment,adjustment:safeAdjustment,rotation:normalizedRotation,
  dx:centerX-initialCenterX,dy:centerY-initialCenterY,
  constrained:desiredAdjustment!==safeAdjustment||movedFrame||
   Math.abs(centerX-requestedCX)>EPSILON||Math.abs(centerY-requestedCY)>EPSILON,
  exceedsReference:false,
 };
}
export function printScaleLabel(adjustment){
 return adjustment>0?'+'+adjustment+'%':adjustment<0?'\u2212'+Math.abs(adjustment)+'%':'0%';
}
export function resolutionGuidance({preset='A4',imageWidth,imageHeight,adjustment=0}){
 const paper=PAPER_REFERENCES[preset];
 if(!paper)throw new RangeError('Unknown print reference');
 if(!valid(imageWidth)||!valid(imageHeight))return {low:false,text:''};
 const imageRatio=imageWidth/imageHeight;
 const fitW=Math.min(paper.widthPx,paper.heightPx*imageRatio),fitH=fitW/imageRatio;
 const factor=1+Math.max(MIN_ADJUSTMENT,adjustment)/100;
 const low=imageWidth+1<fitW*factor||imageHeight+1<fitH*factor;
 const prefix='Image '+imageWidth+' \u00d7 '+imageHeight+' px. ';
 if(low)return {low:true,text:prefix+
  'Below the suggested 300 PPI resolution for this '+preset+' visual footprint'+(adjustment>0?' at the enlarged preview size':'')+'; preview is still available.'};
 if(adjustment>0)return {low:false,text:prefix+
  'Enlarged beyond the nominal '+preset+' visual reference; final print dimensions require production calibration.'};
 return {low:false,text:prefix+'Suitable for the nominal visual reference at 300 PPI; production requirements may differ.'};
}
