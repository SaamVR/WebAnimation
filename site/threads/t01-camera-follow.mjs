/**
 * T01 Camera Follow — additive viewport camera only.
 * Does not edit T01 choreography, GSAP timeline, targets, easing, paths,
 * spotlight intensity/size or approved illustration assets.
 */
export function installT01CameraFollow(){
 const OBSERVED='#t01-spotlight-layer';
 let active=null,raf=0,request=null;
 const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
 const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
 const setCamera=(top)=>{
  const where=clamp(top,0,maxScroll());
  request=where;
  window.scrollTo({top:where,left:window.scrollX,behavior:'instant'});
 };
 // T01 intentionally cancels on USER scroll. Intercept only exact camera
 // scroll positions during an active T01 stage; preserve user cancellation.
 const onScrollCapture=e=>{
  if(!active||request===null)return;
  if(Math.abs(window.scrollY-request)<=2.5){
   e.stopImmediatePropagation();
   request=null;
  }else{
   request=null; // A touch, wheel, keyboard or browser navigation is not ours.
   detach(false);
  }
 };
 window.addEventListener('scroll',onScrollCapture,{capture:true,passive:true});
 function detach(restore=true){
  if(!active)return;
  const {initial,htmlBehavior,wrapper,hole,warm,originalHole,originalWarm}=active;
  active=null;
  cancelAnimationFrame(raf);
  if(wrapper?.isConnected)wrapper.replaceWith(...wrapper.childNodes);
  if(hole?.isConnected)hole.setAttribute('transform',originalHole);
  if(warm?.isConnected)warm.setAttribute('transform',originalWarm);
  document.documentElement.style.scrollBehavior=htmlBehavior;
  if(restore&&Math.abs(window.scrollY-initial)>2){
   // The GSAP return leg already moves the camera back. Only a tiny
   // precision correction should remain when the timeline finishes.
   setCamera(initial);
  }
  request=null;
 }
 function track(){
  if(!active)return;
  const {stage,glass,wrapper,hole,warm,initial}=active;
  if(!stage.isConnected){detach(true);return;}
  const gsap=window.gsap;
  if(gsap){
   const y=Number(gsap.getProperty(glass,'y'));
   if(Number.isFinite(y)){
    // A comfortable lower safe zone, leaving room for the spotlight.
    const viewport=window.visualViewport?.height||window.innerHeight;
    const lower=Math.max(140,Math.min(viewport-72,viewport*.67));
    const cameraOffset=Math.max(0,y+30-lower);
    const desired=clamp(initial+cameraOffset,0,maxScroll());
    const current=window.scrollY;
    const delta=desired-current;
    if(Math.abs(delta)>.16){
     const next=Math.abs(delta)<.7?desired:current+delta*.23;
     setCamera(next);
    }
    const offset=window.scrollY-initial;
    // Correct only the *presentation* of the existing fixed overlay.
    // Its authored GSAP coordinates still refer to the initial viewport.
    wrapper.style.transform='translate3d(0,'+(-offset)+'px,0)';
    hole.setAttribute('transform','translate(0 '+(-offset)+')');
    warm.setAttribute('transform','translate(0 '+(-offset)+')');
   }
  }
  raf=requestAnimationFrame(track);
 }
 function attach(stage){
  if(active||!stage?.isConnected)return;
  const glass=stage.querySelector('#t01-glass');
  const hole=stage.querySelector('#t01-hole'),warm=stage.querySelector('#t01-warm-circle');
  if(!glass||!hole||!warm)return;
  const wrapper=document.createElement('div');
  wrapper.className='t01-camera-presentation';
  wrapper.style.cssText='position:absolute;inset:0;pointer-events:none;will-change:transform';
  glass.replaceWith(wrapper);wrapper.append(glass);
  const html=document.documentElement;
  active={stage,glass,wrapper,hole,warm,initial:window.scrollY,
   htmlBehavior:html.style.scrollBehavior,originalHole:hole.getAttribute('transform')||'',
   originalWarm:warm.getAttribute('transform')||''};
  html.style.scrollBehavior='auto'; // window scrollTo must not queue CSS smooth steps.
  raf=requestAnimationFrame(track);
 }
 const observer=new MutationObserver(()=>{
  const stage=document.querySelector(OBSERVED);
  if(stage&&!active)attach(stage);
  else if(!stage&&active)detach(true);
 });
 observer.observe(document.body,{childList:true,subtree:false});
 const first=document.querySelector(OBSERVED);if(first)attach(first);
 window.addEventListener('pagehide',()=>{observer.disconnect();detach(false)}, {once:true});
}
