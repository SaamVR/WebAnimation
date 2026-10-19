/**
 * THREADS T02 V3 — a temporary transparent product-image proxy, caught by the real header cart.
 * The approved T01 implementation is untouched. Only call after addCartItem succeeds.
 */
import {loadMotionLibrary} from './t02-motion-runtime.mjs';
import {cartCount} from './store-core.mjs';

const NS='http://www.w3.org/2000/svg';
const ORIGIN_IMAGE='[data-t02-image]';
let active=null,revision=0;

/**
 * Articulate the EXISTING raster cart icon in its EXISTING navigation link.
 * Reuse exact PNG pixels in three separately transformable SVG groups.
 * Clipping at the actual wheel separation preserves color, silhouette, size.
 */
export function installArticulatedHeaderCart(){
 const anchor=document.getElementById('bag-button');
 if(!anchor)return null;
 const existing=anchor.querySelector('#t02-real-cart');
 if(existing)return existing;
 const original=anchor.querySelector('img.header-icon[src*="header-cart.png"]');
 if(!original)return null;
 const markup='<svg id="t02-real-cart" class="header-icon t02-real-cart" viewBox="0 0 384 317" xmlns="'+NS+'" aria-hidden="true" focusable="false">'+
  '<defs><clipPath id="t02-basket-clip"><rect x="0" y="0" width="384" height="238"/></clipPath>'+
  '<clipPath id="t02-left-clip"><circle cx="137" cy="274" r="37"/></clipPath>'+
  '<clipPath id="t02-right-clip"><circle cx="285" cy="274" r="37"/></clipPath></defs>'+
  '<g id="cart-basket"><image href="/assets/header-cart.png" width="384" height="317" clip-path="url(#t02-basket-clip)"/></g>'+
  '<g id="cart-wheel-left"><image href="/assets/header-cart.png" width="384" height="317" clip-path="url(#t02-left-clip)"/></g>'+
  '<g id="cart-wheel-right"><image href="/assets/header-cart.png" width="384" height="317" clip-path="url(#t02-right-clip)"/></g></svg>';
 original.outerHTML=markup;
 return anchor.querySelector('#t02-real-cart');
}


// Commit state is immediately announced to assistive technology while the
// *existing visible badge* is held until the physical basket contact.
let badgeHeld=false;
const badgeNode=()=>document.getElementById('bag-count');
export function prepareCartBadge(){
 const badge=badgeNode();
 if(!badge)return;
 badgeHeld=true;
}
export function syncCartVisual(count=cartCount()){
 const badge=badgeNode(),link=document.getElementById('bag-button');
 if(link)link.setAttribute('aria-label','View shopping cart, '+count+' items');
 const announcement=document.getElementById('t02-cart-status');
 if(announcement&&announcement.dataset.lastCount!==String(count)){
  announcement.dataset.lastCount=String(count);
  announcement.textContent=count+' items in shopping cart';
 }
 if(badge&&!badgeHeld)badge.textContent=String(count);
}
export function settleCartBadge({animate=false}={}){
 badgeHeld=false;
 const badge=badgeNode();
 syncCartVisual(cartCount());
 if(animate&&badge)badge.animate?.([
  {transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}
 ],{duration:250,easing:'cubic-bezier(.2,.75,.25,1)'});
}

function visible(rect){
 return rect.width>12&&rect.height>12&&rect.top>=0&&rect.left>=0&&
 rect.bottom<=innerHeight+2&&rect.right<=innerWidth+2;
}
function mediaFor(button){
 return button.closest('.product-card,.store-product-card')?.querySelector(ORIGIN_IMAGE) ||
  (document.body.dataset.page==='product'&&document.querySelector('.store-detail__image'+ORIGIN_IMAGE));
}
function resetCartParts(){
 const svg=document.getElementById('t02-real-cart');
 for(const id of ['cart-basket','cart-wheel-left','cart-wheel-right'])
  svg?.querySelector('#'+id)?.style.removeProperty('transform');
 badgeNode()?.style.removeProperty('transform');
}
function stop(){
 const prior=active;active=null;
 if(prior){
  prior.timeline?.kill();
  prior.layer?.remove();
  prior.button?.style.removeProperty('transform');
 }
 resetCartParts();
}
export function cancelT02(){revision++;stop();settleCartBadge()}

/** Keep the existing V2 mobile camera and sticky original cart behavior. */
async function cameraScroll(to,version,duration=.39){
 const from=scrollY,limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const target=Math.max(0,Math.min(limit,to));
 if(Math.abs(from-target)<3)return;
 const started=performance.now();
 await new Promise(done=>{
  const frame=now=>{
   if(revision!==version){done();return;}
   const t=Math.min(1,(now-started)/(duration*1000));
   const e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
   scrollTo({left:0,top:from+(target-from)*e,behavior:'instant'});
   if(t<1)requestAnimationFrame(frame);else done();
  };
  requestAnimationFrame(frame);
 });
}
/**
 * Clone only the CURRENT displayed transparent source image. Do not clone the
 * beige product card, media border, thumbnail panel, or product button.
 */
function buildFlightImage(frame,img){
 const fr=frame.getBoundingClientRect(),computed=getComputedStyle(img);
 const wrap=document.createElement('div');
 wrap.id='t02-motion-layer';wrap.className='t02-motion-layer';
 wrap.setAttribute('aria-hidden','true');
 const proxy=document.createElement('div');
 proxy.id='t02-product-proxy';proxy.className='t02-product-proxy';
 Object.assign(proxy.style,{left:fr.left+'px',top:fr.top+'px',
  width:fr.width+'px',height:fr.height+'px'});
 const clone=document.createElement('img');
 clone.id='t02-flight-image';
 clone.src=img.currentSrc||img.src;clone.alt='';clone.decoding='sync';clone.draggable=false;
 Object.assign(clone.style,{
  width:computed.width,height:computed.height,maxHeight:computed.maxHeight,
  minHeight:computed.minHeight,maxWidth:computed.maxWidth,
  objectFit:'contain',objectPosition:computed.objectPosition,
  padding:computed.padding,boxSizing:computed.boxSizing,
  transform:computed.transform==='none'?'none':computed.transform,
  transformOrigin:computed.transformOrigin
 });
 proxy.append(clone);wrap.append(proxy);document.body.append(wrap);
 return {wrap,proxy,clone,rect:fr};
}

/** Called only after verified synchronous addCartItem() mutation. */
export async function playT02({button,quantity}={}){
 const version=++revision;
 stop();
 const svg=installArticulatedHeaderCart(),frame=button&&mediaFor(button);
 const finish=()=>{if(version===revision)settleCartBadge({animate:true});};
 if(!button?.isConnected||!frame||!svg||!Number.isInteger(quantity)||quantity<1){finish();return;}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
 const originalScroll=scrollY;
 let cameraMoved=false;
 if(!visible(frame.getBoundingClientRect())&&document.body.dataset.page==='product'){
  const rect=frame.getBoundingClientRect();
  await cameraScroll(scrollY+rect.top-75,version,.40);
  if(version!==revision||!frame.isConnected||!svg.isConnected)return;
  cameraMoved=Math.abs(scrollY-originalScroll)>4;
 }
 const frameRect=frame.getBoundingClientRect(),cartRect=svg.getBoundingClientRect();
 const img=frame.querySelector('img');
 if(!img||!img.complete||!img.naturalWidth||!visible(frameRect)||!visible(cartRect)){
  if(cameraMoved)await cameraScroll(originalScroll,version,.28);
  finish();return;
 }
 const basket=svg.querySelector('#cart-basket');
 const left=svg.querySelector('#cart-wheel-left'),right=svg.querySelector('#cart-wheel-right');
 if(!basket||!left||!right){finish();return;}
 const gs=await loadMotionLibrary();
 if(version!==revision)return;
 if(!gs||!button.isConnected||!svg.isConnected){
  if(cameraMoved)await cameraScroll(originalScroll,version,.28);
  finish();return;
 }
 const {wrap,proxy,rect}=buildFlightImage(frame,img);
 const origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 const basketPoint={x:cartRect.left+cartRect.width*.65,y:cartRect.top+cartRect.height*.40};
 const dx=basketPoint.x-origin.x,dy=basketPoint.y-origin.y;
 const dimension=Math.max(rect.width,rect.height);
 // Measure the SAME cart that catches the product: the useful mouth is narrower
 // than the SVG viewBox. Fit the largest source-frame dimension within its opening.
 const basketMouth=Math.min(cartRect.width*.54,cartRect.height*.50);
 const entryScale=Math.min(.12,Math.max(.008,basketMouth*.82/dimension));
 const isDetail=document.body.dataset.page==='product';
 const headerBottom=document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
 // One shallow quadratic: control stays inside the viewport and above the
 // source→basket diagonal, sweeping through whitespace above product details.
 const arcControl={
  x:origin.x+dx*.14,
  y:Math.min(origin.y-20,Math.max(headerBottom+8,basketPoint.y+cartRect.height*.15))
 };
 const arcPath='M0,0 Q'+(arcControl.x-origin.x).toFixed(3)+','+
   (arcControl.y-origin.y).toFixed(3)+' '+dx.toFixed(3)+','+dy.toFixed(3);
 const timeline=gs.timeline({paused:true,onComplete:()=>{
  if(active?.version!==version)return;
  if(cameraMoved){
   active.restoring=true;
   void cameraScroll(originalScroll,version,.42).then(()=>{
    if(active?.version===version)stop();
   });
  }else stop();
 }});
 active={version,button,layer:wrap,timeline,restoring:false};
 gs.set(proxy,{x:0,y:0,scale:1,opacity:1,transformOrigin:'50% 50%',clipPath:'inset(0% 0% 0% 0%)'});
 gs.set([basket,left,right],{rotation:0,x:0,y:0});
 // Glow is applied only to the cloned cutout, not the stationary media frame.
 timeline.to(button,{scale:.965,duration:.09,ease:'power2.in'},0)
  .to(button,{scale:1,duration:.15,ease:'power2.out'},.09)
  .to(proxy,{filter:'drop-shadow(0 0 20px rgba(177,213,171,.9))',
    duration:.08,ease:'sine.out',yoyo:true,repeat:1},0)
  // Same duration/ease: PDP alone uses one quadratic Bézier. Every other
  // product card retains the *exact* original direct x/y tween.
  .to(proxy,isDetail?
    {motionPath:{path:arcPath,autoRotate:false},duration:.91,ease:'power2.inOut'}:
    {x:dx,y:dy,duration:.91,ease:'power2.inOut'},.12)
  // One uninterrupted monotonic scale tween: continuous shrinking, with a
  // smoothly increasing reduction rate over the final 25–30% of travel.
  .to(proxy,{scale:entryScale,duration:.91,
    ease:t=>.85*t+.15*t*t*t},.12)
  // Real unchanged V2 cart groups — only V3 timing is advanced to impact.
  .to(basket,{rotation:-6.2,duration:.20,svgOrigin:'218 226',ease:'power2.out'},.85)
  .to(left,{rotation:-13,duration:.17,svgOrigin:'137 274',ease:'power2.out'},.88)
  .to(right,{rotation:-13,duration:.17,svgOrigin:'285 274',ease:'power2.out'},.88)
  // Final cutout occlusion: progressive clipping on the real basket entry.
  .to(proxy,{y:dy+8,scale:entryScale*.47,
    clipPath:'inset(0% 0% 70% 0%)',opacity:0,duration:.25,ease:'power2.in'},1.03)
  .to(basket,{rotation:3.0,y:52,duration:.11,svgOrigin:'218 226',ease:'power2.in'},1.05)
  .to(left,{rotation:18,duration:.12,ease:'power2.out'},1.07)
  .to(right,{rotation:18,duration:.12,ease:'power2.out'},1.07)
  .to(basket,{rotation:-1.8,y:-13,duration:.17,ease:'power2.out'},1.16)
  .to(left,{rotation:-6,duration:.16,ease:'power2.out'},1.18)
  .to(right,{rotation:-6,duration:.16,ease:'power2.out'},1.18)
  .to(basket,{rotation:0,y:0,duration:.22,ease:'power2.out'},1.34)
  .to(left,{rotation:0,duration:.22,ease:'power2.out'},1.34)
  .to(right,{rotation:0,duration:.22,ease:'power2.out'},1.34)
  .call(()=>{if(active?.version===version)settleCartBadge({animate:true});},null,1.03)
  .to({}, {duration:.05},1.58);
 timeline.play();
 return timeline;
}
if(typeof window!=='undefined'){
 window.addEventListener('pagehide',cancelT02);
 window.addEventListener('resize',cancelT02,{passive:true});
 window.addEventListener('scroll',()=>{if(active&&!active.restoring)cancelT02()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelT02()});
}
