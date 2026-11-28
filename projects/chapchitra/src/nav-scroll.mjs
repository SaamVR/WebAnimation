const bagHolds=new WeakMap();
// Direction-only state machine: no DOM access, no timers, no layout writes.
export function createNavScrollState(initialY=0){
 let last=Math.max(0,initialY),direction=0,distance=0,hidden=false;
 return {restore(y,wasHidden=false){last=Math.max(0,y);direction=0;distance=0;hidden=wasHidden&&last>16;return hidden?'hidden':last<=16?'pinned':'visible'},step(y,{pinned=false}={}){
  y=Math.max(0,y);const delta=y-last;last=y;
  if(pinned||y<=16){direction=0;distance=0;hidden=false;return 'pinned'}
  if(!delta)return hidden?'hidden':'visible';
  const sign=Math.sign(delta);
  if(sign!==direction){direction=sign;distance=0}
  distance+=Math.abs(delta);
  if(!hidden&&direction>0&&distance>=28&&y>48){hidden=true;distance=0}
  else if(hidden&&direction<0&&distance>=12){hidden=false;distance=0}
  return hidden?'hidden':'visible';
 }};
}
export function mountScrollNavbar(header,doc=document,view=window){
 if(!header||header.hasAttribute('data-cc-scroll-nav'))return ()=>{};
 const search=header.querySelector('#searchPanel'),menu=header.querySelector('#mobileNav'),root=doc.documentElement;
 const state=createNavScrollState(view.scrollY),controller=new AbortController(),{signal}=controller;
 let frame=0,mode='pinned',lastY=view.scrollY,maxY=Infinity,keyboard=false,disposed=false;
 let holds=0,restoreHidden=false,revealReady=null;
 const measure=()=>{maxY=Math.max(0,root.scrollHeight-root.clientHeight)};
 const y=()=>Math.max(0,Math.min(view.scrollY,maxY));
 const pinned=()=>!search?.hidden||!menu?.hidden||root.classList.contains('c02-pending')||
  (header.contains(doc.activeElement)&&(keyboard||doc.activeElement?.matches(':focus-visible')));
 const set=next=>{if(next===mode)return;mode=next;header.dataset.ccScrollNav=next};
 header.dataset.ccScrollNav=mode;measure();
 function update(){frame=0;if(disposed||holds)return;const current=y();const next=state.step(current,{pinned:pinned()});lastY=current;
  if(next==='hidden')set('hidden');else if(next==='pinned')set('pinned');else if(mode==='hidden')set('visible');
 }
 function schedule(){if(!frame)frame=view.requestAnimationFrame(update)}
 function force(){if(holds)return;state.step(y(),{pinned:true});set('pinned')}
 function sync(){if(pinned())force();else schedule()}
 const observer=new MutationObserver(sync);for(const el of [search,menu])if(el)observer.observe(el,{attributes:true,attributeFilter:['hidden']});
 observer.observe(root,{attributes:true,attributeFilter:['class']});
 const resize=new ResizeObserver(()=>{measure();schedule()});resize.observe(root);if(doc.body)resize.observe(doc.body);
 view.addEventListener('scroll',schedule,{passive:true,signal});
 view.addEventListener('resize',()=>{measure();schedule()},{passive:true,signal});
 doc.addEventListener('keydown',e=>{if(e.key==='Tab'){keyboard=true;force()}},{capture:true,signal});
 doc.addEventListener('pointerdown',()=>{keyboard=false},{capture:true,passive:true,signal});
 header.addEventListener('focusin',()=>{if(keyboard||doc.activeElement?.matches(':focus-visible')||pinned())force()},{signal});
 header.addEventListener('focusout',schedule,{signal});
 view.addEventListener('pageshow',()=>{measure();force()},{signal});
 bagHolds.set(header,()=>{
  if(disposed)return {ready:Promise.resolve(false),wasHidden:false,release(){}};
  if(holds++===0){
   restoreHidden=mode==='hidden';if(restoreHidden)set('visible');
   const animations=header.getAnimations?.().filter(a=>a.animationName==='cc-navbar-reveal'&&a.playState==='running')||[];
   revealReady=animations.length?Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>!disposed):Promise.resolve(!disposed);
  }
  let released=false;
  return {ready:revealReady,wasHidden:restoreHidden,release(){
   if(released)return;released=true;if(disposed)return;if(--holds>0)return;
   const current=y();lastY=current;
   if(pinned()||current<=16){state.restore(current,false);force()}else set(state.restore(current,restoreHidden));
   revealReady=null;restoreHidden=false;
  }};
 });
 function destroy(){disposed=true;bagHolds.delete(header);controller.abort();observer.disconnect();resize.disconnect();if(frame)view.cancelAnimationFrame(frame);delete header.dataset.ccScrollNav}
 view.addEventListener('pagehide',e=>{if(e.persisted)force();else destroy()},{signal});
 return destroy;
}

export function holdNavbarForBag(header){return bagHolds.get(header)?.()||{ready:Promise.resolve(false),wasHidden:false,release(){}}}
