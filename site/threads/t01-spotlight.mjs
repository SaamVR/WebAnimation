/**
 * T01 — THREADS spotlight discovery, intentionally isolated from the catalog,
 * the original functional header button and all future T02/T03/T04 hooks.
 * Uses locally vendored GSAP + MotionPathPlugin; never animates product photos.
 */
const ROOT='/vendor/';
let libraries;
function loadMotionLibrary(){
 if(libraries)return libraries;
 const load=src=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=ROOT+src;script.async=false;
  script.onload=resolve;script.onerror=()=>reject(new Error('Motion asset unavailable: '+src));
  document.head.append(script);
 });
 libraries=load('gsap.min.js').then(()=>load('MotionPathPlugin.min.js')).then(()=>{
  const {gsap,MotionPathPlugin}=window;
  if(!gsap||!MotionPathPlugin)throw new Error('GSAP motion runtime unavailable');
  gsap.registerPlugin(MotionPathPlugin);
  return gsap;
 }).catch(()=>null); // Functional catalog remains available if motion library fails.
 return libraries;
}
const MIN_VIEW=120;
const center=r=>({x:r.left+r.width*.5,y:r.top+r.height*.5});
const point=(x,y)=>({x:x-32,y:y-30});
function rankProduct(product,query) {
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean).map(t=>t.endsWith('s')&&t.length>4?t.slice(0,-1):t);
 const name=product.name.toLowerCase(),subtitle=product.subtitle.toLowerCase();
 const tags=(product.tags||[]).join(' ').toLowerCase(),category=product.category.toLowerCase();
 return terms.reduce((score,term)=>score+
  (name.includes(term)?7:0)+(subtitle.includes(term)?3:0)+
  (category.includes(term)?2:0)+(tags.includes(term)?1:0),0)
  +(name.includes(query.trim().toLowerCase())?10:0);
}
function eligibleGeometry(node){
 const media=node.querySelector('.store-product-card__media')||node;
 const rect=media.getBoundingClientRect();
 return rect.width>70&&rect.height>70&&rect.top<innerHeight-35&&rect.bottom>MIN_VIEW&&rect.left<innerWidth-15&&rect.right>15
   ?{node,rect,pos:point(rect.left+rect.width*.5,rect.top+rect.height*.44)}:null;
}
function sourceAnchor(){
 const button=document.getElementById('search-button');
 if(!button)return null;
 const icon=button.querySelector('img')||button;
 return {button,icon,...point(...Object.values(center(icon.getBoundingClientRect())))};
}
function curved(from,to,amount=35){
 const mx=(from.x+to.x)/2,my=(from.y+to.y)/2;
 const dx=to.x-from.x,dy=to.y-from.y;
 const norm=Math.hypot(dx,dy)||1;
 const off=Math.min(Math.abs(amount),Math.max(26,norm*.24));
 return [{x:from.x,y:from.y},{x:mx-dy/norm*off,y:my+dx/norm*off},{x:to.x,y:to.y}];
}
function makeStage(){
 const el=document.createElement('div');el.id='t01-spotlight-layer';el.className='t01-spotlight-layer';el.setAttribute('aria-hidden','true');
 el.innerHTML=`<svg class="t01-light-field" width="100%" height="100%" aria-hidden="true">
  <defs><mask id="t01-cutout"><rect width="100%" height="100%" fill="#fff"/><circle id="t01-hole" cx="0" cy="0" r="0" fill="#000"/></mask>
   <radialGradient id="t01-warm"><stop offset="0" stop-color="#ffdea2" stop-opacity=".55"/><stop offset=".55" stop-color="#f1d29a" stop-opacity=".25"/><stop offset="1" stop-color="#f0d9aa" stop-opacity="0"/></radialGradient></defs>
  <rect id="t01-veil" width="100%" height="100%" fill="#152922" opacity="0" mask="url(#t01-cutout)"/>
  <circle id="t01-warm-circle" cx="0" cy="0" r="140" fill="url(#t01-warm)" opacity="0"/>
 </svg>
 <div id="t01-glass" class="t01-glass">
  <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
   <defs><radialGradient id="t01-lens"><stop offset="0" stop-color="#fff9e9" stop-opacity=".36"/><stop offset="1" stop-color="#ffdd93" stop-opacity=".14"/></radialGradient></defs>
   <path d="M45 43L63 61" stroke="#1b3029" stroke-width="12" stroke-linecap="round"/>
   <path d="M47 45L62 60" stroke="#506957" stroke-width="4" stroke-linecap="round"/>
   <circle cx="32" cy="30" r="22" fill="#f6ecd5" stroke="#1d3d30" stroke-width="7"/>
   <circle cx="32" cy="30" r="17" fill="url(#t01-lens)" stroke="#ad8860" stroke-opacity=".45" stroke-width="1.6"/>
   <path d="M21 21Q26 15 34 16" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".84"/>
   <path d="M29 12Q37 9 44 17" stroke="#e9d99c" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  </svg>
 </div>`;
 document.body.append(el);
 return {el,glass:el.querySelector('#t01-glass'),hole:el.querySelector('#t01-hole'),warm:el.querySelector('#t01-warm-circle'),veil:el.querySelector('#t01-veil')};
}
export function initT01Spotlight({root=document}={}){
 let current=null,revision=0,destroyed=false,timer=0;
 const status=document.createElement('span');status.id='t01-discovery-status';status.className='sr-only';status.setAttribute('role','status');
 root.getElementById('results-grid')?.parentElement?.append(status);
 let rm=window.matchMedia('(prefers-reduced-motion: reduce)');
 const clear=()=>{
  clearTimeout(timer);
  if(current){
   // Mark detached before kill(): GSAP synchronously fires onInterrupt.
   // A second cleanup must never recursively kill this same timeline.
   const previous=current;
   current=null;
   previous.timeline?.kill();
   previous.gsap?.set(previous.target,{clearProps:'transform,boxShadow,filter'});
   previous.target?.classList.remove('t01-discovered');
   if(previous.icon)previous.icon.style.removeProperty('opacity');
   previous.stage?.el.remove();
  }
  root.querySelectorAll('.t01-reduced-discovery').forEach(n=>n.classList.remove('t01-reduced-discovery'));
  status.textContent='';
 };
 const cancel=()=>{revision++;clear()};
 function choose(query,products){
  const ranked=new Map(products.map(p=>[p.id,p]));
  const available=[...root.querySelectorAll('#results-grid [data-t01-card]')]
   .map(eligibleGeometry).filter(Boolean)
   .filter(item=>ranked.has(item.node.dataset.productId));
  available.sort((a,b)=>{
    const score=rankProduct(ranked.get(b.node.dataset.productId),query)-rankProduct(ranked.get(a.node.dataset.productId),query);
    return score||a.node.dataset.productId.localeCompare(b.node.dataset.productId);
  });
  const target=available[0],scans=available.filter(a=>a!==target);
  scans.sort((a,b)=>a.rect.top-b.rect.top||a.rect.left-b.rect.left);
  return {target,scans:scans.slice(0,innerWidth<700?1:2)};
 }
 function revealReduced(query,products){
  const {target}=choose(query,products);
  if(!target)return;
  target.node.classList.add('t01-reduced-discovery');
  status.textContent='Highlighted match: '+products.find(p=>p.id===target.node.dataset.productId)?.name;
  timer=setTimeout(()=>target.node.classList.remove('t01-reduced-discovery'),1150);
 }
 async function run(query,products,version){
  if(version!==revision||destroyed||!products.length||!query.trim())return;
  await (document.fonts?.ready||Promise.resolve());
  await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
  if(version!==revision||destroyed)return;
  if(rm.matches){revealReduced(query,products);return;}
  const {target,scans}=choose(query,products),anchor=sourceAnchor();
  if(!target||!anchor)return; // No visible, genuine result: no false discovery.
  const gsap=await loadMotionLibrary();
  if(version!==revision||destroyed||!gsap)return;
  const s=makeStage();
  const original={x:anchor.x,y:anchor.y};
  const icon=anchor.icon;
  gsap.set(s.glass,{x:original.x,y:original.y,scale:.29,rotation:0,opacity:1,transformOrigin:'32px 30px'});
  gsap.set(s.el,{autoAlpha:1});
  icon.style.opacity='0';
  const viewportRadius=innerWidth<700?82:115;
  const spotlight=()=>{
   const x=+gsap.getProperty(s.glass,'x')+32;
   const y=+gsap.getProperty(s.glass,'y')+30;
   s.hole.setAttribute('cx',x);s.hole.setAttribute('cy',y);
   s.warm.setAttribute('cx',x);s.warm.setAttribute('cy',y);
  };
  const timeline=gsap.timeline({paused:true,onUpdate:spotlight,onComplete:clear,onInterrupt:clear});
  current={timeline,gsap,target:target.node,stage:s,icon};
  const waypoints=[...scans,target];
  const start={...original};
  timeline.to(s.glass,{rotation:-16,x:original.x-10,y:original.y-8,scale:.4,duration:.19,ease:'power2.out'});
  timeline.to(s.glass,{x:original.x+7,y:original.y-27,rotation:12,scale:.82,duration:.22,ease:'back.out(1.9)'});
  timeline.to(s.veil,{attr:{opacity:.22},duration:.28},'<');
  timeline.to(s.hole,{attr:{r:viewportRadius},duration:.3},'<');
  timeline.to(s.warm,{attr:{opacity:.92,r:viewportRadius*1.35},duration:.28},'<');
  let here={x:original.x+7,y:original.y-27};
  const scanDuration=waypoints.length===1?.67:waypoints.length===2?.52:.43;
  for(let i=0;i<waypoints.length;i++){
    const step=waypoints[i],last=i===waypoints.length-1;
    timeline.to(s.glass,{motionPath:{path:curved(here,step.pos,i%2?-64:62),curviness:1,autoRotate:false},
      rotation:last?0:(-9+(i%2)*19),scale:last?1.12:1,duration:last?.53:scanDuration,ease:last?'power3.out':'power2.inOut'});
    if(!last){
      timeline.to(s.glass,{rotation:i%2?-13:9,scale:1.04,duration:.13,ease:'sine.inOut'});
      timeline.to(s.glass,{rotation:i%2?-7:4,duration:.09,ease:'sine.out'});
    }
    here=step.pos;
  }
  timeline.add(()=>{
   target.node.classList.add('t01-discovered');
   status.textContent='Discovered '+products.find(p=>p.id===target.node.dataset.productId)?.name;
  });
  timeline.to(target.node,{scale:1.035,y:-5,boxShadow:'0 16px 32px rgba(32,67,45,.19),0 0 0 2px rgba(173,139,76,.78)',duration:.23,ease:'back.out(1.5)'},'<');
  timeline.to(s.glass,{rotation:5,scale:1.17,duration:.3,ease:'sine.inOut'},'<');
  timeline.to(s.warm,{attr:{opacity:1},duration:.3},'<');
  timeline.to({}, {duration:.4});
  timeline.to(target.node,{scale:1,y:0,boxShadow:'0 9px 20px rgba(23,43,46,.08)',duration:.22,ease:'power2.inOut'});
  timeline.to(s.glass,{motionPath:{path:curved(here,start,-98),curviness:1,autoRotate:false},
    rotation:-10,scale:.62,duration:.67,ease:'power2.inOut'},'<');
  timeline.to(s.hole,{attr:{r:0},duration:.52,ease:'power2.in'},'<+.11');
  timeline.to(s.warm,{attr:{opacity:0,r:0},duration:.52},'<');
  timeline.to(s.veil,{attr:{opacity:0},duration:.42},'<');
  timeline.to(s.glass,{x:start.x,y:start.y,rotation:0,scale:.29,opacity:0,duration:.18,ease:'power2.out'});
  // 3.87s authored beats at 1.16x settle in ~3.34s on desktop.
  timeline.timeScale(1.16).play();
 }
 function schedule(query,products){
  cancel();const version=revision;
  if(!String(query||'').trim()||!products?.length)return;
  Promise.resolve().then(()=>run(query,products,version)).catch(()=>{if(version===revision)clear()});
 }
 const scroll=()=>{if(current)cancel()};
 const resize=()=>cancel();
 const away=()=>{destroyed=true;cancel()};
 window.addEventListener('resize',resize,{passive:true});
 window.addEventListener('scroll',scroll,{passive:true});
 window.addEventListener('pagehide',away,{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 return {schedule,cancel,cleanup:away};
}
