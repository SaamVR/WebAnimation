/** THREADS T03: use the owner's final 5-second postcard SVG as supplied, without editing tracks. */
const SOURCE_URL='./assets/backpack_animated_postcard.svg';
const RESULT_KEY='threads.t03.reward.v2';
const OPEN_AT=0.5*5000; // Source postcard display hold: 41%–62%.
const CLOSE_FROM=0.62*5000; // Source's existing authored close begins after its 62% hold.
const END_AT=5000;
const $=id=>document.getElementById(id);
const button=$('t03-bag-trigger'),vector=$('t03-svg-holder'),announcement=$('t03-announcement');
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
 announcement.textContent=displayReward();
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
 seek(0,true);
 // Original SVG 0–50% timeline. No reconstructed transforms or timing.
 schedule(opened,OPEN_AT);
}
function close(){
 if(phase!=='opened')return;
 phase='closing';button.setAttribute('aria-busy','true');button.setAttribute('aria-label','Open backpack after closing');
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
  if(!source.includes('--dur: 5s')||!source.includes('id="popout-card-group"')||!source.includes('id="rimPocketClip"')||!source.includes('data:image/png;base64,'))throw Error('Incorrect final postcard animation source.');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  if(doc.querySelector('parsererror'))throw Error('Owner SVG cannot be parsed.');
  const svg=document.importNode(doc.documentElement,true);
  svg.removeAttribute('width');svg.removeAttribute('height');
  svg.setAttribute('role','img');svg.setAttribute('aria-label','THREADS backpack opening and closing');svg.setAttribute('focusable','false');
  populatePostcard(svg,displayReward());
  // Animation ownership remains with the source's nine group CSS animations.
  const animatedIds=['backpack-scene','buckle-left','buckle-right','closed-flap-group','top-handle-group','open-collar-back-group','open-collar-front-rim-group','open-flap-group','popout-card-group'];
  for(const id of animatedIds){
   const node=svg.getElementById(id);
   if(!node)throw Error('Missing original animated group: '+id);
   node.style.animationIterationCount='1';node.style.animationFillMode='both';node.style.animationPlayState='paused';
  }
  vector.replaceChildren(svg);
  animations=svg.getAnimations({subtree:true});
  if(animations.length!==animatedIds.length)throw Error('Expected nine native animation tracks; got '+animations.length);
  seek(0);
  // Safari can present the first CSS transform before PNG data-URI images have
  // decoded. Decode all original embedded layers before interaction.
  const imageSources=[...svg.querySelectorAll('image')].map(el=>el.getAttribute('href')||el.getAttributeNS('http://www.w3.org/1999/xlink','href')).filter(Boolean);
  if(imageSources.length!==9)throw Error('The owner's nine embedded PNG layers are required.');
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
  phase='closed';targetOpen=false;
  button.classList.add('is-ready');
  // The first paint with the SVG visible must complete before a tap can
  // start its seven transform animations; two frames cross that paint boundary.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  button.disabled=false;
  announcement.textContent='Backpack ready.';
 }catch(err){phase='error';button.disabled=true;announcement.textContent='Animation unavailable.';console.error('THREADS T03 source',err)}
})();
