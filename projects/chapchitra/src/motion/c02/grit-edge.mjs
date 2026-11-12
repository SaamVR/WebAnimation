// C02 Grit Roller (provisional) — deterministic directional dry-bristle edge.
// No generic raster noise, grid, turbulence filter or modification of the
// approved flat Press Green/Deep Forest fill. The reference brush sample was
// not available in this workspace; this is an owner-review interpretation.
import {inkEdgeX} from './ink-shapes.mjs';
const fmt=x=>Number(x.toFixed(2));
const fract=x=>x-Math.floor(x);
const rnd=(i,salt)=>fract(Math.sin((i+1)*127.1+salt*311.7)*43758.5453);
const bristle=(x,y,length,height,tilt=0)=>{
 const start=fmt(x-length),end=fmt(x),mid=fmt(x-length*.47);
 const upper=fmt(y-height*.57),lower=fmt(y+height*.48);
 return 'M '+start+' '+fmt(y+tilt)+' Q '+mid+' '+upper+
  ' '+end+' '+fmt(y-height*.11)+' Q '+mid+' '+lower+
  ' '+start+' '+fmt(y+tilt)+' Z';
};
const marks=Object.freeze(Array.from({length:108},(_,i)=>Object.freeze({
 y:15+rnd(i,7)*970,
 length:5+Math.pow(rnd(i,4),1.9)*31,
 depth:1.5+rnd(i,5)*17,
 height:.65+Math.pow(rnd(i,2),1.7)*4.9,
 tilt:(rnd(i,6)-.5)*2.4,
 deposit:rnd(i,8)>.73
})));
/**
 * Both shapes are anchored to the exact same organic boundary and progress
 * used by the visible roller. The mask removes genuine alpha, revealing the
 * page; the very sparse Press Green deposits sit just ahead of the contact.
 * No shape changes during the unmodified destination reveal.
 */
export function gritEdgePaths(progress){
 const p=Math.max(0,Math.min(1,Number(progress)||0));
 if(p<=0||p>=1)return {dry:'',deposits:''};
 const dry=[],deposits=[];
 for(const m of marks){
  const x=inkEdgeX(p,m.y,27);
  // Tapered longitudinal bristle gaps, *behind* the moving contact edge.
  dry.push(bristle(x-m.depth,m.y,m.length,m.height,m.tilt));
  if(m.deposit){
   const forward=3+2.5*rnd(Math.round(m.y),9);
   // Deposits remain fine, irregular pigment trails rather than splashes.
   deposits.push(bristle(x+forward+m.length*.25,m.y+m.height*.5,
    m.length*.56,m.height*.72,m.tilt*.35));
  }
 }
 return {dry:dry.join(' '),deposits:deposits.join(' ')};
}
