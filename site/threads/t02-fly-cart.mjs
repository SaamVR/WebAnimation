/**
 * THREADS T02 — illustrated Add to Cart → Catch → Fly Away.
 * No product photography, checkout state, or source interface is animated.
 * Call play() only AFTER an actual, successful addCartItem() mutation.
 */
import {loadMotionLibrary} from './t01-spotlight.mjs';

const center=rect=>({x:rect.left+rect.width/2,y:rect.top+rect.height/2});
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const curved=(start,end,lift=80,side=0)=>[
 {x:start.x,y:start.y},
 {x:start.x+(end.x-start.x)*.32+side,y:Math.max(62,Math.min(start.y,end.y)-lift)},
 {x:start.x+(end.x-start.x)*.78-side*.3,y:Math.max(62,Math.min(start.y,end.y)-lift)*.4},
 {x:end.x,y:end.y}
];
const tokenSvg=`<svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true">
 <defs><radialGradient id="t02-token-grad" cx="35%" cy="24%"><stop stop-color="#4d765b"/><stop offset=".62" stop-color="#234a39"/><stop offset="1" stop-color="#153328"/></radialGradient></defs>
 <ellipse cx="38" cy="64" rx="28" ry="5.8" fill="#132b20" opacity=".10"/>
 <circle cx="38" cy="36" r="31" fill="#c5a36b" opacity=".42"/>
 <circle cx="38" cy="34" r="29" fill="url(#t02-token-grad)" stroke="#c9a773" stroke-width="1.8"/>
 <path d="M25 31h26l-2 21H27z" fill="none" stroke="#fffdf2" stroke-width="3.3" stroke-linejoin="round"/>
 <path d="M32 33v-6a6 6 0 0 1 12 0v6" fill="none" stroke="#fffdf2" stroke-width="3.2" stroke-linecap="round"/>
 <path d="m32.7 41.5 4.3 4.3 7.6-8.4" fill="none" stroke="#f2d89a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M20 24Q28 12 39 13" fill="none" stroke="#fff" stroke-width="2" opacity=".22" stroke-linecap="round"/>
 </svg>`;
const cartSvg=`<svg width="110" height="99" viewBox="0 0 110 99" fill="none" aria-hidden="true">
 <defs><linearGradient id="t02-cart-metal" x1="16" x2="94" y1="27" y2="68" gradientUnits="userSpaceOnUse"><stop stop-color="#4c785b"/><stop offset=".6" stop-color="#254d3a"/><stop offset="1" stop-color="#183c2d"/></linearGradient></defs>
 <g id="t02-cart-body">
  <path d="M7 17h15l9 52h61" stroke="#234a38" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 26h72l-9 34-57 4z" fill="url(#t02-cart-metal)" stroke="#193a2b" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M31 35h58M35 46h50" stroke="#d7c69d" stroke-width="2" opacity=".68"/>
  <path d="M49 30v30m21-30v29" stroke="#f5ecda" stroke-width="1.5" opacity=".36"/>
  <path d="M33 64h54" stroke="#dab476" stroke-width="3" stroke-linecap="round"/>
 </g>
 <g id="t02-wheel-back"><circle cx="41" cy="80" r="9.2" fill="#1b352a" stroke="#bc985c" stroke-width="2"/><path d="M41 74v12m-6-6h12" stroke="#fff4dd" stroke-width="1.4"/></g>
 <g id="t02-wheel-front"><circle cx="82" cy="80" r="9.2" fill="#1b352a" stroke="#bc985c" stroke-width="2"/><path d="M82 74v12m-6-6h12" stroke="#fff4dd" stroke-width="1.4"/></g>
 <path d="M26 23l-2-5 12 2" stroke="#dfb870" stroke-width="2" stroke-linecap="round" opacity=".9"/>
 </svg>`;
function overlay(){
 const wrap=document.createElement('div');
 wrap.id='t02-motion-layer';wrap.className='t02-motion-layer';wrap.setAttribute('aria-hidden','true');
 wrap.innerHTML=`<div id="t02-token" class="t02-token">${tokenSvg}</div>
 <div id="t02-cart-proxy" class="t02-cart-proxy">${cartSvg}<span id="t02-count-copy" class="t02-count-copy"></span></div>
 <svg class="t02-spark" viewBox="0 0 110 110" width="110" height="110" aria-hidden="true">
  <circle cx="55" cy="55" r="38" fill="none" stroke="#b79a63" stroke-width="3"/>
  <path d="M55 4v17M55 90v17M4 55h17M90 55h17M19 19l13 13M78 78l13 13M91 19 78 32M19 91l13-13" stroke="#b79a63" stroke-width="2.2" stroke-linecap="round"/>
 </svg>`;
 document.body.appendChild(wrap);
 return {wrap,token:wrap.querySelector('#t02-token'),cart:wrap.querySelector('#t02-cart-proxy'),wheels:wrap.querySelectorAll('#t02-wheel-back,#t02-wheel-front'),spark:wrap.querySelector('.t02-spark')};
}
let inFlight=null,sequence=0;
function cleanup(){
 const active=inFlight;inFlight=null;
 if(!active)return;
 active.tl?.kill();
 active.wrap?.remove();
 if(active.button?.isConnected)active.button.style.removeProperty('transform');
}
function badgePop(gs,badge){
 if(!badge)return;
 gs.fromTo(badge,{scale:1},{scale:1.34,duration:.14,ease:'power2.out',repeat:1,yoyo:true,overwrite:true,transformOrigin:'center center'});
}
function restingBadge(badge){
 if(!badge)return;
 badge.animate?.([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:230,easing:'ease-out'});
}
/** Called only on a verified successful cart addition. */
export async function playT02({button,cartButton=document.getElementById('bag-button'),badge=document.getElementById('bag-count'),quantity}={}){
 const version=++sequence;
 cleanup();
 if(!button?.isConnected||!cartButton?.isConnected||!Number.isInteger(quantity)||quantity<1)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){restingBadge(badge);return;}
 const fromRect=button.getBoundingClientRect(),cartRect=cartButton.getBoundingClientRect();
 if(!fromRect.width||!fromRect.height||!cartRect.width||!cartRect.height)return;
 const origin=center(fromRect),anchor=center(cartRect);
 // The fixed overlay remains visible when the permanent header is offscreen.
 const catchAt={x:clamp(anchor.x,55,innerWidth-55),y:clamp(anchor.y,108,innerHeight-90)};
 const from={x:clamp(origin.x,24,innerWidth-24),y:clamp(origin.y,24,innerHeight-24)};
 let gs;
 try{gs=await loadMotionLibrary()}catch{return}
 if(version!==sequence||!gs||!button.isConnected||!cartButton.isConnected)return;
 const {wrap,token,cart,wheels,spark}=overlay();
 const countCopy=cart.querySelector('#t02-count-copy');countCopy.textContent=String(quantity);
 const tokenHalf=38,cartHalfX=55,cartHalfY=49;
 const posToken={x:from.x-tokenHalf,y:from.y-tokenHalf};
 const posCart={x:catchAt.x-cartHalfX,y:catchAt.y-cartHalfY};
 gs.set(token,{x:posToken.x,y:posToken.y,opacity:0,scale:.05,rotation:-8,transformOrigin:'38px 38px'});
 gs.set(cart,{x:posCart.x,y:posCart.y,opacity:0,scale:.72,rotation:0,transformOrigin:'62px 79px'});
 gs.set(spark,{x:catchAt.x-55,y:catchAt.y-55,opacity:0,scale:.2,transformOrigin:'55px 55px'});
 const tl=gs.timeline({paused:true,onComplete:()=>{
  if(inFlight?.version===version)cleanup();
 }});
 inFlight={version,tl,wrap,button};
 // Anticipation: button depresses while independent token emerges.
 tl.to(button,{scale:.955,duration:.12,ease:'power1.in'},0)
   .to(button,{scale:1,duration:.18,ease:'back.out(2.2)'},.12)
   .to(token,{opacity:1,scale:.79,rotation:0,duration:.20,ease:'back.out(1.65)'},.06)
   .to(token,{y:posToken.y-31,scaleY:1.18,scaleX:.92,duration:.20,ease:'power2.out'},.24)
   .to(token,{scaleX:1,scaleY:1,duration:.12},.44);
 // Proxy appears aligned with actual cart anchor and prepares to catch.
 tl.to(cart,{autoAlpha:1,scale:.94,duration:.26,ease:'back.out(1.5)'},.56)
   .to(cart,{rotation:-14,y:posCart.y-8,duration:.18,ease:'power2.out'},.84);
 const landing={x:catchAt.x-38,y:catchAt.y-45};
 const flying=curved({x:posToken.x,y:posToken.y-31},landing,innerWidth<650?56:114,innerWidth<650?22:58);
 tl.to(token,{motionPath:{path:flying,curviness:1,autoRotate:false},rotation:285,scale:.66,
   duration:.83,ease:'power2.inOut'},.46)
   .to(token,{scaleX:1.18,scaleY:.55,rotation:326,duration:.10,ease:'power3.in'},1.26)
   .to(token,{autoAlpha:0,scale:.13,duration:.13,ease:'power3.in'},1.34);
 // Elastic catch, wheel reaction and elegant gold ring.
 tl.to(cart,{rotation:7,scaleX:1.09,scaleY:.79,y:posCart.y+8,duration:.12,ease:'power2.in'},1.28)
   .to(cart,{rotation:-4,scaleX:.95,scaleY:1.08,y:posCart.y-3,duration:.17,ease:'back.out(2.2)'},1.40)
   .to(cart,{rotation:0,scale:1,y:posCart.y,duration:.16,ease:'power2.out'},1.57)
   .to(wheels,{rotation:70,duration:.26,ease:'power2.out',transformOrigin:'50% 50%'},1.34)
   .to(spark,{opacity:.92,scale:.75,duration:.17,ease:'power2.out'},1.31)
   .to(spark,{opacity:0,scale:1.25,duration:.27,ease:'power2.in'},1.48);
 tl.call(()=>{if(inFlight?.version===version){badgePop(gs,badge);badgePop(gs,countCopy)}},null,1.47);
 // The cart rolls forward and swishes out; permanent header icon never moves.
 const away={x:innerWidth+148,y:Math.max(-98,catchAt.y-130)};
 tl.to(cart,{rotation:12,scaleX:1.04,duration:.16,ease:'power2.in'},1.68)
   .to(cart,{motionPath:{path:curved(posCart,{x:away.x-cartHalfX,y:away.y-cartHalfY},-60,-60),curviness:1,autoRotate:false},
      rotation:22,scale:.78,opacity:0,duration:.53,ease:'power3.in'},1.73)
   .to(wheels,{rotation:410,duration:.48,ease:'power2.in'},1.73);
 tl.play();
 return tl;
}
export function cancelT02(){sequence++;cleanup()}
if(typeof window!=='undefined'){
 addEventListener('pagehide',cancelT02);
 addEventListener('resize',cancelT02,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelT02()});
}
