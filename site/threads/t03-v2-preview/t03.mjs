/** THREADS T03: use the owner's final 5-second postcard SVG as supplied, without editing tracks. */
const SOURCE_URL='./assets/backpack_animated_postcard.svg';
const RESULT_KEY='threads.t03.reward.v2';
const $=id=>document.getElementById(id);
const button=$('t03-bag-trigger'),vector=$('t03-svg-holder'),announcement=$('t03-announcement');
let savedReward=null;
// Last click wins; changes requested while a native SVG segment plays are queued.
const outcomes=[
 {end:500,label:'Free Delivery'},
 {end:800,label:'5% OFF'},
 {end:920,label:'7% OFF'},
 {end:999,label:'10% OFF'},
 {end:1000,label:'50% OFF'}
];
function uniformThousand(){
 if(!globalThis.crypto?.getRandomValues)return Math.floor(Math.random()*1000);
 const x=new Uint32Array(1),limit=Math.floor(0x100000000/1000)*1000;
 do {crypto.getRandomValues(x)}while(x[0]>=limit); // No modulo bias.
 return x[0]%1000;
}
function selectReward(){
 if(savedReward!==null)return savedReward;
 try{
  const cached=sessionStorage.getItem(RESULT_KEY);
  if(cached!==null && outcomes.some(x=>x.label===cached))return savedReward=cached;
 }catch{}
 const ticket=uniformThousand();
 savedReward=outcomes.find(x=>ticket<x.end).label;
 try{sessionStorage.setItem(RESULT_KEY,savedReward)}catch{}
 return savedReward;
}
// Review-only override displays each reward without changing the weighted session draw.
const previewChoices=Object.freeze({'5':'5% OFF','7':'7% OFF','10':'10% OFF','50':'50% OFF',free:'Free Delivery'});
const reviewCode=new URLSearchParams(location.search).get('reward')?.toLowerCase();
const reviewReward=Object.hasOwn(previewChoices,reviewCode)?previewChoices[reviewCode]:null;
function displayReward(){return reviewReward||selectReward()}
function populatePostcard(svg,reward){
 const ns='http://www.w3.org/2000/svg';
 const group=svg.querySelector('#popout-card-group'),rim=svg.querySelector('#open-collar-front-rim-group');
 const clipping=svg.querySelector('#rimPocketClip');
 if(!group||!rim||!clipping)throw Error('Exact owner postcard and front-rim layers required');
 const children=[...group.children];
 // Keep the source gradients, teal header, orange circle, and white bars unchanged.
 if(children.length<13||children[1].getAttribute('x')!=='1162'||children[2].getAttribute('x')!=='1172')throw Error('Unexpected postcard source structure');
 for(const node of children.slice(7))node.remove(); // Drop only body illustration/bars below header.
 // Expand card width 12.5% about its existing x=1274 centre; no header or timing edits.
 children[1].setAttribute('x','1148');children[1].setAttribute('width','252');
 children[2].setAttribute('x','1158');children[2].setAttribute('width','232');
 const textNode=(value,y,size,id)=>{
  const node=document.createElementNS(ns,'text');
  node.setAttribute('id',id);
  for(const [k,v] of Object.entries({x:'1274',y:String(y),'text-anchor':'middle',fill:'#2E453A','font-family':'Inter, Arial, sans-serif','font-weight':'900','font-size':String(size),'letter-spacing':'-1.2'}))node.setAttribute(k,v);
  node.textContent=value;group.appendChild(node);
  return node;
 };
 if(reward==='Free Delivery'){
  textNode('FREE',501,48,'t03-reward-vector');
  textNode('DELIVERY',550,37,'t03-reward-vector-line-2');
 }else{
  textNode(reward.replace(' OFF',''),544,102,'t03-reward-vector');
 }
 group.setAttribute('data-reward',reward);
 // The owner's original rimPocketClip and layer order conceal the lower card.
 return group;
}
// Native single-clock CSS playback: no Animation.seek/pause/play/currentTime writes,
 // no setTimeout, and no per-layer timeline mutations. All nine source animations
 // start simultaneously paused at frame 0 and resume together through one class.
const DURATION_MS=5000;
const HOLD_MS=0.60*DURATION_MS; // Inside the owner's exact 41%-62% fully-open postcard hold.
let svgActor=null,master=null,frameHandle=0,desiredOpen=false,phase='loading';
let holdBoundary=HOLD_MS,cycleBoundary=DURATION_MS;
let suspendedByVisibility=false;
function nativeTime(){return Number(master?.currentTime)||0}
function pauseAll(){
 if(!svgActor)return;
 svgActor.classList.add('t03-native-paused');
}
function resumeAll(){
 if(!svgActor)return;
 svgActor.classList.remove('t03-native-paused');
}
function setStatus(open){
 button.setAttribute('aria-expanded',String(open));
 button.setAttribute('aria-busy','false');
 button.setAttribute('aria-label',open?'Close backpack':'Open backpack');
 announcement.textContent=open?displayReward():'Backpack closed.';
}
function finishClosed(){
 if(phase!=='closing')return;
 if(desiredOpen){
  // No reset: allow the exact CSS animation's next native iteration to
  // advance from the matching closed frame at 100%/0% into opening.
  phase='opening';
  holdBoundary=Math.floor((nativeTime()+1)/DURATION_MS)*DURATION_MS+HOLD_MS;
  button.setAttribute('aria-label','Close backpack after opening');
  watchNativeFrame();
  return;
 }
 pauseAll();
 phase='closed';
 setStatus(false);
}
function watchNativeFrame(){
 if(frameHandle)cancelAnimationFrame(frameHandle);
 const check=()=>{
  frameHandle=0;
  if(suspendedByVisibility)return;
  const t=nativeTime();
  if(phase==='opening' && t>=holdBoundary){
   if(desiredOpen){
    // Freeze all nine authored layers at the end of the original open pose.
    pauseAll();
    phase='opened';
    setStatus(true);
    return;
   }
   // Second click was queued during opening. Keep running naturally into
   // the authored closing keyframes; never jump from 50% to 62%.
   phase='closing';
   cycleBoundary=Math.floor(t/DURATION_MS)*DURATION_MS+DURATION_MS;
  }
  if(phase==='closing' && t>=cycleBoundary){
   finishClosed();
   return;
  }
  if(phase==='opening'||phase==='closing')frameHandle=requestAnimationFrame(check);
 };
 frameHandle=requestAnimationFrame(check);
}
function open(){
 if(phase!=='closed')return;
 phase='opening';
 button.setAttribute('aria-busy','true');
 button.setAttribute('aria-label','Close backpack after opening');
 const t=nativeTime();
 holdBoundary=Math.floor(t/DURATION_MS)*DURATION_MS+HOLD_MS;
 // If the native iteration stopped fractionally past its boundary, target
 // the next complete hold rather than rewinding any authored animation.
 if(t>holdBoundary)holdBoundary+=DURATION_MS;
 resumeAll();
 watchNativeFrame();
}
function close(){
 if(phase!=='opened')return;
 phase='closing';
 button.setAttribute('aria-busy','true');
 button.setAttribute('aria-label','Open backpack after closing');
 const t=nativeTime();
 cycleBoundary=(Math.floor(t/DURATION_MS)+1)*DURATION_MS;
 resumeAll();
 watchNativeFrame();
}
button.addEventListener('click',()=>{
 if(phase==='loading'||phase==='error')return;
 desiredOpen=!desiredOpen;
 if(phase==='closed'&&desiredOpen)open();
 else if(phase==='opened'&&!desiredOpen)close();
 // Motion in progress? Queue the latest click intent. No pause/seek.
});
// CSS animationiteration fires at the single shared native cycle boundary.
function nativeIteration(event){
 if(event.target?.id!=='backpack-scene'||event.animationName!=='bagBounce')return;
 if(phase==='closing')finishClosed();
}
// Avoid throttled-frame tab resumption drifting past the hold/close boundary.
// This special lifecycle suspension never changes the artwork or progress.
document.addEventListener('visibilitychange',()=>{
 if(phase!=='opening'&&phase!=='closing')return;
 if(document.hidden){
  suspendedByVisibility=true;
  pauseAll();
  if(frameHandle)cancelAnimationFrame(frameHandle);
  frameHandle=0;
 }else if(suspendedByVisibility){
  suspendedByVisibility=false;
  resumeAll();
  watchNativeFrame();
 }
});
(async()=>{
 try{
  const url=globalThis.__THREADS_T03_EMBEDDED_SVG__||SOURCE_URL;
  const response=await fetch(url);
  if(!response.ok)throw Error('SVG unavailable ('+response.status+')');
  const source=await response.text();
  if(!source.includes('--dur: 5s')||!source.includes('id="popout-card-group"')||!source.includes('id="rimPocketClip"')||!source.includes('data:image/png;base64,'))throw Error('Incorrect final postcard animation source.');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  if(doc.querySelector('parsererror'))throw Error('Owner SVG cannot be parsed.');
  const svg=document.importNode(doc.documentElement,true);
  svg.removeAttribute('width');svg.removeAttribute('height');
  svg.setAttribute('role','img');svg.setAttribute('aria-label','THREADS backpack opening and closing');svg.setAttribute('focusable','false');
  populatePostcard(svg,displayReward());
  // Class-based pause affects every native CSS track atomically.
  // No overrides of original keyframes, easing, iteration count or transforms.
  svg.classList.add('t03-native-paused');
  vector.replaceChildren(svg);
  svgActor=svg;
  const tracks=svg.getAnimations({subtree:true});
  if(tracks.length!==9)throw Error('Expected the nine source CSS animations, got '+tracks.length);
  master=svg.getElementById('backpack-scene')?.getAnimations()[0];
  if(!master||master.animationName!=='bagBounce')throw Error('Source master animation missing.');
  svg.getElementById('backpack-scene').addEventListener('animationiteration',nativeIteration);
  // Keep the previous Safari first-frame decode/paint gate.
  const imageSources=[...svg.querySelectorAll('image')].map(el=>el.getAttribute('href')||el.getAttributeNS('http://www.w3.org/1999/xlink','href')).filter(Boolean);
  if(imageSources.length!==9)throw Error('Original nine embedded image layers required.');
  await Promise.all(imageSources.map(async src=>{
   const image=new Image();image.src=src;
   if(typeof image.decode==='function')await image.decode();
   else await new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)return resolve();image.onload=resolve;image.onerror=reject;});
   if(!image.naturalWidth||!image.naturalHeight)throw Error('Failed to decode a native PNG layer.');
  }));
  if(document.fonts?.ready)await document.fonts.ready;
  svg.getBoundingClientRect();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  phase='closed';desiredOpen=false;
  button.classList.add('is-ready');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  button.disabled=false;
  announcement.textContent='Backpack ready.';
 }catch(err){phase='error';button.disabled=true;announcement.textContent='Animation unavailable.';console.error('THREADS T03 native playback',err)}
})();
