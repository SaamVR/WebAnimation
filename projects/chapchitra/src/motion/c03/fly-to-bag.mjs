/**
 * CHAPCHITRA C03 — approved Product Fly-to-Bag, site-wide catalog activation.
 *
 * Source motion contract: approved THREADS T02 V3 at
 * release/threads-demo-complete-20261026:site/threads/t02-fly-cart.mjs
 * Original product remains still. A temporary, transparent cutout alone flies
 * along one shallow quadratic; its scale decreases continuously. On arrival
 * the *existing* bag and quantity respond. No mutation of session bag here.
 *
 * New owner direction replaces the *planned* C03 Brass Bell treatment.
 * Nothing touches notification controls, THREADS source, C02 or C05.
 */
import {planC03Flight,shrinkAt} from './geometry.mjs';
import {holdNavbarForBag} from '../../nav-scroll.mjs';

const ROOT='/motion/c03/';
let gsapPromise=null,active=null,serial=0,listenersReady=false,flightWatchTimer=0,pendingHold=null,ackTimer=0;
const prefersReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureCSS(){
 if(document.querySelector('link[data-c03-css]'))return;
 const sheet=document.createElement('link');
 sheet.rel='stylesheet';sheet.href=ROOT+'fly-to-bag.css';sheet.dataset.c03Css='';
 document.head.append(sheet);
}
function getGSAP(){
 if(window.gsap?.timeline)return Promise.resolve(window.gsap);
 if(gsapPromise)return gsapPromise;
 gsapPromise=new Promise(resolve=>{
  const script=document.createElement('script');
  script.src=ROOT+'vendor/gsap.min.js';script.async=true;script.dataset.c03Gsap='';
  script.onload=()=>resolve(window.gsap?.timeline?window.gsap:null);
  script.onerror=()=>resolve(null);document.head.append(script);
 });
 return gsapPromise;
}
function stopFlightWatch(){
 if(flightWatchTimer){clearInterval(flightWatchTimer);flightWatchTimer=0;}
}
// Native resize/scroll events are not guaranteed by headless or mobile WebKit.
// While a C03 overlay exists, compare *actual* viewport and scroll geometry on
// animation frames. An interruption always cancels the same existing GSAP
// timeline; this does not change the approved motion curve or timings.
function watchFlightGeometry(version){
 stopFlightWatch();
 const start={width:innerWidth,height:innerHeight,scroll:scrollY,
  visualWidth:window.visualViewport?.width,visualHeight:window.visualViewport?.height};
 const inspect=()=>{
  if(active?.version!==version){stopFlightWatch();return;}
  const resized=innerWidth!==start.width||innerHeight!==start.height||
   (start.visualWidth!=null&&Math.abs((window.visualViewport?.width??start.visualWidth)-start.visualWidth)>2)||
   (start.visualHeight!=null&&Math.abs((window.visualViewport?.height??start.visualHeight)-start.visualHeight)>2);
  const moved=Math.abs(scrollY-start.scroll)>4;
  if(resized||moved){cancelC03();return;}
 };
 // WebKit can suppress both native resize events and animation frames during
 // a programmatic viewport change. A temporary 40ms timer runs only while
 // the flight exists, and is always cleared by cleanup().
 flightWatchTimer=window.setInterval(inspect,40);
}
function cleanup(){
 stopFlightWatch();
 const current=active;active=null;
 if(!current)return;
 current.timeline?.kill();
 current.hold?.release();
 current.path?.remove();current.layer?.remove();
 const gs=window.gsap;
 if(gs){
  if(current.bag)gs.killTweensOf(current.bag);
  if(current.badge)gs.killTweensOf(current.badge);
  if(current.bag)gs.set(current.bag,{clearProps:'transform'});
  if(current.badge)gs.set(current.badge,{clearProps:'transform'});
 }
}
export function cancelC03(){
 serial++;
 clearTimeout(ackTimer);ackTimer=0;pendingHold?.release();pendingHold=null;
 cleanup();
}
// Never programmatically scroll the customer to reveal artwork.
const framesSettled=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
function installLifecycle(){
 if(listenersReady)return;listenersReady=true;
 window.addEventListener('pagehide',cancelC03);
 window.addEventListener('resize',cancelC03,{passive:true});
 // A moving viewport invalidates one-shot rect measurements. Cancel; never
 // counter-scroll the user's page (unlike the optional T02 camera follow).
 window.addEventListener('scroll',()=>{if(active||pendingHold)cancelC03()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelC03()});
 window.matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener?.('change',cancelC03);
}
export function warmC03(){
 ensureCSS();installLifecycle();
 return getGSAP();
}
// Resolve the illustration from the exact clicked product, never a global
// first-card selector. Filtered, related and favorites cards share this markup.
export function resolveC03ProductSource(button,productId){
 if(!button?.isConnected||!productId||button.dataset.addToBag!==productId)return null;
 const card=button.closest('.product-card[data-product-id]');
 if(card){
  if(card.dataset.productId!==productId)return null;
  return card.querySelector('.product-visual .shirt-svg, .product-visual img');
 }
 // Product Detail has a distinct source outside its related-products cards.
 if(button.classList.contains('detail-add-button')&&button.closest('.detail-layout')){
  return document.querySelector('.detail-layout .detail-art .shirt-svg, .detail-layout .detail-art img');
 }
 return null;
}
function makeCutout(source,rect,geometry){
 const layer=document.createElement('div');layer.className='c03-flight-layer';
 layer.setAttribute('aria-hidden','true');layer.dataset.c03Flight='';
 const cloneBox=document.createElement('div');cloneBox.className='c03-flight-cutout';
 cloneBox.style.width=geometry.widthPx+'px';
 cloneBox.style.height=geometry.heightPx+'px';
 cloneBox.style.opacity='0';
 const art=source.cloneNode(true);
 art.removeAttribute('id');art.setAttribute('aria-hidden','true');
 art.setAttribute('focusable','false');art.setAttribute('draggable','false');
 if(art.tagName.toLowerCase()==='img')art.alt='';
 cloneBox.append(art);
 // Native SVG quadratic path length is used for the GSAP-driven coordinates.
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('aria-hidden','true');svg.classList.add('c03-flight-path');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',geometry.path);
 svg.append(path);layer.append(cloneBox,svg);document.body.append(layer);
 return {layer,cloneBox,path};
}
export async function playC03({button,productId}={}){
 // Cart commits independently. Acquire the next lease before cancelling the old proxy.
 if(!button?.isConnected)return false;
 const headerEl=document.querySelector('.site-header');
 if(prefersReduced()&&headerEl?.dataset.ccScrollNav!=='hidden'&&!pendingHold)return false;
 const hold=holdNavbarForBag(headerEl);
 cancelC03();pendingHold=hold;
 const version=serial,initialScroll=scrollY;
 const abandon=()=>{if(pendingHold===hold)pendingHold=null;hold.release();return false};
 const acknowledgeOnly=()=>{if(!hold.wasHidden||version!==serial)return abandon();ackTimer=window.setTimeout(()=>{ackTimer=0;abandon()},650);return false};
 try{
 ensureCSS();installLifecycle();
 if(prefersReduced()){if(!await hold.ready||version!==serial)return abandon();return acknowledgeOnly()}
 const gs=await getGSAP();
 if(!gs||version!==serial||!button.isConnected||document.hidden||prefersReduced())return abandon();
 if(!await hold.ready||version!==serial)return abandon();
 await framesSettled();
 if(version!==serial||!button.isConnected||Math.abs(scrollY-initialScroll)>4)return abandon();
 const source=resolveC03ProductSource(button,productId);
 const bagLink=document.querySelector('.site-header .bag-link');
 const badge=bagLink?.querySelector('.bag-count');
 const icon=bagLink?.querySelector('.cc-nav-art, svg');
 if(!source||!bagLink||!badge||!icon)return acknowledgeOnly();
 const sourceRect=source.getBoundingClientRect(),bagRect=bagLink.getBoundingClientRect();
 const header=headerEl.getBoundingClientRect();
 if(headerEl.dataset.ccScrollNav==='hidden'||sourceRect.bottom<=header.bottom||sourceRect.top>=innerHeight)return acknowledgeOnly();
 const geometry=planC03Flight(sourceRect,bagRect,header,{width:innerWidth,height:innerHeight});
 if(!geometry)return acknowledgeOnly();
 const {layer,cloneBox,path}=makeCutout(source,sourceRect,geometry);
 const length=path.getTotalLength();
 if(!Number.isFinite(length)||length<=0){layer.remove();return abandon();}
 const progress={t:0};
 const paint=()=>{
  const t=Math.min(1,Math.max(0,progress.t));
  const point=path.getPointAtLength(length*t);
  const scale=1-(1-geometry.entryScale)*shrinkAt(t);
  gs.set(cloneBox,{
   x:point.x-geometry.widthPx/2,
   y:point.y-geometry.heightPx/2,
   scale,transformOrigin:'50% 50%'
  });
 };
 paint();
 const tl=gs.timeline({paused:true,onComplete:()=>{if(active?.version===version)cleanup()}});
 active={version,layer,path,timeline:tl,bag:icon,badge,hold};
 pendingHold=null;
 watchFlightGeometry(version);
 // THREADS T02 V3: 0.12s anticipation, 0.91s uninterrupted flight,
 // catch at 1.03s, restrained spring settling by ~1.55s.
 tl.to(cloneBox,{opacity:1,duration:.09,ease:'sine.out'},0)
   .to(cloneBox,{filter:'drop-shadow(0 0 14px rgba(41,61,45,.36))',
    duration:.12,yoyo:true,repeat:1,ease:'sine.out'},.06)
   .to(progress,{t:1,duration:.91,ease:'power2.inOut',onUpdate:paint},.12)
   .to(cloneBox,{opacity:0,duration:.16,ease:'power2.in'},1.00)
   .to(icon,{y:-5,rotation:-8,transformOrigin:'50% 65%',duration:.14,ease:'power2.out'},1.03)
   .to(icon,{y:4,rotation:3,duration:.14,ease:'power2.inOut'},1.17)
   .to(icon,{y:0,rotation:0,duration:.24,ease:'power2.out'},1.31)
   .to(badge,{scale:1.22,transformOrigin:'50% 50%',duration:.13,ease:'power2.out'},1.03)
   .to(badge,{scale:1,duration:.22,ease:'back.out(2)'},1.16)
   .to({}, {duration:.04},1.55);
 if(hold.wasHidden)tl.to({}, {duration:.38},1.59);
 tl.play();
 return true;
 }catch(error){if(active?.version===version)cleanup();return abandon()}
}
