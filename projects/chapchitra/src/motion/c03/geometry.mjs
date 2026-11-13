/**
 * C03 flight geometry. Coordinates are viewport-relative, from live DOMRect
 * readings, so sticky headers and pre-click page scrolling require no offsets.
 * This module does not mutate the editor, header, cart, or product artwork.
 */
const finiteRect=rect=>rect&&['left','top','width','height'].every(k=>Number.isFinite(rect[k]))&&rect.width>0&&rect.height>0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function planC03Flight(source,bag,header,{width,height}){
 if(!finiteRect(source)||!finiteRect(bag)||!Number.isFinite(width)||!Number.isFinite(height))return null;
 if(source.left>=width||source.left+source.width<=0||source.top>=height||source.top+source.height<=0)return null;
 if(bag.left<0||bag.left+bag.width>width+2||bag.top<0||bag.top+bag.height>height+2)return null;
 // Take off from the product's lower-right quadrant, not the background panel.
 const start={x:source.left+source.width*.68,y:source.top+source.height*.72};
 const end={x:bag.left+bag.width*.50,y:bag.top+bag.height*.52};
 const headerBottom=Number.isFinite(header?.bottom)?header.bottom:0;
 const control={
  x:start.x+(end.x-start.x)*.27,
  y:Math.max(headerBottom+8,Math.min(start.y-30,end.y+Math.min(86,Math.abs(start.y-end.y)*.19)))
 };
 const widthPx=source.width*.64,heightPx=source.height*.64;
 const mouth=Math.min(bag.width*.46,bag.height*.46);
 const entryScale=clamp(mouth*.78/Math.max(widthPx,heightPx),.045,.16);
 const d='M '+start.x.toFixed(2)+' '+start.y.toFixed(2)+
  ' Q '+control.x.toFixed(2)+' '+control.y.toFixed(2)+
  ' '+end.x.toFixed(2)+' '+end.y.toFixed(2);
 return {start,end,control,widthPx,heightPx,entryScale,path:d};
}

// Reuse THREADS T02 V3's single continuously-shrinking easing curve.
export const shrinkAt=t=>{
 const x=clamp(t,0,1);
 return .85*x+.15*x*x*x;
};
