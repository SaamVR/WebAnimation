/**
 * CHAPCHITRA C03 — owner-authorized Product Detail fly-to-bag prototype.
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

const ROOT='/motion/c03/';
let gsapPromise=null,active=null,serial=0,listenersReady=false;
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
function cleanup(){
 const current=active;active=null;
 if(!current)return;
 current.timeline?.kill();
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
 cleanup();
}
function installLifecycle(){
 if(listenersReady)return;listenersReady=true;
 window.addEventListener('pagehide',cancelC03);
 window.addEventListener('resize',cancelC03,{passive:true});
 // A moving viewport invalidates one-shot rect measurements. Cancel; never
 // counter-scroll the user's page (unlike the optional T02 camera follow).
 window.addEventListener('scroll',()=>{if(active)cancelC03()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelC03()});
 window.matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener?.('change',cancelC03);
}
export function warmC03(){
 if(document.body.dataset.page!=='product')return Promise.resolve(null);
 ensureCSS();installLifecycle();
 return getGSAP();
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
export async function playC03({button}={}){
 // Invalidate any older in-flight proxy; repeated successful cart changes are
 // already committed synchronously by app.mjs before this visual hook.
 cancelC03();
 const version=serial;
 if(document.body.dataset.page!=='product'||prefersReduced()||!button?.isConnected)return false;
 ensureCSS();installLifecycle();
 const gs=await getGSAP();
 if(!gs||version!==serial||!button.isConnected||document.hidden||prefersReduced())return false;
 const source=document.querySelector('.detail-art .shirt-svg, .detail-art img');
 const bagLink=document.querySelector('.site-header .bag-link');
 const badge=bagLink?.querySelector('.bag-count');
 const icon=bagLink?.querySelector('svg');
 if(!source||!bagLink||!badge||!icon)return false;
 const sourceRect=source.getBoundingClientRect();
 const bagRect=bagLink.getBoundingClientRect();
 const header=document.querySelector('.site-header')?.getBoundingClientRect();
 const geometry=planC03Flight(sourceRect,bagRect,header,
  {width:innerWidth,height:innerHeight});
 if(!geometry)return false;
 const {layer,cloneBox,path}=makeCutout(source,sourceRect,geometry);
 const length=path.getTotalLength();
 if(!Number.isFinite(length)||length<=0){layer.remove();return false;}
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
 const tl=gs.timeline({paused:true,onComplete:()=>{
  if(active?.version===version)cleanup();
 }});
 active={version,layer,path,timeline:tl,bag:icon,badge};
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
 tl.play();
 return true;
}
