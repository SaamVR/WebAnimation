/**
 * THREADS T02 V2 — a single symbolic token, caught by the real header cart.
 * The approved T01 implementation is untouched. Only call after addCartItem succeeds.
 */
import {loadMotionLibrary} from './t02-motion-runtime.mjs';

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

function visible(rect){
 return rect.width>12&&rect.height>12&&rect.top>=0&&rect.left>=0&&
 rect.bottom<=innerHeight+2&&rect.right<=innerWidth+2;
}
function sourceFor(button){
 return button.closest('.product-card')?.querySelector(ORIGIN_IMAGE) ||
   document.querySelector('.store-detail__image'+ORIGIN_IMAGE);
}
function badgeFeedback(badge){
 if(!badge)return;
 badge.animate?.([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],
  {duration:230,easing:'ease-out'});
}
function resetCartParts(){
 const icon=document.getElementById('t02-real-cart');
 for(const id of ['cart-basket','cart-wheel-left','cart-wheel-right']){
  icon?.querySelector('#'+id)?.style.removeProperty('transform');
 }
 document.getElementById('bag-count')?.style.removeProperty('transform');
}
function stop(){
 const old=active;active=null;
 if(old){
  old.timeline?.kill();
  old.layer?.remove();
  old.button?.style.removeProperty('transform');
 }
 resetCartParts();
}
export function cancelT02(){revision++;stop()}

function flightPath(from,to,viewportWidth){
 const dx=to.x-from.x,dy=to.y-from.y;
 // The reference's readable lift → broad sweep → short descending basket entry.
 // Even on mobile, waypoints are generated from measured screen geometry.
 const side=Math.sign(dx)||1;
 const approachY=Math.max(10,to.y-28);
 return [
  {x:from.x,y:from.y},
  {x:from.x+dx*.12,y:from.y-Math.min(100,Math.max(60,Math.abs(dy)*.22))},
  {x:from.x+dx*.38,y:Math.max(16,to.y+Math.max(56,Math.abs(dy)*.14))},
  {x:to.x-side*Math.min(Math.abs(dx)*.23,viewportWidth*.17),y:approachY},
  {x:to.x,y:to.y}
 ];
}
/**
 * When the original product presentation is offscreen on mobile, the browser
 * briefly follows the actual page back to that same image. The image stays
 * stationary in document coordinates, while the REAL sticky cart remains in
 * the original header. After the catch, we return to the user's scroll point.
 * Never create a second image/cart or invent an on-screen origin.
 */
async function cameraScroll(to,version,duration=.42){
 const from=window.scrollY;
 const limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const target=Math.max(0,Math.min(limit,to));
 if(Math.abs(from-target)<3)return;
 const started=performance.now();
 return new Promise(resolve=>{
  const frame=now=>{
   if(version!==revision){resolve();return;}
   const t=Math.min(1,(now-started)/(duration*1000));
   const e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
   scrollTo({left:0,top:from+(target-from)*e,behavior:'instant'});
   if(t<1)requestAnimationFrame(frame);else resolve();
  };
  requestAnimationFrame(frame);
 });
}
/** Once cart state has changed, paint motion without changing the product image. */
export async function playT02({button,quantity,badge=document.getElementById('bag-count')}={}){
 const version=++revision;
 stop();
 const svg=installArticulatedHeaderCart();
 const source=button&&sourceFor(button);
 if(!button?.isConnected||!svg||!source||!Number.isInteger(quantity)||quantity<1)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){badgeFeedback(badge);return;}
 const originScroll=window.scrollY;
 let cameraMoved=false;
 // Product page mobile: camera moves to the REAL image, never a proxy.
 if(document.body.dataset.page==='product' && innerWidth<=760
    && !visible(source.getBoundingClientRect())){
  const rect=source.getBoundingClientRect();
  const desired=window.scrollY+rect.top-75;
  await cameraScroll(desired,version,.43);
  if(version!==revision||!source.isConnected||!svg.isConnected)return;
  cameraMoved=Math.abs(window.scrollY-originScroll)>4;
 }
 const imageRect=source.getBoundingClientRect(),cartRect=svg.getBoundingClientRect();
 // No fake catch when any real geometry is unavailable.
 if(!visible(imageRect)||!visible(cartRect)){
  if(cameraMoved)await cameraScroll(originScroll,version,.35);
  badgeFeedback(badge);return;
 }
 const basket=svg.querySelector('#cart-basket');
 const wheels=[svg.querySelector('#cart-wheel-left'),svg.querySelector('#cart-wheel-right')];
 if(!basket||wheels.some(w=>!w))return;
 const begin={x:imageRect.left+imageRect.width*.80,y:imageRect.top+imageRect.height*.78};
 // Center the token inside the actual transparent basket opening, behind its lip.
 const catchPoint={x:cartRect.left+cartRect.width*.66,y:cartRect.top+cartRect.height*.43};
 const gs=await loadMotionLibrary();
 if(version!==revision||!gs||!svg.isConnected||!button.isConnected){
  if(cameraMoved&&version===revision)await cameraScroll(originScroll,version,.35);
  return;
 }
 const layer=document.createElement('div');
 layer.id='t02-motion-layer';layer.className='t02-motion-layer';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<span id="t02-token" class="t02-token"></span>';
 document.body.append(layer);
 const token=layer.querySelector('#t02-token');
 const r=16;
 const start={x:begin.x-r,y:begin.y-r};
 const end={x:catchPoint.x-r,y:catchPoint.y-r};
 const route=flightPath({x:start.x,y:start.y-37},end,innerWidth);
 gs.set(token,{x:start.x,y:start.y,autoAlpha:0,scale:.18,transformOrigin:'50% 50%'});
 gs.set([basket,...wheels],{rotation:0,x:0,y:0});
 const tl=gs.timeline({paused:true,onComplete:()=>{
  if(active?.version!==version)return;
  if(cameraMoved){
   active.restoring=true;
   void cameraScroll(originScroll,version,.44).then(()=>{
    if(active?.version===version)stop();
   });
  }else stop();
 }});
 active={version,button,layer,timeline:tl,restoring:false};
 tl.to(button,{scale:.965,duration:.10,ease:'power2.in'},0)
   .to(button,{scale:1,duration:.19,ease:'power2.out'},.10)
   .to(token,{autoAlpha:1,scale:1,duration:.20,ease:'back.out(1.5)'},.07)
   .to(token,{y:start.y-37,duration:.22,ease:'power2.out'},.23)
   // A continuous sweeping asymmetrical arc, resolved against current geometry.
   .to(token,{motionPath:{path:route,curviness:1.12,autoRotate:false},
     scale:.24,duration:.98,ease:'power2.inOut'},.35)
   .to(basket,{rotation:-6.2,duration:.20,svgOrigin:'218 226',ease:'power2.out'},.88)
   .to(wheels[0],{rotation:-13,duration:.16,svgOrigin:'137 274',ease:'power2.out'},.96)
   .to(wheels[1],{rotation:-13,duration:.16,svgOrigin:'285 274',ease:'power2.out'},.96)
   // A final downward movement into, not across, the real basket opening.
   .to(token,{y:end.y+7,scale:.12,autoAlpha:0,duration:.14,ease:'power2.in'},1.30)
   .to(basket,{rotation:3.0,y:52,duration:.11,svgOrigin:'218 226',ease:'power2.in'},1.33)
   .to(wheels[0],{rotation:18,duration:.12,ease:'power2.out'},1.34)
   .to(wheels[1],{rotation:18,duration:.12,ease:'power2.out'},1.34)
   .to(basket,{rotation:-1.8,y:-13,duration:.17,ease:'power2.out'},1.44)
   .to(wheels[0],{rotation:-6,duration:.16,ease:'power2.out'},1.46)
   .to(wheels[1],{rotation:-6,duration:.16,ease:'power2.out'},1.46)
   .to(basket,{rotation:0,y:0,duration:.22,ease:'power2.out'},1.61)
   .to(wheels[0],{rotation:0,duration:.22,ease:'power2.out'},1.62)
   .to(wheels[1],{rotation:0,duration:.22,ease:'power2.out'},1.62)
   .call(()=>{if(active?.version===version&&badge){
     gs.fromTo(badge,{scale:1},{scale:1.17,duration:.13,repeat:1,yoyo:true,
       ease:'power2.out',transformOrigin:'center center'});
   }},null,1.39)
   .to({}, {duration:.08},1.81);
 tl.play();
 return tl;
}
if(typeof window!=='undefined'){
 window.addEventListener('pagehide',cancelT02);
 window.addEventListener('resize',cancelT02,{passive:true});
 window.addEventListener('scroll',()=>{if(active&&!active.restoring)cancelT02()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelT02()});
}
