// UX-02 / issue #167: display the original complete composition through
// its 2400x550 native wordmark precomposition viewport. No layer extraction,
// source editing, separate cloth renderer, recoloring or hero changes.
import {ASSETS,player,validate,decodePatch,rendererReady} from './complete-logo.mjs';
const themeNow=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
export function mountC08Navbar(link){
 if(!link||link.dataset.ccNavNativeMounted)return;
 link.dataset.ccNavNativeMounted='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const controller=new AbortController(),{signal}=controller;
 const stage=document.createElement('span');stage.className='cc-nav-native-stage';stage.setAttribute('aria-hidden','true');
 link.append(stage);
 let record=null,loading=null,hover=false,disposed=false,playing=false,completed=0,starts=0;
 let generation=0;
 const visible=()=>link.getClientRects().length>0&&getComputedStyle(link).visibility==='visible'&&!document.hidden;
 const eligible=()=>!disposed&&!reduced.matches&&fine.matches&&visible();
 const show=on=>{playing=on;link.dataset.ccNavNativePlaying=String(on)};
 function reset(){hover=false;show(false);record?.animation?.goToAndStop(0,true)}
 function destroyRecord(){generation++;reset();record?.animation?.destroy();record=null;loading=null;stage.replaceChildren()}
 async function prepare(){
  const theme=themeNow();
  if(record?.theme===theme&&record.ready)return record;
  if(loading)return loading;
  const ticket=++generation;
  const holder=document.createElement('span');holder.className='cc-nav-native-holder';stage.replaceChildren(holder);
  const rec={theme,animation:null,ready:false};record=rec;
  loading=(async()=>{
   try{
    const res=await fetch(ASSETS[theme],{cache:'force-cache',signal});if(!res.ok)throw Error('C08 HTTP '+res.status);
    const data=await res.json(),patch=validate(data);
    const [engine]=await Promise.all([player(),decodePatch(patch,signal)]);
    if(signal.aborted||ticket!==generation)throw Error('C08 stale navbar load');
    const animation=engine.loadAnimation({container:holder,renderer:'svg',loop:false,autoplay:false,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});
    rec.animation=animation;await rendererReady(animation,signal);
    if(signal.aborted||ticket!==generation)throw Error('C08 stale navbar renderer');
    animation.goToAndStop(0,true);
    const svg=holder.querySelector('svg');if(!svg)throw Error('C08 SVG missing');
    // Top-level image ends at y1490; original wordmark precomp starts at
    // y1497 and is 550 units high. Clip solely through the SVG viewport.
    svg.setAttribute('viewBox','0 1497 2400 550');svg.style.overflow='hidden';
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    animation.addEventListener('complete',()=>{if(record!==rec)return;completed++;show(false)});
    rec.ready=true;return rec;
   }catch(error){
    rec.animation?.destroy();if(record===rec){record=null;stage.replaceChildren();show(false)}
    return null;
   }finally{if(ticket===generation)loading=null}
  })();
  return loading;
 }
 async function enter(e){
  if(e.pointerType!=='mouse'||!eligible()||hover)return;
  hover=true;
  const rec=await prepare();
  if(!rec||!hover||!eligible()||themeNow()!==rec.theme||record!==rec||playing)return;
  rec.animation.goToAndStop(0,true);show(true);starts++;rec.animation.play();
 }
 link.addEventListener('pointerenter',enter,{signal});
 link.addEventListener('pointerleave',reset,{signal});
 window.addEventListener('chapchitra:themechange',destroyRecord,{signal});
 reduced.addEventListener('change',destroyRecord,{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()},{signal});
 const observer=new MutationObserver(()=>{if(!visible())reset()});observer.observe(link.closest('.site-header'),{attributes:true,attributeFilter:['data-hero01-mode']});
 window.addEventListener('pagehide',e=>{if(e.persisted){reset();return}disposed=true;controller.abort();observer.disconnect();destroyRecord();stage.remove()},{signal});
 window.__chapchitraNavbarC08=Object.freeze({get state(){return {ready:!!record?.ready,playing,completed,starts,theme:record?.theme||themeNow(),frame:record?.animation?.currentFrame??0,source:record?ASSETS[record.theme]:null}}});
}
