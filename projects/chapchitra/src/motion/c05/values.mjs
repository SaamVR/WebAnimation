/**
 * CHAPCHITRA C05 — viewport playback integration. This module modifies no art
 * or keyframes. Icon 03 is delegated to its separately owner-approved adapter.
 * The original self-hosted C01 lottie-web runtime is reused.
 */
const PLAYER_URL='/motion/c01/vendor/lottie.min.js';
const GSAP_URL='/motion/c03/vendor/gsap.min.js';
const ASSETS='/assets/c05/';
const DRIFTLESS_LOTTIES={
  '01':{json:ASSETS+'icon01-final.json'},
  '02':{json:ASSETS+'icon02-final.json',frames:115},
  '04':{json:ASSETS+'icon04-final.json',frames:60}
};
const REDUCED='(prefers-reduced-motion: reduce)';
let playerPromise,gsapPromise;
const cachedData=new Map();
const ASPECT=512;
const once=(value)=>Promise.resolve(value);

function loadPlayer(win,doc){
 if(win.lottie?.loadAnimation)return once(win.lottie);
 if(playerPromise)return playerPromise;
 playerPromise=new Promise((resolve,reject)=>{
  const installed=[...doc.scripts].find(script=>{
   try{return new URL(script.src,doc.baseURI).pathname===PLAYER_URL}catch{return false}
  });
  const script=installed||doc.createElement('script');
  if(!installed){script.src=PLAYER_URL;script.async=true}
  const ready=()=>win.lottie?.loadAnimation
   ?resolve(win.lottie):reject(new Error('C05: installed Lottie player did not initialize'));
  script.addEventListener('load',ready,{once:true});
  script.addEventListener('error',()=>reject(new Error('C05: self-hosted player unavailable')),{once:true});
  if(win.lottie?.loadAnimation){ready();return}
  if(!installed)doc.head.append(script);
 }).catch(error=>{playerPromise=undefined;throw error});
 return playerPromise;
}
function nativeData(win,url,expectedFrames){
 if(!cachedData.has(url))cachedData.set(url,win.fetch(url,{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw Error('C05 asset unavailable: '+url+' HTTP '+r.status);return r.json()})
  .then(data=>{
   if(data.w!==ASPECT||data.h!==ASPECT||data.ip!==0||
      !(data.fr>0)||!(data.op>data.ip)||!Array.isArray(data.layers)||
      !data.layers.length||data.assets?.some(a=>a.p||a.u))
    throw Error('C05 approved native vector metadata mismatch: '+url);
   if(expectedFrames&&data.op!==expectedFrames)
    throw Error('C05 frozen frame count mismatch: '+url);
   return data;
  }).catch(error=>{cachedData.delete(url);throw error}));
 return cachedData.get(url);
}
function loadLottie(win,doc,slot){
 const key=slot.dataset.c05Icon;
 const config=DRIFTLESS_LOTTIES[key];
 if(!config)throw Error('C05 unexpected Lottie icon '+key);
 const holder=slot.querySelector('.c05-value-player');
 return Promise.all([loadPlayer(win,doc),nativeData(win,config.json,config.frames)])
 .then(([engine,data])=>new Promise((resolve,reject)=>{
  const player=engine.loadAnimation({
   container:holder,renderer:'svg',loop:false,autoplay:false,
   animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
  });
  let finished=false;
  const ready=()=>{
   if(finished)return;
   finished=true;
   player.pause();player.goToAndStop(0,true);
   resolve({
    play:()=>player.play(),pause:()=>player.pause(),
    toFinal:()=>player.goToAndStop(Math.max(0,data.op-data.ip-1),true),
    onComplete:fn=>player.addEventListener('complete',fn),
    destroy:()=>player.destroy(),
    frame:()=>player.currentFrame,
    duration:()=>((data.op-data.ip)/data.fr)
   });
  };
  if(player.isLoaded)ready();
  else{
   player.addEventListener('DOMLoaded',ready);
   player.addEventListener('data_failed',()=>reject(Error('C05 invalid Lottie source '+key)));
  }
 }));
}

function loadGSAP(win,doc){
 if(win.gsap?.timeline)return Promise.resolve(win.gsap);
 if(gsapPromise)return gsapPromise;
 gsapPromise=new Promise((resolve,reject)=>{
  const existing=[...doc.scripts].find(s=>{
   try{return new URL(s.src,doc.baseURI).pathname===GSAP_URL}catch{return false}
  });
  const script=existing||doc.createElement('script');
  if(!existing){script.src=GSAP_URL;script.async=true}
  const done=()=>win.gsap?.timeline
   ?resolve(win.gsap):reject(Error('C05 existing GSAP runtime unavailable'));
  script.addEventListener('load',done,{once:true});
  script.addEventListener('error',()=>reject(Error('C05 existing GSAP asset failed')),{once:true});
  if(win.gsap?.timeline){done();return}
  if(!existing)doc.head.append(script);
 }).catch(e=>{gsapPromise=undefined;throw e});
 return gsapPromise;
}

async function loadApprovedGSAP(win,doc,slot){
 // Only the owner-approved final Icon 03 adapter may fill this contract.
 // It must preserve the ORIGINAL SVG groups and the entire finalized GSAP
 // choreography. Gate A / B proof files are NOT a valid replacement.
 await loadGSAP(win,doc);
 const factory=await import('./icon03-approved-motion.mjs');
 if(typeof factory.mountC05Icon03!=='function')throw Error('C05 final Icon 03 mounting contract unavailable');
 const motion=await factory.mountC05Icon03({stage:slot.querySelector('.c05-value-player'),win,doc});
 if(!motion||!['play','pause','toFinal','destroy','onComplete'].every(k=>typeof motion[k]==='function'))
  throw Error('C05 final Icon 03 playback contract incomplete');
 return motion;
}

/** One-shot viewport playback, pause/resume on visibility, static final for reduced motion.
 * No timers or RAFs are introduced by this integration. All clocks remain
 * owned by the Lottie or GSAP animation sources.
 */
export function mountC05Values(root,{win=window,doc=document}={}){
 if(!root||root.dataset.c05Mounted==='true')return {mounted:false,destroy(){}};
 if(root.id!=='values'||root.dataset.c05Values!=='true')
  throw Error('C05 must mount only inside the approved homepage #values section');
 root.dataset.c05Mounted='true';
 const media=win.matchMedia(REDUCED);
 const slots=[...root.querySelectorAll('[data-c05-icon]')];
 if(slots.length!==4||slots.map(x=>x.dataset.c05Icon).join(',')!=='01,02,03,04')
  throw Error('C05 missing original four icon slots');
 const states=new Map(slots.map(slot=>[slot,{visible:false,loading:null,instance:null,done:false,disposed:false}]));
 let destroyed=false;
 function status(slot,value){slot.dataset.c05State=value}
 async function prepare(slot){
  const s=states.get(slot);
  if(!s||s.disposed||s.instance||s.loading)return s?.loading;
  status(slot,'loading');
  s.loading=(slot.dataset.c05Icon==='03'
    ?loadApprovedGSAP(win,doc,slot):loadLottie(win,doc,slot))
   .then(instance=>{
    if(destroyed||s.disposed){instance.destroy();return}
    s.instance=instance;
    slot.classList.add('c05-loaded');
    const poster=slot.querySelector('.c05-value-poster');
    if(poster)poster.setAttribute('aria-hidden','true');
    instance.onComplete?.(()=>{
     if(s.disposed||destroyed)return;
     s.done=true;status(slot,'complete');
    });
    reflect(slot);
   }).catch(error=>{
    // Failure never removes the complete original static final SVG fallback.
    slot.dataset.c05Error=error.message.slice(0,180);
    status(slot,'error');
    console.warn(error);
   }).finally(()=>{s.loading=null});
  return s.loading;
 }
 function reflect(slot){
  const s=states.get(slot);
  if(!s||s.disposed||destroyed)return;
  if(media.matches){
   if(s.instance){s.instance.pause();s.instance.toFinal()}
   status(slot,'reduced');return;
  }
  if(!s.visible||doc.hidden){
   s.instance?.pause();
   if(!s.done)status(slot,'paused');
   return;
  }
  if(!s.instance){void prepare(slot);return}
  if(s.done){status(slot,'complete');return}
  status(slot,'playing');
  s.instance.play();
 }
 function each(){for(const slot of slots)reflect(slot)}
 // Don't eagerly load heavy native vectors outside the viewport.
 const observer=typeof win.IntersectionObserver==='function'
  ?new win.IntersectionObserver(entries=>{
    entries.forEach(entry=>{
     const s=states.get(entry.target);
     if(!s)return;
     s.visible=entry.isIntersecting&&entry.intersectionRatio>=0.1;
     reflect(entry.target);
    });
   },{threshold:[0,.1,.25],rootMargin:'0px 0px -4% 0px'})
  :null;
 // Prefetch one screen ahead, but only start the approved motion when visible.
 // This avoids switching from a final-pose fallback to the first Lottie frame
 // while the owner is already looking at a card (notably Icon 04's entrance).
 const preloader=typeof win.IntersectionObserver==='function'
  ?new win.IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting&&!media.matches){
     void prepare(entry.target);preloader.unobserve(entry.target);
    }
   });
  },{rootMargin:'320px 0px 320px 0px',threshold:0})
  :null;
 for(const slot of slots){
  status(slot,media.matches?'reduced':'idle');
  preloader?.observe(slot);
  if(observer)observer.observe(slot);
  else{states.get(slot).visible=true;reflect(slot)}
 }
 const onVisibility=()=>each();
 const onReduced=()=>{
  for(const slot of slots){
   if(!media.matches&&states.get(slot)?.instance){
    const s=states.get(slot);
    // An already displayed reduced-motion end-frame is terminal; no artificial replay.
    s.done=true;
   }
   reflect(slot);
  }
 };
 doc.addEventListener('visibilitychange',onVisibility);
 media.addEventListener?.('change',onReduced);
 const destroy=()=>{
  if(destroyed)return;
  destroyed=true;observer?.disconnect();preloader?.disconnect();
  doc.removeEventListener('visibilitychange',onVisibility);
  media.removeEventListener?.('change',onReduced);
  win.removeEventListener('pagehide',destroy);
  states.forEach(s=>{s.disposed=true;s.instance?.destroy()});
  root.dataset.c05Mounted='false';
 };
 win.addEventListener('pagehide',destroy,{once:true});
 // Read-only deterministic QA diagnostics, no extra playback clock.
 root.c05QA={
  get states(){return slots.map(slot=>({icon:slot.dataset.c05Icon,state:slot.dataset.c05State,
   error:slot.dataset.c05Error||null,frame:states.get(slot)?.instance?.frame?.()??null}))},
  get reduced(){return media.matches},destroy
 };
 return {mounted:true,destroy};
}