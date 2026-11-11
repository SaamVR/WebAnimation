// CHAPCHITRA C02 — source-generated, fluid ink geometry.
// No downloaded masks, no raster swipe, no roller-path alterations.
export const INK_PALETTE = Object.freeze({
  press:'#293D2D', forest:'#172419', terra:'#8A503B'
});
export const C02_MOTION = Object.freeze({coverMs:405,revealMs:385});
const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
export const easeInk=t=>{const x=clamp01(t);return x*x*(3-2*x)};
export const C02_PAGES = Object.freeze([
  '/', '/shop/', '/artists-edit/', '/journal/', '/about/',
  '/product/', '/bag/', '/favorites/', '/account/',
  '/checkout/', '/order-confirmation/', '/journal/story/'
]);
// Legacy symbol retained for old test references; it now names pages,
// never the obsolete homepage-only link allowlist.
export const C02_PATHS=C02_PAGES;
export function isC02Eligible({
  current, destination, modified=false, target='_self',
  download=false, external=false, disabled=false
}={}){
  if(modified||download||external||disabled||!destination||
     (target&&target!=='_self'))return false;
  let from,to;
  try{
    from=new URL(current),to=new URL(destination,from);
  }catch{return false}
  if(!/^https?:$/.test(from.protocol)||!/^https?:$/.test(to.protocol)||
     from.origin!==to.origin)return false;
  const sameDocument=from.pathname===to.pathname && from.search===to.search;
  if(sameDocument)return false; // Includes in-page anchor scrolling.
  if(/\.(?:zip|rar|pdf|svg|png|jpe?g|gif|webp|mp4|webm|json|css|mjs|js|woff2?|ttf)$/i.test(to.pathname))return false;
  return true;
}
const fmt=n=>Number(n.toFixed(2));
function edgeAt(y,p,offset=0){
  const s=clamp01(p),base=-265+1530*s;
  const organic=104*Math.sin(Math.PI*y/1000*2.35+.32)
   +48*Math.sin(Math.PI*y/1000*4.15+1.15)
   +19*Math.sin(Math.PI*y/1000*7.1-.7);
  // Irregularity tapers near full coverage, ensuring an unbroken final state.
  return fmt(base + (Math.sin(Math.PI*s)*.34+.66)*organic+offset);
}
export function inkEdgeX(p,y=500,offset=0){return edgeAt(y,p,offset)}
function edgePoints(p,offset){
  return Array.from({length:9},(_,i)=>({x:edgeAt(i*125,p,offset),y:i*125}));
}
// Smooth Catmull-Rom-to-Bezier contour. No polygonal staircase.
function contour(points,reverse=false){
  const arr=reverse?[...points].reverse():points;
  let d='';
  for(let i=0;i<arr.length-1;i++){
    const p0=arr[Math.max(0,i-1)],p1=arr[i],
      p2=arr[i+1],p3=arr[Math.min(arr.length-1,i+2)];
    d+=' C '+fmt(p1.x+(p2.x-p0.x)/6)+' '+fmt(p1.y+(p2.y-p0.y)/6)
      +' '+fmt(p2.x-(p3.x-p1.x)/6)+' '+fmt(p2.y-(p3.y-p1.y)/6)
      +' '+p2.x+' '+p2.y;
  }
  return d;
}
function organicWindow(p,mode,offset){
  // One elliptical, flowing opening inside the paint; closes before takeover.
  const visibility=Math.min((p-.15)/.16,(.86-p)/.17,1);
  if(visibility<=0)return '';
  const radius=Math.max(0,visibility);
  // The cutout must align through BOTH paint layers; offset only the outer edge.
  const x=edgeAt(526,p,0)+(mode==='cover'?-179:179);
  const y=505+29*Math.sin(p*5.7);
  const rx=fmt(116*radius),ry=fmt(49*radius);
  if(rx<1||ry<1)return '';
  // Tear-drop-like aperture. The evenodd winding makes a genuine window.
  return ' M '+fmt(x-rx)+' '+fmt(y)
    +' C '+fmt(x-rx*.78)+' '+fmt(y-ry*.94)
    +' '+fmt(x+rx*.30)+' '+fmt(y-ry*1.18)
    +' '+fmt(x+rx)+' '+fmt(y-ry*.17)
    +' C '+fmt(x+rx*.82)+' '+fmt(y+ry*.84)
    +' '+fmt(x-rx*.44)+' '+fmt(y+ry*.87)
    +' '+fmt(x-rx)+' '+fmt(y)+' Z';
}
export function inkPath(p,{mode='cover',offset=0,opening=true}={}){
  const progress=clamp01(p);
  if(mode!=='cover'&&mode!=='reveal')throw Error('Unknown C02 ink phase');
  if(mode==='cover'&&progress===0 || mode==='reveal'&&progress===1)return '';
  if(mode==='cover'&&progress===1 || mode==='reveal'&&progress===0)
    return 'M -2 -2 H 1002 V 1002 H -2 Z';
  const points=edgePoints(progress,offset);
  const top=points[0],bottom=points[points.length-1];
  const outer=mode==='cover'
    ?'M -2 -2 L '+top.x+' -2 L '+top.x+' 0'+contour(points)+' L -2 1002 Z'
    :'M '+top.x+' 0 L 1002 -2 L 1002 1002 L '+bottom.x+' 1000'+contour(points,true)+' Z';
  return outer+(opening?organicWindow(progress,mode,offset):'');
}
export function inkEdgePath(p,offset=0){
  const points=edgePoints(clamp01(p),offset);
  return 'M '+points[0].x+' '+points[0].y+contour(points);
}
