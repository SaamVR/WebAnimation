/**
 * THREADS T03 — Stage A ONLY.
 * Non-destructive image-layer opening study. No promotional cards or fabricated offers.
 * Owner artwork is under /assets/t03-backpack-{closed,open}-original.png.
 * These two references are the only source artwork.
 */
import {loadMotionLibrary} from './t02-motion-runtime.mjs';
const trigger=document.getElementById('t03-backpack-trigger');
const stage=document.getElementById('t03-stage');
const caption=document.getElementById('t03-backpack-state');
const cta=document.querySelector('#deal .threads-deal__copy .pill');
let progress='closed',busy=false,timeline=null;
if(trigger&&stage){
 const closed=stage.querySelector('.t03-flap-closed');
 const opened=stage.querySelector('.t03-flap-open');
 const under=stage.querySelector('.t03-base-open');
 const left=stage.querySelector('.t03-buckle-left');
 const right=stage.querySelector('.t03-buckle-right');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const setAccessible=(open)=>{
  trigger.setAttribute('aria-expanded',String(open));
  trigger.setAttribute('aria-label',open?'Close the illustrated backpack':'Open the illustrated backpack');
  caption.textContent=open?'Backpack open':'Backpack closed';
 };
 const setup=async()=>{
  const gs=await loadMotionLibrary();
  if(!gs)return;
  gs.set(opened,{rotationX:-84,visibility:'hidden',transformOrigin:'56% 24%'});
  gs.set(closed,{rotationX:0,y:0,transformOrigin:'56% 15%'});
  gs.set(under,{clipPath:'circle(0% at 57% 32%)'});
  gs.set([left,right],{rotation:0,x:0,y:0,autoAlpha:1});
  timeline=gs.timeline({
   paused:true,
   onComplete:()=>{opened.style.visibility='hidden';progress='open';busy=false;setAccessible(true)},
   onReverseComplete:()=>{progress='closed';busy=false;setAccessible(false)}
  });
  // Anticipation: minimal global flex, without moving unrelated props separately.
  timeline.to(stage,{y:-3,rotation:-.35,duration:.16,ease:'sine.inOut'},0)
   .to(stage,{y:0,rotation:0,duration:.22,ease:'power2.out'},.17)
   // Both original fasteners visibly release before opening.
   .to(left,{x:-7,y:10,rotation:-12,duration:.28,ease:'power2.out'},.12)
   .to(right,{x:8,y:9,rotation:11,duration:.28,ease:'power2.out'},.16)
   // Flap rotates away in 3D around its upper joint. Both textures are separate,
   // not an opacity crossfade between two complete images.
   .to(closed,{rotationX:-89,y:-31,duration:.72,ease:'power2.inOut'},.33)
   // Reveal happens BEHIND the lifting flap, through an SVG/CSS clipping window.
   .to(under,{clipPath:'circle(160% at 57% 32%)',duration:.75,ease:'power2.inOut'},.42)
   .set(opened,{visibility:'visible'},.75)
   .to(opened,{rotationX:0,duration:.56,ease:'power2.out'},.77)
   .to(left,{autoAlpha:0,duration:.12},.87)
   .to(right,{autoAlpha:0,duration:.12},.87)
   .to({}, {duration:.07},1.39);
 };
 const ready=setup();
 async function toggle(){
  await ready;if(!timeline||busy)return;
  busy=true;
  if(reduced.matches){
   const go=progress!=='open';
   timeline.progress(go?1:0).pause();
   progress=go?'open':'closed';busy=false;setAccessible(go);
   return;
  }
  if(progress==='closed'){timeline.timeScale(1).play(0)}
  else {opened.style.visibility='visible';timeline.timeScale(1).reverse()}
 }
 trigger.addEventListener('click',()=>void toggle());
 // Existing promotional CTA also triggers Stage A for an ordinary click.
 // Modified-click navigation to the existing Shop destination remains available.
 cta?.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();void toggle();
 });
 window.addEventListener('pagehide',()=>{timeline?.pause()},{once:true});
}
