// CHAPCHITRA C02: cross-document, progressive print-roller navigation loader.
// Original roller paths remain external and untouched.
import {C02_PAGES,C02_PATHS,C02_MOTION,INK_PALETTE,isC02Eligible,
 easeInk,inkPath,inkEdgePath,inkEdgeX} from './ink-shapes.mjs';
export {C02_PAGES,C02_PATHS,C02_MOTION,isC02Eligible};
const KEY='chapchitra-c02-arrival-v2',TTL=30000,FAILSAFE_MS=13000;
const NS='http://www.w3.org/2000/svg';
const CSS=[
 '.c02-loader{position:fixed;inset:0;z-index:2147483000;overflow:hidden;',
 'pointer-events:auto;isolation:isolate;touch-action:none;overscroll-behavior:contain}',
 '.c02-loader__surface{width:100%;height:100%;display:block;overflow:hidden}',
 '.c02-loader__roller{position:absolute;width:clamp(78px,9.2vw,130px);',
 'height:clamp(78px,9.2vw,130px);pointer-events:none;',
 'transform:translate(-50%,-50%) rotate(90deg);transform-origin:center}',
 '.c02-loader__roller img{width:100%;height:100%;display:block;object-fit:contain}',
 '@media(prefers-reduced-motion:reduce){.c02-loader{display:none!important}}'
].join('');
function ticketFor(win){
 try{
  const t=JSON.parse(win.sessionStorage.getItem(KEY)||'null');
  win.sessionStorage.removeItem(KEY);
  const age=Date.now()-t?.created;
  return t?.to===win.location.pathname+win.location.search&&age>=0&&age<TTL?t:null;
 }catch{return null}
}
function storeTicket(win,url){
 try{win.sessionStorage.setItem(KEY,JSON.stringify({
  to:url.pathname+url.search,created:Date.now()
 }))}catch{}
}
function clearTicket(win){try{win.sessionStorage.removeItem(KEY)}catch{}}
function makeOverlay(doc,win){
 doc.getElementById('c02-loader')?.remove();
 if(!doc.getElementById('c02-style')){
  const s=doc.createElement('style');s.id='c02-style';s.textContent=CSS;doc.head.append(s);
 }
 const overlay=doc.createElement('div');
 overlay.id='c02-loader';overlay.className='c02-loader';overlay.dataset.c02='loader';
 overlay.setAttribute('aria-hidden','true');
 const svg=doc.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1000 1000');
 svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('class','c02-loader__surface');
 function path(color,stroke=false){
  const el=doc.createElementNS(NS,'path');
  el.setAttribute('fill',stroke?'none':color);
  el.setAttribute('fill-rule','evenodd');
  if(stroke){
   el.setAttribute('stroke',color);el.setAttribute('stroke-width','3.6');
   el.setAttribute('stroke-opacity','.5');el.setAttribute('stroke-linecap','round');
  }
  svg.append(el);return el;
 }
 const forest=path(INK_PALETTE.forest),ink=path(INK_PALETTE.press);
 const outline=path(INK_PALETTE.terra,true);
 const roller=doc.createElement('div');roller.className='c02-loader__roller';
 roller.setAttribute('aria-hidden','true');
 const img=doc.createElement('img');img.src='/assets/c02/roller-prepared.svg';
 img.alt='';img.draggable=false;img.decoding='async';
 img.addEventListener('error',()=>{roller.hidden=true},{once:true});
 roller.append(img);overlay.append(svg,roller);doc.body.append(overlay);
 let stopAnimation=null;
 function render(progress,mode='cover'){
  const p=Math.min(1,Math.max(0,progress));
  overlay.dataset.phase=mode;
  forest.setAttribute('d',inkPath(p,{mode,offset:27}));
  ink.setAttribute('d',inkPath(p,{mode}));
  const isFull=(mode==='cover'&&p===1)||(mode==='reveal'&&p===0);
  const isEmpty=(mode==='cover'&&p===0)||(mode==='reveal'&&p===1);
  outline.setAttribute('d',isFull||isEmpty?'':inkEdgePath(p));
  if(mode==='cover'&&p>.065&&p<.92&&!roller.hidden){
   const size=Math.min(130,Math.max(78,win.innerWidth*.092));
   roller.style.left=(inkEdgeX(p,470)*win.innerWidth/1000-size*.38)+'px';
   roller.style.top='48%';roller.style.display='block';
   roller.style.opacity=String(Math.min(1,(p-.065)*16,(.92-p)*15));
  }else roller.style.display='none';
  overlay.style.opacity=mode==='reveal'&&p>.88
   ?String(1-(p-.88)/.12*.13):'1';
 }
 function destroy(){
  if(stopAnimation)stopAnimation();
  overlay.remove();doc.documentElement.classList.remove('c02-pending');
 }
 function animate(mode,ms,done){
  if(stopAnimation)stopAnimation();
  let raf=0,ended=false,start,guard=0;
  function finish(){
   if(ended)return;
   ended=true;
   win.cancelAnimationFrame(raf);
   win.clearTimeout(guard);
   stopAnimation=null;
   render(1,mode);
   done();
  }
  function frame(time){
   if(ended)return;
   if(start===undefined)start=time;
   const t=Math.min(1,(time-start)/ms);
   render(easeInk(t),mode);
   if(t===1)finish();
   else raf=win.requestAnimationFrame(frame);
  }
  render(0,mode);
  // RAF can stall during cross-document transition snapshots and hidden frames.
  // Complete the same animation by deadline; never strand the destination.
  guard=win.setTimeout(finish,ms+650);
  raf=win.requestAnimationFrame(frame);
  stopAnimation=()=>{
   ended=true;win.cancelAnimationFrame(raf);win.clearTimeout(guard);
  };
 }
 return {overlay,render,animate,destroy};
}
function awaitShell(win,doc){
 return new Promise(resolve=>{
  let settled=false,observer,timeout;
  function ready(){
   const main=doc.getElementById('main');
   if(!main?.firstElementChild)return false;
   if(doc.body?.dataset.page!=='artists-edit')return true;
   return ['ready','error','failed'].includes(doc.body.dataset.worktableStatus);
  }
  function finish(){
   if(settled)return;settled=true;
   observer?.disconnect();win.clearTimeout(timeout);
   const fonts=doc.fonts?.ready||Promise.resolve();
   Promise.race([fonts,new Promise(r=>win.setTimeout(r,250))])
    .finally(()=>win.requestAnimationFrame(()=>resolve()));
  }
  if(ready())return finish();
  observer=new win.MutationObserver(()=>{if(ready())finish()});
  observer.observe(doc.documentElement,{subtree:true,childList:true,
   attributes:true,attributeFilter:['data-worktable-status']});
  timeout=win.setTimeout(finish,11000); // failure-only escape hatch
 });
}
export function installC02PageTransitions(win=window,doc=document){
 if(!doc.body||doc.documentElement.dataset.c02Installed==='v2')return;
 doc.documentElement.dataset.c02Installed='v2';
 const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 let overlay=null,leaving=false,watchdog=0;
 function cleanup(){
  win.clearTimeout(watchdog);overlay?.destroy();overlay=null;leaving=false;
  doc.documentElement.classList.remove('c02-pending');
  doc.documentElement.removeAttribute('data-c02-busy');
 }
 const ticket=ticketFor(win);
 if(ticket&&!reduced.matches){
  overlay=makeOverlay(doc,win);
  overlay.render(0,'reveal'); // full cover, before first destination frame
  doc.documentElement.classList.remove('c02-pending');
  overlay.overlay.dataset.phase='loading';
  awaitShell(win,doc).then(()=>{
   if(overlay)overlay.animate('reveal',C02_MOTION.revealMs,cleanup);
  },cleanup);
 }else{
  doc.documentElement.classList.remove('c02-pending');
  if(reduced.matches)clearTicket(win);
 }
 win.addEventListener('pageshow',e=>{if(e.persisted)cleanup()});
 win.addEventListener('pagehide',()=>win.clearTimeout(watchdog));
 reduced.addEventListener?.('change',()=>{if(reduced.matches&&overlay)cleanup()});
 doc.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0)return;
  const node=event.target instanceof win.Element?event.target:null;
  const link=node?.closest('a[href]');
  if(!link)return;
  const href=link.getAttribute('href')||'';
  if(!href||href[0]==='#'||link.hasAttribute('data-no-c02')||
   link.closest('[data-c02-exclude]'))return;
  let target;
  try{target=new URL(link.href,win.location.href)}catch{return}
  if(!isC02Eligible({
   current:win.location.href,destination:target.href,
   modified:event.ctrlKey||event.metaKey||event.shiftKey||event.altKey,
   target:link.getAttribute('target')||'_self',
   download:link.hasAttribute('download'),
   external:link.relList?.contains('external'),
   disabled:link.getAttribute('aria-disabled')==='true'
  })||reduced.matches)return;
  event.preventDefault();if(leaving||overlay)return;
  leaving=true;
  try{
   overlay=makeOverlay(doc,win);
   doc.documentElement.dataset.c02Busy='true';
   overlay.animate('cover',C02_MOTION.coverMs,()=>{
    if(!leaving)return;
    overlay.overlay.dataset.phase='loading';
    storeTicket(win,target);
    try{win.location.assign(target.href)}catch{clearTicket(win);cleanup()}
   });
   watchdog=win.setTimeout(()=>{clearTicket(win);cleanup()},FAILSAFE_MS);
  }catch{cleanup();win.location.assign(target.href)}
 },{capture:true});
}
