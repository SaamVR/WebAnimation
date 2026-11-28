// Exact owner-supplied native-vector animation packages, resting frame 0.
const specs=[
 {id:'worker-1',name:'Worker1_Brush_Presentation_VECTOR.json',sha256:'422f794a894b34d176a2f72a0b09fa389855da4a08549e75a632a50e6bb4239e',frames:120,bounds:[173,21,422,495],anchor:'left'},
 {id:'worker-2',name:'worker2-roller.json',sha256:'367b3f5d10a1f8dce6af0e1ce7f34a86d6b538d62614b97cd62d222ffe8620a0',frames:102,bounds:[108,25,395,487],anchor:'left'},
 {id:'worker-3',name:'worker3-cloth-v2.json',sha256:'d5c9577ba343bbb0ff57d470aecd8050ad30d786d1d8696572e1e13352b3efb1',frames:102,bounds:[95,20,417,492],anchor:'right'}
];
export const WORKER_ANIMATIONS=Object.freeze(specs.map(s=>Object.freeze({...s,bounds:Object.freeze(s.bounds)})));
const runtime='/motion/c01/vendor/lottie.min.js';
let runtimePending;
function loadRuntime(){
 if(window.lottie?.loadAnimation)return Promise.resolve(window.lottie);
 if(!runtimePending)runtimePending=new Promise((resolve,reject)=>{
  let script=[...document.scripts].find(s=>s.getAttribute('src')===runtime);
  const owned=!script;
  if(owned){script=document.createElement('script');script.src=runtime;script.async=true}
  const done=()=>window.lottie?.loadAnimation?resolve(window.lottie):reject(Error('Lottie runtime unavailable'));
  script.addEventListener('load',done,{once:true});
  script.addEventListener('error',()=>{if(owned)script.remove();reject(Error('Lottie runtime failed'))},{once:true});
  if(owned)document.head.append(script);
  if(window.lottie?.loadAnimation)done();
 }).catch(e=>{runtimePending=null;throw e});
 return runtimePending;
}
// Raster alpha target and actual SVG visible resting bounds are in different
// coordinate spaces. Uniform scale preserves the approved vector proportions;
// register the height, baseline and contact-side horizontal edge.
export function workerPlacement(target,spec){
 const [x0,y0,x1,y1]=target,[a,b,c,d]=spec.bounds;
 const scale=(y1-y0)/(d-b),width=(c-a)*scale;
 const visibleLeft=spec.anchor==='right'?x1-width:x0;
 return {x:visibleLeft-a*scale,y:y0-b*scale,size:512*scale,
  visible:[visibleLeft,y0,visibleLeft+width,y1],scale};
}
export function mountWorktableWorkers(stage,targets){
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const hosts=WORKER_ANIMATIONS.map((spec,i)=>{
  const box=workerPlacement(targets[i],spec),el=document.createElement('div');
  el.className='cc-worktable-worker';el.dataset.worker=spec.id;el.dataset.workerState='loading';el.setAttribute('aria-hidden','true');
  el.style.left=box.x/2048*100+'%';el.style.top=box.y/1152*100+'%';el.style.width=box.size/2048*100+'%';el.style.height=box.size/1152*100+'%';
  stage.append(el);return el;
 });
 let disposed=false,revision=0,actors=[],ready=false;
 const controller=new AbortController();
 const rest=()=>{for(const {actor,el} of actors){actor.goToAndStop(0,true);el.dataset.workerState='rest'}};
 const onMotion=()=>{if(motion.matches){revision++;rest()}};
 motion.addEventListener('change',onMotion);
 const onHidden=()=>{if(document.hidden){revision++;rest()}};
 document.addEventListener('visibilitychange',onHidden);
 // Load once, no loops, no autoplay. Parallel network requests but a single
 // instance per character; do not install raster stand-ins.
 const initialization=(async()=>{
  const [lottie,...data]=await Promise.all([loadRuntime(),...WORKER_ANIMATIONS.map(async s=>{
   const r=await fetch('/assets/worktable-workers/'+s.name,{signal:controller.signal});
   if(!r.ok)throw Error('Worker asset unavailable: '+s.id);const j=await r.json();
   if(j.w!==512||j.h!==512||j.fr!==30||j.ip!==0||j.op!==s.frames||j.assets?.some(a=>a.p))throw Error('Worker asset contract failed: '+s.id);
   return j;
  })]);
  if(disposed)return false;
  for(let i=0;i<data.length;i++){
   const el=hosts[i],actor=lottie.loadAnimation({container:el,renderer:'svg',loop:false,autoplay:false,animationData:data[i],rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});
   actors.push({actor,el});actor.setSpeed(1);
   actor.addEventListener('complete',()=>{if(!disposed){actor.goToAndStop(0,true);el.dataset.workerState='rest'}});
  }
  await Promise.all(actors.map(({actor})=>new Promise((resolve,reject)=>{
   if(actor.isLoaded){resolve();return}
   actor.addEventListener('DOMLoaded',resolve);actor.addEventListener('data_failed',()=>reject(Error('Worker Lottie rejected')));
   controller.signal.addEventListener('abort',()=>reject(Error('Disposed')),{once:true});
  })));
  if(disposed)return false;
  ready=true;rest();stage.dataset.workersReady='true';return true;
 })().catch(error=>{if(!disposed){stage.dataset.workersReady='failed';console.error('Worker SVG initialization failed:',error);for(const {actor} of actors)actor.destroy();actors=[]}return false});
 return {
  async playOnce(){
   const ticket=++revision;
   if(disposed||motion.matches||document.hidden)return;
   if(!(ready||await initialization)||disposed||ticket!==revision||motion.matches||document.hidden)return;
   // Latest successfully placed upload restarts the same three actors. Each
   // has its own native frame clock and resets independently on completion.
   rest();
   for(const {actor,el} of actors){el.dataset.workerState='playing';actor.goToAndPlay(0,true)}
   stage.dataset.workerSequence=String((Number(stage.dataset.workerSequence)||0)+1);
  },
  destroy(){if(disposed)return;disposed=true;revision++;controller.abort();motion.removeEventListener('change',onMotion);document.removeEventListener('visibilitychange',onHidden);for(const {actor} of actors)actor.destroy();actors=[];for(const el of hosts)el.remove()}
 };
}
