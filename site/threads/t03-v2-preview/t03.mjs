/** THREADS T03: use the exact 5.2-second owner SVG as supplied, without editing tracks. */
const SOURCE_URL='./assets/backpack_animated%20(2).svg';
const RESULT_KEY='threads.t03.reward.v2';
const OPEN_AT=0.5*5200; // Source's 50%–65% fully opened hold.
const CLOSE_FROM=0.65*5200; // Source's existing authored close begins at 65%.
const END_AT=5200;
const $=id=>document.getElementById(id);
const button=$('t03-bag-trigger'),vector=$('t03-svg-holder'),coupon=$('t03-coupon'),rewardText=$('t03-reward'),announcement=$('t03-announcement');
let animations=[],phase='loading',activeTimer=0,transitionStarted=0,transitionEnd=0;
let savedReward=null;
// Last click wins; changes requested while a native SVG segment plays are queued.
let targetOpen=false;
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
function seek(time,play=false){
 for(const animation of animations){
  try{animation.pause();animation.currentTime=time;if(play)animation.play()}catch(err){console.warn('T03 animation seek failed',err)}
 }
}
function schedule(fn,ms){
 clearTimeout(activeTimer);
 transitionStarted=performance.now();transitionEnd=transitionStarted+ms;
 activeTimer=setTimeout(fn,ms);
}
function syncOnReturn(){
 if(phase!=='opening'&&phase!=='closing')return;
 const remaining=transitionEnd-performance.now();
 if(remaining<=0){clearTimeout(activeTimer);phase==='opening'?opened():closed()}
}
function opened(){
 if(phase!=='opening')return;
 clearTimeout(activeTimer);seek(OPEN_AT);
 phase='opened';button.setAttribute('aria-expanded','true');button.setAttribute('aria-busy','false');
 if(!targetOpen){close();return;}
 button.setAttribute('aria-label','Close backpack');
 rewardText.textContent=selectReward();coupon.classList.add('is-visible');coupon.setAttribute('aria-hidden','false');announcement.textContent=rewardText.textContent;
}
function closed(){
 if(phase!=='closing')return;
 clearTimeout(activeTimer);seek(0);
 phase='closed';button.setAttribute('aria-expanded','false');button.setAttribute('aria-busy','false');button.setAttribute('aria-label','Open backpack');
 announcement.textContent='Backpack closed.';
 if(targetOpen)open();
}
function open(){
 if(phase!=='closed')return;
 phase='opening';button.setAttribute('aria-busy','true');button.setAttribute('aria-label','Close backpack after opening');
 coupon.classList.remove('is-visible');coupon.setAttribute('aria-hidden','true');
 seek(0,true);
 // Original SVG 0–50% timeline. No reconstructed transforms or timing.
 schedule(opened,OPEN_AT);
}
function close(){
 if(phase!=='opened')return;
 phase='closing';button.setAttribute('aria-busy','true');button.setAttribute('aria-label','Open backpack after closing');
 coupon.classList.remove('is-visible');coupon.setAttribute('aria-hidden','true');
 // Original SVG 65–100% closing keyframes, not a reverse or redraw.
 seek(CLOSE_FROM,true);
 schedule(closed,END_AT-CLOSE_FROM);
}
button.addEventListener('click',()=>{
 if(phase==='loading'||phase==='error')return;
 targetOpen=!targetOpen;
 if(phase==='closed'&&targetOpen)open();
 else if(phase==='opened'&&!targetOpen)close();
 // During motion, queue the latest desired state instead of disabling or dropping clicks.
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncOnReturn()});
window.addEventListener('pageshow',syncOnReturn);
(async()=>{
 try{
  const url=globalThis.__THREADS_T03_EMBEDDED_SVG__||SOURCE_URL;
  const response=await fetch(url);
  if(!response.ok)throw new Error('SVG unavailable ('+response.status+')');
  const source=await response.text();
  if(!source.includes('--dur: 5.2s')||!source.includes('id="outer-hood-hinge-group"')||!source.includes('data:image/png;base64,'))throw Error('Incorrect backpack asset; exact 5.2s source required.');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  if(doc.querySelector('parsererror'))throw Error('Supplied SVG cannot be parsed.');
  const svg=document.importNode(doc.documentElement,true);
  svg.removeAttribute('width');svg.removeAttribute('height');
  svg.setAttribute('role','img');svg.setAttribute('aria-label','THREADS backpack opening and closing');svg.setAttribute('focusable','false');
  // Move the existing HTML coupon behind the original raised flap, with a stationary SVG depth mask, not above
  // the bag. This inserts a runtime foreignObject; the owner's SVG file, image
  // nodes, seven animation tracks, styles, and keyframes remain byte-identical.
  const ns='http://www.w3.org/2000/svg',front=svg.querySelector('#open-flap-group');
  const couponLayer=document.createElementNS(ns,'foreignObject');
  for(const [key,value] of Object.entries({x:'1083',y:'470',width:'445',height:'380'}))couponLayer.setAttribute(key,value);
  couponLayer.setAttribute('class','t03-coupon-depth');
  couponLayer.style.overflow='visible';couponLayer.style.pointerEvents='none';
  // An SVG user-space clipping plane hides the lower card behind the rim.
  // It masks only the runtime coupon, never the owner's artwork or motion.
  const clipDefs=document.createElementNS(ns,'defs');
  const depthClip=document.createElementNS(ns,'clipPath');
  depthClip.setAttribute('id','t03-coupon-opening-mask');
  depthClip.setAttribute('clipPathUnits','userSpaceOnUse');
  const cut=document.createElementNS(ns,'rect');
  for(const [key,value] of Object.entries({x:'1083',y:'470',width:'445',height:'118'}))cut.setAttribute(key,value);
  depthClip.appendChild(cut);clipDefs.appendChild(depthClip);svg.insertBefore(clipDefs,svg.firstChild);
  couponLayer.setAttribute('clip-path','url(#t03-coupon-opening-mask)');
  // Keep coupon in its existing layout tree until all assets are prepared.
  // Insert it after the interior collar but before the authored open-flap layer at readiness.
  for(const node of svg.querySelectorAll('#backpack-scene,#top-handle-group,#lower-straps-group,#open-collar-group,#outer-hood-hinge-group,#buckles-unclip-group,#open-flap-group')){
   node.style.animationIterationCount='1';node.style.animationFillMode='both';node.style.animationPlayState='paused';
  }
  vector.replaceChildren(svg);
  animations=svg.getAnimations({subtree:true});
  if(animations.length!==7)throw Error('Expected seven unmodified animation tracks; got '+animations.length);
  seek(0);
  // Safari can present the first CSS transform before PNG data-URI images have
  // decoded. Decode all ten full-resolution embedded layers before interaction.
  const imageSources=[...svg.querySelectorAll('image')].map(el=>el.getAttribute('href')||el.getAttributeNS('http://www.w3.org/1999/xlink','href')).filter(Boolean);
  if(imageSources.length!==10)throw Error('The original ten embedded PNG layers are required.');
  await Promise.all(imageSources.map(async src=>{
   const image=new Image();image.src=src;
   if(typeof image.decode==='function')await image.decode();
   else await new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth)return resolve();image.onload=resolve;image.onerror=reject;});
   if(!image.naturalWidth||!image.naturalHeight)throw Error('Failed to decode a backpack PNG layer.');
  }));
  if(document.fonts?.ready)await document.fonts.ready;
  // Force a closed-frame layout and two paints before accepting the first tap.
  svg.getBoundingClientRect();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  seek(0);
  if(!front?.parentNode)throw Error('Original raised flap layer not found.');
  front.parentNode.insertBefore(couponLayer,front);
  couponLayer.appendChild(coupon);
  phase='closed';targetOpen=false;
  button.classList.add('is-ready');
  // The first paint with the SVG visible must complete before a tap can
  // start its seven transform animations; two frames cross that paint boundary.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  button.disabled=false;
  announcement.textContent='Backpack ready.';
 }catch(err){phase='error';button.disabled=true;announcement.textContent='Animation unavailable.';console.error('THREADS T03 source',err)}
})();
