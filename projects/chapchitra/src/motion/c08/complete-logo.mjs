// C08 final owner package (2026-11-25). Only complete compositions; no
// separate cloth SVG, palette conversion, or replacement timeline.
const PLAYER='/motion/c01/vendor/lottie.min.js';
const ASSETS=Object.freeze({
 light:'/assets/c08-final/CHAPCHITRA_C08_WORDMARK_REPRINT_NEG90_WITH_CLOTHING_PATCH.json',
 dark:'/assets/c08-final/CHAPCHITRA_C08_INVERTED_WORDMARK_REPRINT.json'
});
const FRAMES=240, LAST=FRAMES-1, DURATION=4000;
const themeNow=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
const clampFrame=value=>Math.max(0,Math.min(LAST,Number.isFinite(value)?value:0));
let enginePromise;
function player(){
 if(window.lottie?.loadAnimation)return Promise.resolve(window.lottie);
 if(enginePromise)return enginePromise;
 enginePromise=new Promise((resolve,reject)=>{
  const existing=[...document.scripts].find(s=>{
   try{return new URL(s.src,document.baseURI).pathname===PLAYER}catch{return false}
  });
  const script=existing||Object.assign(document.createElement('script'),{src:PLAYER,async:true});
  const stop=()=>{clearTimeout(timeout);script.removeEventListener('load',ready);script.removeEventListener('error',failed)};
  const ready=()=>{stop();window.lottie?.loadAnimation?resolve(window.lottie):reject(Error('C08 Lottie player unavailable'))};
  const failed=()=>{stop();reject(Error('C08 Lottie player request failed'))};
  const timeout=setTimeout(failed,20000);
  script.addEventListener('load',ready,{once:true});
  script.addEventListener('error',failed,{once:true});
  if(window.lottie?.loadAnimation)ready();
  else if(!existing)document.head.append(script);
 }).catch(error=>{enginePromise=null;throw error});
 return enginePromise;
}
function validate(data){
 const patch=data.assets?.find(a=>a.e===1&&typeof a.p==='string'&&a.p.startsWith('data:image/png;base64,'));
 const precomp=data.assets?.find(a=>Array.isArray(a.layers));
 if(data.w!==2400||data.h!==2400||data.fr!==60||data.ip!==0||data.op!==FRAMES||
    data.layers?.length!==2||data.assets?.length!==2||
    !patch||patch.w!==1416||patch.h!==1271||!precomp||
    !data.layers.some(l=>l.ty===2&&l.refId===patch.id&&l.ip===0&&l.op===FRAMES)||
    !data.layers.some(l=>l.ty===0&&l.refId===precomp.id&&l.ip===0&&l.op===FRAMES))
  throw Error('C08 owner composition metadata mismatch');
 return patch;
}
function abortError(){return new DOMException('C08 disposed','AbortError')}
function abortable(promise,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(abortError());return}
  const aborted=()=>reject(abortError());
  signal.addEventListener('abort',aborted,{once:true});
  Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',aborted));
 });
}
async function decodePatch(patch,signal){
 const image=new Image();
 // Explicit decode is separate from lottie-web's loaded_images event,
 // which may also count failed image loads. Never reveal on that event alone.
 if(typeof image.decode==='function'){
  image.src=patch.p;
  await abortable(image.decode(),signal);
 }else{
  await abortable(new Promise((resolve,reject)=>{
   image.onload=resolve;image.onerror=()=>reject(Error('C08 embedded PNG load failed'));
   image.src=patch.p;
  }),signal);
 }
 if(!image.complete||image.naturalWidth!==patch.w||image.naturalHeight!==patch.h)
  throw Error('C08 embedded PNG failed dimension/decode gate');
 return image;
}
function rendererReady(animation,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(abortError());return}
  let done=false;
  const finish=error=>{
   if(done)return;done=true;clearTimeout(timeout);
   animation.removeEventListener('DOMLoaded',loaded);
   animation.removeEventListener('data_failed',failed);
   animation.removeEventListener('error',failed);
   signal.removeEventListener('abort',aborted);
   error?reject(error):resolve();
  };
  const loaded=()=>finish();
  const failed=()=>finish(Error('C08 native Lottie renderer failed'));
  const aborted=()=>finish(abortError());
  const timeout=setTimeout(failed,25000);
  animation.addEventListener('DOMLoaded',loaded);
  animation.addEventListener('data_failed',failed);
  animation.addEventListener('error',failed);
  signal.addEventListener('abort',aborted,{once:true});
  if(animation.isLoaded)loaded();
 });
}
// Width is anchored by the unchanged 2400:2020 static SVG. Square player
// keeps the same 2400-unit scale and top-left origin; transparent bottom
// canvas does not change document flow or shrink the clothing patch.
export function mountC08Hero({heroImage,remainingDwell}){
 const parent=heroImage?.parentElement,slide=parent?.closest('.hero-slide');
 if(!parent||!slide||parent.dataset.c08CompleteMounted)return;
 parent.dataset.c08CompleteMounted='true';
 parent.dataset.c08View='static';
 const controller=new AbortController(),{signal}=controller;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const stage=document.createElement('div');
 stage.className='c08-complete-stage';stage.setAttribute('aria-hidden','true');
 const trigger=document.createElement('button');
 trigger.type='button';trigger.className='c08-complete-trigger';trigger.hidden=true;
 trigger.setAttribute('aria-label','Replay CHAPCHITRA animated logo');trigger.title='Replay logo animation';
 parent.append(stage,trigger);
 const records=new Map();
 let phase=reduced.matches?'skipped':'idle',frame=0,shown=null,running=false,
     initial=!slide.hidden&&!reduced.matches,autoplay=0,completed=0,replays=0,
     visible=true,suspended=false,disposed=false,hoverArmed=true,failedCount=0,lastPointerType='';
 let theme=themeNow(),switchCount=0,lastSwap=null;
 const staticImages=new Map();
 const staticAttributes=[...heroImage.attributes].filter(a=>a.name!=='src').map(a=>[a.name,a.value]);
 const staticSource=which=>'/assets/brand/chapchitra-'+which+'-full.svg';
 const initialStaticTheme=heroImage.getAttribute('src')===staticSource('dark')?'dark':'light';
 staticImages.set(initialStaticTheme,{image:heroImage,status:heroImage.complete&&heroImage.naturalWidth>0?'ready':'idle'});
 let staticTheme=initialStaticTheme;
 const now=()=>performance.now();
 const visibleRect=()=>{const r=parent.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight};
 visible=visibleRect();
 const canAnimate=()=>!disposed&&!reduced.matches&&!slide.hidden&&!parent.inert&&!document.hidden&&!suspended&&visible;
 const current=()=>records.get(theme);
 function pause(){
  if(shown&&running){frame=clampFrame(shown.animation.currentRawFrame??shown.animation.currentFrame);shown.animation.pause()}
  running=false;
 }
 function staticView(){
  pause();
  parent.dataset.c08View='static';
  shown=null;
 }
 function show(rec){
  // Prepare the matching frame BEFORE the atomic CSS view switch. The
  // previous view stays visible until this point; no cross-fade/duplicate.
  if(shown!==rec){
   pause();
   rec.animation.goToAndStop(frame,true);
   const previous=parent.dataset.c08View;
   parent.dataset.c08View=rec.theme;
   shown=rec;
   if(previous!==rec.theme&&switchCount>0)lastSwap={theme:rec.theme,frame,at:now()};
  }
  if(phase==='playing'&&canAnimate()&&!running){
   rec.animation.play();running=true;
  }
 }
 function finish(rec){
  if(disposed||shown!==rec||phase!=='playing')return;
  running=false;frame=LAST;phase='complete';completed++;
  rec.animation.goToAndStop(LAST,true);
  reflectTrigger();
 }
 function reflectTrigger(){
  const ready=current()?.status==='ready';
  trigger.hidden=disposed||reduced.matches||slide.hidden||!ready;
  trigger.setAttribute('aria-disabled',String(phase==='playing'||phase==='idle'));
 }
 function installStatic(which,rec){
  if(disposed||theme!==which||rec.status!=='ready')return false;
  if(heroImage!==rec.image){heroImage.replaceWith(rec.image);heroImage=rec.image}
  staticTheme=which;
  return true;
 }
 function ensureStatic(which){
  let rec=staticImages.get(which);
  if(!rec){
   const image=new Image();
   for(const [name,value] of staticAttributes)image.setAttribute(name,value);
   image.src=staticSource(which);
   rec={image,status:'idle'};staticImages.set(which,rec);
  }
  if(rec.status==='ready')return installStatic(which,rec);
  if(rec.status==='idle'){
   rec.status='loading';
   const image=rec.image;
   const decoded=typeof image.decode==='function'?image.decode():
    new Promise((resolve,reject)=>{
     if(image.complete){image.naturalWidth>0?resolve():reject(Error('C08 static SVG failed'));return}
     image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});
    });
   abortable(decoded,signal).then(()=>{
    if(!image.complete||!image.naturalWidth)throw Error('C08 static SVG decode failed');
    rec.status='ready';if(installStatic(which,rec))reconcile();
   }).catch(()=>{rec.status='failed'});
  }
  return false;
 }
 function reconcile(){
  if(disposed)return;
  const matchingStaticReady=ensureStatic(theme);
  if(slide.hidden){
   if(initial||phase==='playing'){initial=false;phase=phase==='complete'?'complete':'skipped';frame=phase==='complete'?LAST:0}
   staticView();reflectTrigger();return;
  }
  if(reduced.matches){
   initial=false;
   if(phase!=='complete'){phase='skipped';frame=0}
   staticView();reflectTrigger();return;
  }
  if(!canAnimate()){pause();reflectTrigger();return}
  const rec=current();
  if(rec?.status!=='ready'){
   pause();if(matchingStaticReady)staticView();
   if(!rec)void prepare(theme);
   reflectTrigger();return;
  }
  if(phase==='idle'){
   // Do not hold or restart the carousel's approved 8s/4s clock.
   // If a cold asset misses the window, retain the static logo and
   // allow a deliberate replay later instead of autoplaying offscreen.
   const remaining=remainingDwell?.()??8000;
   if(initial&&remaining>=DURATION+120){
    phase='playing';frame=0;autoplay++;initial=false;
   }else{phase='skipped';initial=false}
  }
  if(phase==='playing'||phase==='complete')show(rec);
  else staticView();
  reflectTrigger();
 }
 async function prepare(which){
  if(disposed||reduced.matches||records.has(which))return;
  const holder=document.createElement('div');
  holder.className='c08-complete-variant';holder.dataset.c08Variant=which;
  stage.append(holder);
  const rec={theme:which,status:'loading',holder,animation:null,decoded:false,startedAt:now(),readyAt:null};
  records.set(which,rec);
  try{
   const response=await fetch(ASSETS[which],{cache:'force-cache',signal});
   if(!response.ok)throw Error('C08 JSON HTTP '+response.status);
   const data=await response.json(),patch=validate(data);
   const [engine,image]=await Promise.all([abortable(player(),signal),decodePatch(patch,signal)]);
   if(signal.aborted)throw abortError();
   rec.decoded=true;rec.image=image;
   const animation=engine.loadAnimation({
    container:holder,renderer:'svg',loop:false,autoplay:false,animationData:data,
    rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}
   });
   rec.animation=animation;
   await rendererReady(animation,signal);
   if(signal.aborted)throw abortError();
   animation.goToAndStop(0,true);
   await abortable(new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))),signal);
   const svg=holder.querySelector('svg'),embedded=[...holder.querySelectorAll('svg image')].find(image=>!image.closest('defs'));
   const href=embedded?.getAttribute('href')||embedded?.getAttributeNS('http://www.w3.org/1999/xlink','href')||embedded?.getAttribute('xlink:href');
   if(!svg||!embedded||!href?.startsWith('data:image/png;base64,'))
    throw Error('C08 renderer missing embedded clothing image');
   animation.addEventListener('complete',()=>finish(rec));
   rec.readyAt=now();rec.status='ready';holder.dataset.c08Ready='true';
   reconcile();
   // Fetch/render only the active theme first. Warm the other composition
   // once active art is ready, then keep both paused except the visible one.
   // Two JSONs maximum; dotLottie and former overlay assets never requested.
   if(which===theme&&!reduced.matches){
    const other=which==='dark'?'light':'dark';
    if(!records.has(other))void prepare(other);
   }
  }catch(error){
   rec.animation?.destroy();rec.animation=null;rec.image=null;holder.remove();
   rec.status='failed';
   if(!disposed&&error.name!=='AbortError'){rec.error=String(error.message||error);failedCount++;reconcile()}
  }
 }
 function changeTheme(){
  const next=themeNow();
  if(next!==theme){pause();theme=next;switchCount++}
  reconcile();
 }
 function replay(){
  if(!canAnimate()||current()?.status!=='ready'||phase==='playing'||phase==='idle')return;
  // Deliberate pointer re-entry, touch tap or keyboard activation only.
  pause();frame=0;phase='playing';replays++;
  const rec=current();
  rec.animation.goToAndStop(0,true);
  show(rec);
  reflectTrigger();
 }
 trigger.addEventListener('pointerenter',event=>{
  if(!fine.matches||event.pointerType!=='mouse')return;
  const armed=hoverArmed;hoverArmed=false;
  if(armed)replay();
 },{signal});
 trigger.addEventListener('pointerleave',()=>{hoverArmed=true},{signal});
 trigger.addEventListener('pointerdown',event=>{lastPointerType=event.pointerType},{signal});
 trigger.addEventListener('click',event=>{
  if(fine.matches&&event.detail>0&&lastPointerType!=='touch'&&lastPointerType!=='pen')return;
  replay();
 },{signal});
 const observer=new MutationObserver(reconcile);
 observer.observe(slide,{attributes:true,attributeFilter:['hidden']});
 observer.observe(parent,{attributes:true,attributeFilter:['inert']});
 const intersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  visible=entries[0]?.isIntersecting===true;reconcile();
 },{threshold:0.01}):null;
 intersection?.observe(parent);
 window.addEventListener('chapchitra:themechange',changeTheme,{signal});
 // System/manual/storage all dispatch the existing theme event; observe
 // direct attribute changes as well, without altering the toggle module.
 const themeObserver=new MutationObserver(changeTheme);
 themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 document.addEventListener('visibilitychange',reconcile,{signal});
 reduced.addEventListener('change',reconcile,{signal});
 window.addEventListener('pagehide',event=>{
  if(event.persisted){suspended=true;pause();return}
  dispose();
 },{signal});
 window.addEventListener('pageshow',event=>{if(event.persisted){suspended=false;changeTheme()}},{signal});
 function dispose(){
  if(disposed)return;
  pause();disposed=true;controller.abort();
  observer.disconnect();themeObserver.disconnect();intersection?.disconnect();
  for(const rec of records.values()){rec.animation?.destroy();rec.animation=null;rec.image=null}
  records.clear();staticImages.clear();staticView();stage.remove();trigger.remove();
  delete parent.dataset.c08CompleteMounted;
 }
 // Read-only diagnostics for native browser recordings and lifecycle QA.
 window.__chapchitraC08=Object.freeze({
  get hero(){return {
   ready:current()?.status==='ready',playing:running,phase,completed,autoplay,replays,
   failed:failedCount>0,failedCount,theme,source:ASSETS[theme],frame:running&&shown?clampFrame(shown.animation.currentRawFrame??shown.animation.currentFrame):frame,
   shown:parent.dataset.c08View,staticTheme,switchCount,lastSwap,disposed,
   variants:Object.fromEntries([...records].map(([key,value])=>[key,{status:value.status,decoded:value.decoded,error:value.error||null,loadMs:value.readyAt===null?null:value.readyAt-value.startedAt}]))
  }},
  get navbar(){return {loaded:false,ready:false,playing:false}}
 });
 reconcile();
}

// Shared native loading gates; hero behavior is unchanged.
export { ASSETS, player, validate, decodePatch, rendererReady };
