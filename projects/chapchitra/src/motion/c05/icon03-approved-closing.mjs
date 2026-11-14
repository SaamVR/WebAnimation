/* CHAPCHITRA C05 Icon03 — Gate B: reference-informed peel, rise, airborne flip, return.
   The SVG uses exactly the original authored vectors. No hand/shadow/geometry redraw.
   Gate A printing and lift keyframes are retained as the first 2.35 seconds. */
(() => {
 'use strict';
 const root = document.querySelector('#c05-stage svg');
 if(!root) throw new Error('Original C05 SVG not found');
 const floral=root.querySelector('#Wood_block');
 const reverse=root.querySelector('#Wood_x5F_Block_x5F_Flipped');
 const flower=root.querySelector('#Print_over_cloth');
 const cloth=root.querySelector('#Cloth');
 if (![floral,reverse,flower,cloth].every(Boolean)) throw new Error('Required original SVG groups missing');
 root.setAttribute('role','img');
 root.setAttribute('aria-label','Wood block presses, peels and rises, flips in the air to reveal its floral carving, and returns to the original position leaving the fabric print');
 const X=422,Y=410;
 // Measure the *visible cloth artwork* and print, never the square SVG viewBox.
 // The original SVG paths remain untouched; offset only the composed print group.
 const bounds=el=>{const b=el.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2}};
 const clothBounds=bounds(cloth), printBounds=bounds(flower), reverseBounds=bounds(reverse);
 const printOffset={x:clothBounds.cx-printBounds.cx,y:clothBounds.cy-printBounds.cy};
 const contactOffset={x:clothBounds.cx-reverseBounds.cx,y:clothBounds.cy-reverseBounds.cy};
 const INK_ONSET=0.35; // 0.34s: pressure hold ends; first measurable edge separation starts.
 flower.setAttribute('transform',`translate(${printOffset.x.toFixed(4)} ${printOffset.y.toFixed(4)})`);
 // Preserve drawing order: original ink below both original wood-block orientations.
 const reverseBox={cx:299.7462,cy:307.0716};
 const floralBox={cx:202.6719,cy:210.8468};
 const FLORAL_REST_OFFSET={dx:-10.366430,dy:-14.715201}; // Fixed outer pose translation; no timeline/keyframe changes.
 const LIFTED={cx:reverseBox.cx-13,cy:reverseBox.cy-176};
 const DURATION=4.25;
 const state={tx:0,ty:0,angle:0,flip:0,cx:LIFTED.cx,cy:LIFTED.cy,roll:0};
 flower.removeAttribute('clip-path'); // Do not mask, scale, fade, or redraw the ink.
 flower.style.opacity='1'; flower.style.visibility='hidden';
 let proofTime=0;
 // Moving pose on top of the stationary illustration, but never concurrently visible.
 root.appendChild(floral); root.appendChild(reverse);
 floral.style.display='none'; reverse.style.display='inline';
 const smooth=x=>{let u=Math.min(1,Math.max(0,x));return u*u*(3-2*u)};
 function interp(keys,t) {
   if(t<=keys[0][0]) return keys[0][1];
   for(let i=1;i<keys.length;i++) if(t<=keys[i][0]){
     let [b,vb]=keys[i], [a,va]=keys[i-1]; return va+(vb-va)*smooth((t-a)/(b-a));
   }
   return keys[keys.length-1][1];
 }
 // The constant contact offset aligns the already existing block and relocated ink.
 // Its separate positional-only correction eases away AFTER full contact, before the
 // approved airborne flip begins at 2.35s. Original GSAP rotation, scale, easing,
 // and keyframe geometry remain byte-for-byte unchanged.
 const contactWeight=t=>t<=1.55?1:(t>=2.35?0:1-smooth((t-1.55)/.80));
 function render(){
   // A DISCRETE event. 100% of the existing floral art appears together, under the block.
   flower.style.visibility=proofTime>=INK_ONSET?'visible':'hidden';
   if(state.flip<=0.00001){
      reverse.style.display='inline'; floral.style.display='none';
      const w=contactWeight(proofTime);
      reverse.setAttribute('transform',`translate(${(state.tx+contactOffset.x*w).toFixed(3)} ${(state.ty+contactOffset.y*w).toFixed(3)}) rotate(${state.angle.toFixed(3)} ${X} ${Y})`);
      return;
   }
   const faceIsFloral=state.flip>=0.5;
   const active=faceIsFloral?floral:reverse;
   const inactive=faceIsFloral?reverse:floral;
   inactive.style.display='none'; active.style.display='inline';
   const sy=Math.max(0.18,Math.abs(Math.cos(Math.PI*state.flip)));
   const native=faceIsFloral?floralBox:reverseBox;
   // One shared world pivot, with independently normalized original pose coordinates.
   // 0..90°: reverse contracts to edge-on; 90..180°: floral expands back out.
   active.setAttribute('transform',`${faceIsFloral?`translate(${FLORAL_REST_OFFSET.dx} ${FLORAL_REST_OFFSET.dy}) `:''}translate(${state.cx.toFixed(3)} ${state.cy.toFixed(3)}) rotate(${state.roll.toFixed(3)}) scale(1 ${sy.toFixed(4)}) translate(${-native.cx.toFixed(3)} ${-native.cy.toFixed(3)})`);
 }
 function referenceAt(t){
   state.tx=interp([[0,0],[.34,0],[.80,0],[1.55,-8],[2.06,-13],[DURATION,-13]],t);
   state.ty=interp([[0,0],[.14,1.2],[.34,1.2],[.80,-3],[1.55,-133],[2.06,-176],[DURATION,-176]],t);
   state.angle=interp([[0,0],[.34,0],[.80,11.5],[1.55,3],[2.06,0],[DURATION,0]],t);
   proofTime=t;
   state.flip=interp([[0,0],[2.35,0],[3.17,1],[DURATION,1]],t);
   state.cx=interp([[0,LIFTED.cx],[2.35,LIFTED.cx],[2.78,275],[3.17,267],[3.93,floralBox.cx],[DURATION,floralBox.cx]],t);
   state.cy=interp([[0,LIFTED.cy],[2.35,LIFTED.cy],[2.78,108],[3.17,118],[3.93,floralBox.cy],[DURATION,floralBox.cy]],t);
   state.roll=interp([[0,0],[2.35,0],[2.72,-4],[3.17,2],[3.93,0],[DURATION,0]],t);
   render();
 }
 const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const usingGSAP=!!(window.gsap&&typeof window.gsap.timeline==='function');
 let tl=null;
 if(usingGSAP){
   tl=gsap.timeline({paused:true,onUpdate:render});
   // Original physical press/edge-lift/separation motions from approved Gate A.
   tl.to(state,{ty:1.2,duration:.14,ease:'sine.inOut'},0)
     .to(state,{angle:11.5,ty:-3,duration:.46,ease:'power2.inOut'},.34)
     .to(state,{tx:-8,angle:3,ty:-133,duration:.75,ease:'power2.inOut'},.80)
     .to(state,{tx:-13,angle:0,ty:-176,duration:.51,ease:'power2.out'},1.55)
     // No ink tween: reveal the COMPLETE impression at the first separation frame.
     .set(flower,{visibility:'visible'},INK_ONSET)
     .to(state,{tx:-13,duration:.29,ease:'none'},2.06)
     // Only after full separation: edge-on rotation in the air.
     .to(state,{flip:.5,cx:275,cy:108,roll:-4,duration:.43,ease:'sine.inOut'},2.35)
     .to(state,{flip:1,cx:267,cy:118,roll:2,duration:.39,ease:'sine.inOut'},2.78)
     // Original floral face returns to its exact authored SVG placement.
     .to(state,{cx:floralBox.cx,cy:floralBox.cy,roll:0,duration:.76,ease:'power2.inOut'},3.17)
     .to(state,{cx:floralBox.cx,duration:.32,ease:'none'},3.93);
   tl.pause(0);
 }
 const el=id=>document.getElementById(id);
 const clock=el('clock'),scrub=el('scrub'),engine=el('engine-status');
 if(engine)engine.textContent=usingGSAP?'GSAP 3.15 timeline active':'Offline reference mode (GSAP unavailable)';
 let fallbackTime=0,raf=0,last=0;
 function updateClock(t){if(clock)clock.textContent=`${t.toFixed(2)} / ${DURATION.toFixed(2)} s`;if(scrub)scrub.value=String(t)}
 function seek(v){const t=Math.max(0,Math.min(DURATION,Number(v)||0));proofTime=t; if(usingGSAP){tl.pause().time(t,false);render()}else{fallbackTime=t;referenceAt(t)}updateClock(t)}
 function pause(){if(usingGSAP)tl.pause();else{cancelAnimationFrame(raf);raf=0}}
 function fallbackRun(now){if(!last)last=now;fallbackTime=Math.min(DURATION,fallbackTime+Math.min(.06,(now-last)/1000));last=now;referenceAt(fallbackTime);updateClock(fallbackTime);raf=fallbackTime<DURATION?requestAnimationFrame(fallbackRun):0}
 function play(){if(reduced){seek(DURATION);return}if(usingGSAP){if(tl.time()>=DURATION)tl.time(0);tl.play()}else{if(fallbackTime>=DURATION)fallbackTime=0;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(fallbackRun)}}
 el('play')?.addEventListener('click',play);
 el('pause')?.addEventListener('click',pause);
 el('replay')?.addEventListener('click',()=>{pause();seek(0);play()});
 scrub?.addEventListener('input',()=>{pause();seek(scrub.value)});
 if(usingGSAP)tl.eventCallback('onUpdate',()=>{proofTime=tl.time();render();updateClock(proofTime)});
 if(reduced)seek(DURATION);else seek(0);
 window.C05GateB={seek,play,pause,duration:DURATION,status:()=>({usingGSAP,reduced,time:usingGSAP?tl.time():fallbackTime,state:{...state},reverseVisible:reverse.style.display!=='none',floralVisible:floral.style.display!=='none',printVisible:flower.style.visibility==='visible',printOpacity:Number(flower.style.opacity),printOffset:{...printOffset},clothBounds:{...clothBounds},printBounds:{...printBounds},contactOffset:{...contactOffset},contactWeight:contactWeight(proofTime),flowerTransform:flower.getAttribute('transform'),reverseTransform:reverse.getAttribute('transform')}),destroy:()=>{pause();tl?.kill();window.C05GateB=null}};
})();
