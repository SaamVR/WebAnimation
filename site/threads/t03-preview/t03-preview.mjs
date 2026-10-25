/**
 * THREADS T03 isolated creative preview.
 * The original SVG is reassembled byte-for-byte from its 13 GitHub transport shards;
 * all seven authored animation CSS tracks and keyframes are left intact.
 */
const SHARDS=13;
const SVG_URL=i=>'/assets/t03/backpack-animated.part-'+String(i).padStart(2,'0')+'.txt';
const KEY='threads.t03.demo.result.v1';
const OUTCOMES=['5% OFF','7% OFF','10% OFF','Better Luck Next Time!'];
const OPEN_TIME_MS=4000; // 50% of supplied SVG's existing 8s timeline = fully opened plateau.
const $=id=>document.getElementById(id);
const stage=$('t03-stage'),bag=$('t03-bag-trigger'),vector=$('t03-vector');
const resetButton=$('t03-reset'),status=$('t03-result'),coupon=$('t03-coupon'),cardLabel=$('t03-card-label');
let svg,tracks=[],phase='loading',timer=0,cachedResult=null;

function savedResult(){
 if(cachedResult!==null)return cachedResult;
 try{const n=Number(sessionStorage.getItem(KEY));if(sessionStorage.getItem(KEY)!==null&&Number.isInteger(n)&&n>=0&&n<4)return cachedResult=n}catch{}
 const bytes=new Uint8Array(1);
 const index=globalThis.crypto?.getRandomValues?(crypto.getRandomValues(bytes),bytes[0]%4):Math.floor(Math.random()*4);
 cachedResult=index;
 try{sessionStorage.setItem(KEY,String(index))}catch{}
 return index;
}
const activeAnimations=()=>svg?svg.getAnimations({subtree:true}):[];
function seek(t){
 const running=activeAnimations();
 for(const a of running){try{a.pause();a.currentTime=t}catch{}}
 for(const el of tracks)el.style.animationPlayState='paused';
}
function reset(){
 if(phase==='loading')return;
 clearTimeout(timer);phase='closed';
 coupon.classList.remove('is-visible');coupon.setAttribute('aria-hidden','true');
 cardLabel.textContent='Mystery';status.textContent='Tap the backpack to reveal your surprise.';
 status.dataset.empty='true';bag.disabled=false;bag.setAttribute('aria-label','Open backpack to discover a surprise');
 resetButton.disabled=true;seek(0);
}
function reveal(){
 if(phase!=='opening')return;
 seek(OPEN_TIME_MS);
 phase='opened';
 const result=OUTCOMES[savedResult()];cardLabel.textContent=result;
 coupon.setAttribute('aria-hidden','false');
 requestAnimationFrame(()=>coupon.classList.add('is-visible'));
 status.dataset.empty='false';
 status.textContent=result==='Better Luck Next Time!'?'Better Luck Next Time! · Demo only':result+' · Your demo surprise';
 bag.disabled=true;resetButton.disabled=false;
}
function open(){
 if(phase!=='closed')return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){phase='opening';reveal();return}
 phase='opening';bag.disabled=true;status.textContent='Unpacking your luck…';
 for(const a of activeAnimations()){try{a.currentTime=0;a.play()}catch{}}
 for(const el of tracks)el.style.animationPlayState='running';
 // Original 8s loop would close between 50–90%. Stop at the unchanged fully-open frame.
 timer=setTimeout(reveal,OPEN_TIME_MS);
}
bag.addEventListener('click',open);
resetButton.addEventListener('click',reset);
document.addEventListener('visibilitychange',()=>{
 // Correct any scheduling drift when tab is backgrounded; do not let supplied SVG close.
 if(phase==='opening' && !document.hidden){const t=activeAnimations()[0]?.currentTime;if(typeof t==='number'&&t>=OPEN_TIME_MS)reveal();}
});
(async()=>{
 try{
  const fragments=await Promise.all(Array.from({length:SHARDS},(_,i)=>fetch(SVG_URL(i),{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Asset shard '+i+' HTTP '+r.status);return r.text()})));
  const source=fragments.join('');
  if(!source.startsWith("<?xml")||!source.includes('id="lid-outside-motion"')||!source.includes('anim-lid-inside-motion'))throw Error('Supplied SVG is incomplete');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  if(doc.querySelector('parsererror'))throw Error('Supplied SVG failed XML parse');
  svg=document.importNode(doc.documentElement,true);
  svg.setAttribute('aria-label','Illustrated closed backpack with animated hinged flap');
  svg.setAttribute('focusable','false');
  svg.removeAttribute('width');svg.removeAttribute('height');
  tracks=['lid-outside-motion','lid-inside-motion','collar-motion','buckle-left-motion','buckle-right-motion','handle-motion','main-body'].map(id=>{
   const el=svg.querySelector('#'+id);if(!el)throw Error('Missing original SVG track '+id);
   el.style.animationIterationCount='1';el.style.animationFillMode='both';el.style.animationPlayState='paused';
   return el;
  });
  vector.replaceChildren(svg);
  phase='closed';reset();
 }catch(err){
  phase='error';status.dataset.empty='false';status.textContent='Could not load the supplied SVG: '+err.message;
  console.error('THREADS T03 asset load',err);
 }
})();
