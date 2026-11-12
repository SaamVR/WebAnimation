// CHAPCHITRA C02: cross-document, progressive print-roller navigation loader.
// Original roller paths remain external and untouched.
import {C02_PAGES,C02_PATHS,C02_MOTION,INK_PALETTE,isC02Eligible,
 easeInk,inkPath,inkEdgePath,inkEdgeX} from './ink-shapes.mjs';
import {C02_ADAPTIVE,pendingInkProgress,finishDuration,
 finishInkProgress,smoothHandoffProgress,getReviewDelayMs} from './adaptive-progress.mjs';
import {gritEdgePaths} from './grit-edge.mjs';
import {C02_INK_ASSET,c02InkAssetPlacement,c02InkVisualViewport,
 c02InkRevealClip} from './ink-asset.mjs';
export {C02_PAGES,C02_PATHS,C02_MOTION,isC02Eligible};
const KEY='chapchitra-c02-arrival-v2',TTL=45000,FAILSAFE_MS=26000;
const NS='http://www.w3.org/2000/svg';
// Contact edge comes from the ORIGINAL cylinder's Chromium/WebKit SVG getBBox():
// y=48.7199, height=273.2201 in the untouched 1700x1700 Illustrator viewBox.
// After a screen-space mirror + 90° rotation, original +Y becomes screen +X.
const ROLLER_VIEWBOX_SIZE=1700;
const ROLLER_CYLINDER_CONTACT_Y=48.7199;
const ROLLER_VIEWBOX_CENTER=850;
const ROLLER_CONTACT_OVERLAP_PX=2;
const CSS=[
 '.c02-loader{position:fixed;inset:auto;z-index:2147483000;overflow:hidden;',
 'pointer-events:auto;isolation:isolate;touch-action:none;overscroll-behavior:contain}',
 '.c02-loader__surface{width:100%;height:100%;display:block;overflow:hidden}',
 '.c02-loader__roller{position:absolute;top:0;left:0;width:clamp(318px,33vw,450px);',
 'height:clamp(318px,33vw,450px);pointer-events:none;z-index:2;isolation:isolate;',
 'transform:translate(-50%,-50%) scaleX(-1) rotate(90deg);transform-origin:center;',
 'will-change:transform;',
 'filter:none!important;mix-blend-mode:normal!important}',
 '.c02-loader__roller img{width:100%;height:100%;display:block;object-fit:contain;',
 'filter:none!important;mix-blend-mode:normal!important;opacity:1!important}',
 // No static full-green waiting state or separate loading spinner. The same
 // live progress signal drives roller location and both organic ink paths.
 '@media(prefers-reduced-motion:reduce){.c02-loader{display:none!important}',
 '.c02-loader::after{animation:none!important}}'
].join('');
function ticketFor(win){
 try{
  const t=JSON.parse(win.sessionStorage.getItem(KEY)||'null');
  win.sessionStorage.removeItem(KEY);
  const age=Date.now()-t?.created;
  return t?.to===win.location.pathname+win.location.search&&age>=0&&age<TTL?t:null;
 }catch{return null}
}
function storeTicket(win,url,{progress=0,startedAt=Date.now(),demoMs=0,edgeStyle='asset'}={}){
 try{win.sessionStorage.setItem(KEY,JSON.stringify({
  to:url.pathname+url.search,created:Date.now(),
  progress:Math.max(0,Math.min(.985,progress)),startedAt,demoMs,edgeStyle
 }))}catch{}
}
function clearTicket(win){try{win.sessionStorage.removeItem(KEY)}catch{}}
function makeOverlay(doc,win,edgeStyle='asset'){
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
 // Apply a small alpha-depletion brush band across BOTH existing paint
 // layers so dry bristle openings reveal the real page, not the forest paint.
 // The paths, body fill, approved outer contact alignment and motion are
 // otherwise identical to the original variant.
 const paint=doc.createElementNS(NS,'g');
 svg.insertBefore(paint,forest);paint.append(forest,ink);
 const defs=doc.createElementNS(NS,'defs');svg.prepend(defs);
 const gritMask=doc.createElementNS(NS,'mask');
 gritMask.id='c02-grit-contact-mask';
 // Luminance is essential: black brush marks must punch alpha holes,
 // not become opaque black alpha-mask areas in WebKit.
 gritMask.style.maskType='luminance';
 gritMask.setAttribute('maskUnits','userSpaceOnUse');
 gritMask.setAttribute('maskContentUnits','userSpaceOnUse');
 gritMask.setAttribute('x','-100');gritMask.setAttribute('y','-100');
 gritMask.setAttribute('width','1200');gritMask.setAttribute('height','1200');
 const white=doc.createElementNS(NS,'rect');
 for(const [k,v] of Object.entries({x:'-100',y:'-100',width:'1200',
   height:'1200',fill:'white'}))white.setAttribute(k,v);
 const dry=doc.createElementNS(NS,'path');dry.setAttribute('fill','black');
 gritMask.append(white,dry);defs.append(gritMask);
 const deposits=doc.createElementNS(NS,'path');
 deposits.setAttribute('fill',INK_PALETTE.press);
 svg.append(deposits);
 const outline=path(INK_PALETTE.terra,true);
 // One original-source unified bitmap; no overlapping runtime layers.
 const inkAssetLayer=doc.createElement('div');
 inkAssetLayer.className='c02-loader__ink-asset-layer';
 inkAssetLayer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;display:none;';
 const inkAssetImg=doc.createElement('img');
 inkAssetImg.className='c02-loader__ink-asset';
 inkAssetImg.alt='';inkAssetImg.draggable=false;
 inkAssetImg.decoding='async';inkAssetImg.loading='eager';
 inkAssetImg.style.cssText='position:absolute;left:0;top:0;max-width:none;'+
  'object-fit:fill;pointer-events:none;will-change:transform;';
 inkAssetImg.addEventListener('error',()=>{overlay.dataset.assetError='unified-ink';},{once:true});
 inkAssetImg.src=C02_INK_ASSET.composite.path;
 const assetsReady=edgeStyle==='asset'
  ?inkAssetImg.decode().catch(()=>{overlay.dataset.assetError='decode';})
  :Promise.resolve();
 inkAssetLayer.append(inkAssetImg);
 const roller=doc.createElement('div');roller.className='c02-loader__roller';
 roller.setAttribute('aria-hidden','true');
 const img=doc.createElement('img');img.src='/assets/c02/roller-original.svg';
 img.alt='';img.draggable=false;img.decoding='async';img.loading='eager';
 img.setAttribute('fetchpriority','high');
 img.addEventListener('error',()=>{roller.hidden=true},{once:true});
 roller.append(img);overlay.append(svg,inkAssetLayer,roller);doc.body.append(overlay);
 let stopAnimation=null,viewportKey='',rasterSizeKey='';
 function render(progress,mode='cover'){
  const p=Math.min(1,Math.max(0,progress));
  overlay.dataset.phase=mode;
  overlay.dataset.progress=String(p); // QA-readable contact alignment, not user UI
  const viewport=c02InkVisualViewport(win);
  const nextViewportKey=[viewport.left,viewport.top,viewport.width,viewport.height].join(':');
  // A 120 Hz iPad must not invalidate layout on every animation frame when
  // the toolbar is stationary. Reflow only on an actual visual-viewport change.
  if(nextViewportKey!==viewportKey){
   viewportKey=nextViewportKey;
   overlay.style.left=viewport.left+'px';
   overlay.style.top=viewport.top+'px';
   overlay.style.width=viewport.width+'px';
   overlay.style.height=viewport.height+'px';
   overlay.dataset.viewport=JSON.stringify(viewport);
  }
  // Build-derived original-source bitmap is a single permanent paint layer
  // for cover, waiting, full coverage and reveal. Hidden procedural SVG
  // paths are not recomputed every 120Hz frame on iPad.
  const rasterSurface=edgeStyle==='asset';
  inkAssetLayer.style.display=rasterSurface?'block':'none';
  svg.style.visibility=rasterSurface?'hidden':'visible';
  if(rasterSurface){
   // At reveal p=0, retain the exact final cover transform.
   const surfaceP=mode==='reveal'?1:p;
   const x=inkEdgeX(surfaceP,470,27)*viewport.width/1000;
   const placement=c02InkAssetPlacement({edgeX:x,
    viewportWidth:viewport.width,viewportHeight:viewport.height});
   const dimensions=placement.renderedWidth+':'+placement.renderHeight;
   if(dimensions!==rasterSizeKey){
    rasterSizeKey=dimensions;
    inkAssetImg.style.width=placement.renderedWidth+'px';
    inkAssetImg.style.height=placement.renderHeight+'px';
   }
   inkAssetImg.style.transform='translate3d('+placement.compositeLeft+'px,'+
    placement.top+'px,0)';
   const clip=mode==='reveal'?c02InkRevealClip(p,viewport.width,viewport.height)
    :p===0?'inset(0 100% 0 0)':'none';
   if(inkAssetLayer.style.clipPath!==clip)inkAssetLayer.style.clipPath=clip;
   overlay.dataset.inkAsset='original-quilt-unified';
   overlay.dataset.inkContactX=String(placement.contactX);
  }else{
   overlay.dataset.inkAsset='procedural-legacy-review';
  }
  // Keep legacy procedural compare modes intact, but do not lay out
  // invisible SVG geometry for the active source-asset compositor.
  if(!rasterSurface){
   forest.setAttribute('d',inkPath(p,{mode,offset:27}));
   ink.setAttribute('d',inkPath(p,{mode}));
   const isFull=(mode==='cover'&&p===1)||(mode==='reveal'&&p===0);
   const isEmpty=(mode==='cover'&&p===0)||(mode==='reveal'&&p===1);
   outline.setAttribute('d',isFull||isEmpty?'':inkEdgePath(p));
   const gritty=edgeStyle==='grit'&&mode==='cover'&&p>0&&p<1;
   if(gritty){
    const texture=gritEdgePaths(p);
    dry.setAttribute('d',texture.dry);
    deposits.setAttribute('d',texture.deposits);
    paint.setAttribute('mask','url(#c02-grit-contact-mask)');
   }else{
    paint.removeAttribute('mask');
    deposits.setAttribute('d','');
   }
  }
  // The unmodified colored cylinder starts at y=48.7199 in its SVG viewBox.
  // Align that real contact edge to the advancing OUTER forest ink contour;
  // the long graphite handle then extends to the unpainted RIGHT.
  if(mode==='cover'&&p<1&&!roller.hidden){
   const size=Math.min(450,Math.max(318,viewport.width*.33));
   const edgeX=inkEdgeX(p,470,27)*viewport.width/1000;
   const cylinderLeft=(ROLLER_CYLINDER_CONTACT_Y-ROLLER_VIEWBOX_CENTER)
     /ROLLER_VIEWBOX_SIZE*size;
   const contactPosition=edgeX-cylinderLeft-ROLLER_CONTACT_OVERLAP_PX;
   roller.style.transform='translate3d('+contactPosition+'px,'+
    (viewport.height*.48)+'px,0) translate(-50%,-50%) scaleX(-1) rotate(90deg)';
   roller.style.display='block';
   roller.style.opacity='1';
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
 function driveAdaptive({startedAt=Date.now(),initial=0,knownMs=0,onProgress}={}){
  let p=Math.max(0,Math.min(.985,initial));
  let raf=0,last=win.performance.now(),stopped=false,completing=null,finishGuard=0;
  const cap=C02_ADAPTIVE.cap;
  function tick(now){
   if(stopped)return;
   const dt=Math.max(1,Math.min(90,now-last));
   last=now;
   if(completing){
    const c=completing;
    const elapsed=now-c.at;
    // Only the still-unready, partial outbound handoff needs the measured
    // velocity-cap correction. Full coverage/reveal keep approved easing.
    const target=c.end>=.999
     ?finishInkProgress(c.start/c.end,elapsed,c.duration,c.velocity/c.end)*c.end
     :smoothHandoffProgress(c.start,c.end,elapsed,c.duration,c.velocity);
    p=Math.max(p,Math.min(c.end,target));
    if(elapsed>=c.duration){
     p=c.end;completing=null;win.clearTimeout(finishGuard);
     render(p,'cover');onProgress?.(p);
     c.done();
    }
   }else{
    let target=pendingInkProgress(Date.now()-startedAt,{cap,knownMs});
    // Navigation may remain in the outgoing document while HTML arrives.
    // Never park the roller at the prefetch handoff position.
    if(doc.documentElement.dataset.c02State==='waiting')
     target=Math.max(target,Math.min(.975,p+dt*.000065));
    // Cap each frame's movement on tab activation; never visually jump
    // several hundred pixels after a background/suspended WebKit frame.
    const maxDelta=dt*Math.max(.00012,cap/Math.max(1200,knownMs||3300)*2.5);
    p=Math.max(p,Math.min(target,p+maxDelta));
   }
   if(stopped)return;
   render(p,'cover');onProgress?.(p);
   raf=win.requestAnimationFrame(tick);
  }
  render(p,'cover');
  raf=win.requestAnimationFrame(tick);
  return {
   progress:()=>p,
   finishTo(end,done){
    if(stopped||completing)return;
    const target=Math.max(p,Math.min(1,end));
    const now=win.performance.now(),start=p;
    const fullSweep=target>=.999;
    let d=fullSweep?finishDuration(start,Date.now()-startedAt):
     Math.round(Math.max(240,Math.min(700,(target-start)*1000)));
    if(!fullSweep&&knownMs===1000)d=Math.min(420,d);
    const velocity=Math.min((p-initial)/Math.max(1,Date.now()-startedAt),
     Math.max(.00005,(target-p)/d));
    completing={start,end:target,at:now,duration:d,velocity,done};
    // Failure-only safeguard for a frozen RAF during WebKit/MPA handoff.
    win.clearTimeout(finishGuard);
    finishGuard=win.setTimeout(()=>{
     if(stopped||!completing)return;
     const c=completing;completing=null;p=c.end;
     render(p,'cover');onProgress?.(p);c.done();
    },d+1200);
   },
   stop(){stopped=true;win.cancelAnimationFrame(raf);
    win.clearTimeout(finishGuard);completing=null;}
  };
 }
 return {overlay,render,animate,driveAdaptive,destroy,assetsReady};
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
   // A waiting requestAnimationFrame can stall on WebKit during document
   // activation; reveal readiness must not require another user gesture.
   // Font readiness is real work, bounded at 250ms to avoid a deadlock.
   Promise.race([fonts,new Promise(r=>win.setTimeout(r,250))])
    .then(resolve,resolve);
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
 // Warm the 2KB exact-source SVG so the first visible ink-edge frame has a roller.
 if(!reduced.matches){
  const rollerImg=new win.Image();rollerImg.src='/assets/c02/roller-original.svg';
  // Prewarm the complete unified image; do not load separate paint tiles.
  const inkImg=new win.Image();inkImg.src=C02_INK_ASSET.composite.path;
 }
 let overlay=null,leaving=false,watchdog=0,incomingGuard=0,prefetchAbort=null,
  drive=null,commitTimer=0,navigationCommitted=false;
 const state=(phase)=>{
  doc.documentElement.dataset.c02State=phase;
  if(overlay?.overlay)overlay.overlay.dataset.c02State=phase;
 };
 state('idle');
 function cleanup(){
  win.clearTimeout(watchdog);
  win.clearTimeout(incomingGuard);win.clearTimeout(commitTimer);
  drive?.stop();drive=null;
  prefetchAbort?.abort();prefetchAbort=null;
  overlay?.destroy();overlay=null;leaving=false;navigationCommitted=false;
  doc.documentElement.classList.remove('c02-pending');
  doc.documentElement.removeAttribute('data-c02-busy');
  if(doc.documentElement.dataset.c02State==='revealing')
   doc.documentElement.dataset.c02RevealEndAt=String(Date.now());
  state('complete');
 }
 // Prefetch the real HTML immediately to obtain a meaningful response/body
 // milestone. There is no reliable cross-document percent-complete API.
 // The incoming page's actual rendered DOM remains the final readiness gate.
 function warmDestination(target){
  if(typeof win.fetch!=='function')return Promise.resolve(false);
  try{
   prefetchAbort=new win.AbortController();
   return win.fetch(target.href,{
    method:'GET',credentials:'same-origin',cache:'default',
    headers:{Accept:'text/html'},signal:prefetchAbort.signal
   }).then(response=>{
    if(!response.ok)throw Error('C02 destination response '+response.status);
    return response.text();
   }).then(()=>true).catch(()=>false);
  }catch{return Promise.resolve(false)}
 }
 const ticket=ticketFor(win);
 const reviewPath=win.location.pathname.startsWith('/c02-review/');
 const requestedEdge=reviewPath?new URLSearchParams(win.location.search).get('edge'):null;
 const edgeStyle=['original','grit','asset'].includes(ticket?.edgeStyle)
  ?ticket.edgeStyle:['original','grit','asset'].includes(requestedEdge)
   ?requestedEdge:'asset';
 if(ticket&&!reduced.matches){
  overlay=makeOverlay(doc,win,edgeStyle);
  // Preserve the partial, unpainted opening across the document handoff.
  // No green full-viewport prepaint and no stationary loading phase.
  const p=Math.max(.015,Math.min(.985,Number(ticket.progress)||.015));
  // Keep matching initial PNG prepaint until the incoming images decode.
  // This prevents a white or procedural flash during WebKit MPA handoff.
  void overlay.assetsReady.then(()=>{
   if(overlay)doc.documentElement.classList.remove('c02-pending');
  });
  if(ticket.demoMs)win.__c02DemoStartedAt=ticket.startedAt;
  doc.documentElement.dataset.c02StartedAt=String(ticket.startedAt||Date.now());
  state('waiting');
  drive=overlay.driveAdaptive({
   initial:p,startedAt:ticket.startedAt||Date.now(),knownMs:ticket.demoMs||0
  });
  incomingGuard=win.setTimeout(cleanup,18000);
  Promise.all([awaitShell(win,doc),overlay.assetsReady]).then(()=>{
   if(!overlay||!drive)return;
   doc.documentElement.dataset.c02ReadyAt=String(Date.now());
   state('finishing');
   drive.finishTo(1,()=>{
    doc.documentElement.dataset.c02RollerEndAt=String(Date.now());
    drive?.stop();drive=null;
    if(!overlay)return;
    state('revealing');
    overlay.animate('reveal',C02_MOTION.revealMs,cleanup);
   });
  },cleanup);
 }else{
  doc.documentElement.classList.remove('c02-pending');
  if(reduced.matches)clearTicket(win);
 }
 win.addEventListener('pageshow',e=>{if(e.persisted)cleanup()});
 win.addEventListener('pagehide',()=>{
  win.clearTimeout(watchdog);win.clearTimeout(commitTimer);
  drive?.stop();drive=null;
  prefetchAbort?.abort();prefetchAbort=null;
 });
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
  const startedAt=Date.now(),demoMs=getReviewDelayMs(target.href);
  try{
   overlay=makeOverlay(doc,win,edgeStyle);
   doc.documentElement.dataset.c02Busy='true';
   state('covering');
   drive=overlay.driveAdaptive({
    startedAt,knownMs:demoMs,
    onProgress:p=>{
     // The old page remains alive while the browser commits a native
     // navigation. Carry the latest progress to the destination document.
     if(navigationCommitted)storeTicket(win,target,{
      progress:p,startedAt,demoMs,edgeStyle
     });
    }
   });
   const navigate=()=>{
    if(!leaving||navigationCommitted)return;
    navigationCommitted=true;
    state('waiting');
    storeTicket(win,target,{progress:drive?.progress()||.68,startedAt,demoMs,edgeStyle});
    try{win.location.assign(target.href)}
    catch{clearTicket(win);cleanup()}
   };
   const commit=()=>{
    if(!leaving||navigationCommitted||!drive)return;
    const current=drive.progress();
    drive.finishTo(Math.max(current+.012,.68),navigate);
   };
   // 1/3/5/8-second scripted examples estimate duration only here,
   // never on normal pages. They pace the shared roller/ink controller.
   if(demoMs){
    commitTimer=win.setTimeout(commit,demoMs<=1000?220:Math.max(0,demoMs-1050));
   }else{
    warmDestination(target).then(ok=>{
     if(!leaving||navigationCommitted)return;
     if(ok)commit();
     else{
      // A failed HTML fetch is a real failure signal, not "95% loaded".
      // Immediately remove the blocking ink and allow native navigation
      // to succeed or display the browser's own error/retry UI.
      clearTicket(win);cleanup();
      try{win.location.assign(target.href)}catch{}
     }
    });
    // Extremely slow/streaming HTML: never hold the visitor indefinitely.
    win.setTimeout(commit,Math.min(12000,FAILSAFE_MS-3500));
   }
   watchdog=win.setTimeout(()=>{clearTicket(win);cleanup()},FAILSAFE_MS);
  }catch{cleanup();win.location.assign(target.href)}
 },{capture:true});
}
