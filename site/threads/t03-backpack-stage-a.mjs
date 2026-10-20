/**
 * THREADS T03 Stage A — playful, reversible flap reveal.
 * The original owner PNGs remain pixel-exact; straps and fasteners never detach.
 * Stage B / promotional offer cards intentionally absent.
 */
import {loadMotionLibrary} from './t02-motion-runtime.mjs';

const trigger=document.querySelector('#t03-backpack-trigger');
const stage=document.querySelector('#t03-stage');
const status=document.querySelector('#t03-backpack-state');
const deal=document.querySelector('#deal');

if(trigger&&stage&&deal){
 const base=stage.querySelector('.t03-base-closed');
 const body=stage.querySelector('.t03-body');
 const rim=stage.querySelector('.t03-rim');
 const underside=stage.querySelector('.t03-flap-underside');
 const rig=stage.querySelector('.t03-flap-rig');
 const flap=stage.querySelector('.t03-flap-exterior');
 const hardware=stage.querySelectorAll('.t03-buckle');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let master,invite,gsap,ready=false,pinned=false,hovered=false,invited=false;
 let mode='closed';

 const announce=open=>{
  mode=open?'open':'closed';
  trigger.setAttribute('aria-expanded',String(open));
  trigger.setAttribute('aria-label',open?'Close illustrated backpack':'Open illustrated backpack');
  status.textContent=open?'Backpack open':'Backpack closed';
 };
 const stopInvitation=()=>{
  if(!invite)return;
  invite.kill();invite=null;
  if(master?.progress()===0)gsap.set(rig,{rotationX:0,y:0});
 };
 const setEndpoint=(open)=>{
  if(!gsap)return;
  if(open){
   gsap.set([body,rim,underside],{autoAlpha:1});
   gsap.set(rig,{autoAlpha:0,rotationX:-104,y:-20});
  }else{
   gsap.set([body,rim,underside,rig],{autoAlpha:0});
   gsap.set(rig,{rotationX:0,y:0});
  }
  gsap.set(base,{autoAlpha:1});
  announce(open);
 };
 const setup=async()=>{
  gsap=await loadMotionLibrary();
  if(!gsap)return;
  gsap.set(base,{autoAlpha:1});
  gsap.set([body,rim,underside,rig],{autoAlpha:0});
  gsap.set(rig,{rotationX:0,y:0,transformOrigin:'59% 21%',transformPerspective:850});
  gsap.set(underside,{rotationX:-11,y:7,transformOrigin:'59% 23%',transformPerspective:850});
  gsap.set(flap,{autoAlpha:1});
  gsap.set(hardware,{autoAlpha:1}); // all three children of the SAME rig
  master=gsap.timeline({
   paused:true,
   onComplete:()=>{announce(true)},
   onReverseComplete:()=>{setEndpoint(false)}
  });
  // Gentle whole-bag invitation is separate; opening itself leaves the entire
  // unrelated cap/sneaker/bottle resting on the unchanged closed-image plate.
  master
   .set(rig,{autoAlpha:1},0)
   .to(body,{autoAlpha:1,duration:.24,ease:'sine.out'},.10)
   .to(rim,{autoAlpha:1,duration:.32,ease:'power1.out'},.30)
   .to(rig,{rotationX:-104,y:-20,duration:.87,ease:'power2.inOut'},.18)
   .to(rig,{autoAlpha:0,duration:.16,ease:'sine.in'},.95)
   .to(underside,{autoAlpha:1,rotationX:0,y:0,duration:.31,ease:'power2.out'},.80)
   .to(underside,{y:-2,duration:.10,ease:'sine.out'},1.08)
   .to(underside,{y:0,duration:.17,ease:'sine.inOut'},1.18);
  ready=true;
 };
 const prepared=setup();
 async function control(open){
  await prepared;
  if(!ready)return;
  stopInvitation();
  if(reduce.matches){
   master.pause(open?master.duration():0);
   setEndpoint(open);
   return;
  }
  if(open){
   master.play();
  }else{
   // GSAP reverses its actual current playhead even while mid-flight.
   master.reverse();
  }
 }
 const openForHover=()=>{
  hovered=true;
  if(!pinned)void control(true);
 };
 const closeForLeave=()=>{
  hovered=false;
  if(!pinned)void control(false);
 };
 trigger.addEventListener('pointerenter',event=>{
  if(event.pointerType==='mouse')openForHover();
 });
 trigger.addEventListener('pointerleave',event=>{
  if(event.pointerType==='mouse')closeForLeave();
 });
 trigger.addEventListener('click',()=>{
  pinned=!pinned;
  void control(pinned);
 });
 trigger.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();
   pinned=false;hovered=false;void control(false);
  }
 });
 async function inviteOnce(){
  await prepared;
  if(invited||!ready||reduce.matches||pinned||hovered||master.progress()>0)return;
  invited=true;
  invite=gsap.timeline({onComplete:()=>{invite=null}});
  invite.set(rig,{autoAlpha:1},0)
   .to(rig,{rotationX:-11,y:-3,duration:.27,ease:'sine.out'},0)
   .to(rig,{rotationX:0,y:0,duration:.43,ease:'elastic.out(1,.8)'},.28)
   .set(rig,{autoAlpha:0},.72);
 }
 const observer=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.26)){
   observer.disconnect();
   void inviteOnce();
  }
 },{threshold:[0,.26,.6]});
 observer.observe(deal);
 window.addEventListener('pagehide',()=>{invite?.kill();master?.pause();observer.disconnect()},{once:true});
}
