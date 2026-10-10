(()=>{
'use strict';
/* Order Journey — a procedural, deterministic SVG animation.
   Drop <order-journey> into any web page, include this module, and use
   .play(), .pause(), .renderAt(milliseconds), .restart(), or .toggle().
   All visual state is derived from a single timestamp: ideal for frame export.
*/
const W = 1440, H = 810, DURATION = 10200;
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3);
const easeIn=t=>t*t*t;
const smooth=t=>t*t*(3-2*t);
const back=t=>1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);
const win=(t,a,b)=>clamp((t-a)/(b-a));
const span=(t,a,b,e=smooth)=>e(win(t,a,b));
const fade=(t,on,off)=>span(t,on,on+.3)*(1-span(t,off-.3,off));
const fmt=n=>Number(n.toFixed(2));
const pt=(arr)=>arr.map(a=>a.map(fmt).join(',')).join(' ');
const interpPoints=(a,b,t)=>pt(a.map((p,i)=>[lerp(p[0],b[i][0],t),lerp(p[1],b[i][1],t)]));

const template = `
<style>:host{display:block;contain:content}svg{height:100%;width:100%;display:block}text{font-family:'Space Grotesk','Arial',sans-serif} .mini{font-family:'DM Sans',Arial,sans-serif}</style>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="A cardboard package assembles, receives a product, seals, gets a shipping label, and flies away with a drone">
 <defs>
  <pattern id="dotgrid" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#c6cac1" opacity=".48"/></pattern>
  <linearGradient id="cardL" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#edbc7b"/><stop offset="1" stop-color="#d29b61"/></linearGradient>
  <linearGradient id="cardR" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9a369"/><stop offset="1" stop-color="#b7783e"/></linearGradient>
  <linearGradient id="inkBottle" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a1d6bf"/><stop offset="1" stop-color="#6da996"/></linearGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="glow"><feGaussianBlur stdDeviation="3"/></filter>
  <clipPath id="circ"><circle cx="814" cy="414" r="262"/></clipPath>
 </defs>
 <rect width="1440" height="810" fill="#f7f4ed"/>
 <rect width="1440" height="810" fill="url(#dotgrid)" opacity=".43"/>
 <path d="M0 680H1440" stroke="#e3e1d7" stroke-width="2"/>
 <path d="M0 730H1440" stroke="#e7e5dc" stroke-width="1"/>
 <rect x="59" y="52" width="34" height="34" rx="10" fill="#244f45"/>
 <path d="M68 74l7-13 7 13 7-13" fill="none" stroke="#d9efa4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
 <text x="107" y="75" font-size="19" fill="#29463d" font-weight="700" letter-spacing="-1">SMALL MOMENTS</text>
 <text x="61" y="167" font-size="15" fill="#66766c" font-weight="700" letter-spacing="3">A MICRO-INTERACTION STORY</text>
 <text x="56" y="234" font-size="59" fill="#253d36" font-weight="700" letter-spacing="-3.5">Good things</text>
 <text x="56" y="300" font-size="59" fill="#253d36" font-weight="700" letter-spacing="-3.5">are on the way.</text>
 <path id="underline" d="M59 322h180" stroke="#c2dc79" stroke-width="10" stroke-linecap="round"/>
 <text x="60" y="373" font-size="20" fill="#647569" class="mini">From checkout to doorstep,</text>
 <text x="60" y="402" font-size="20" fill="#647569" class="mini">one delightful step at a time.</text>
 <rect x="1134" y="51" width="245" height="43" rx="21.5" fill="#fffdf7" stroke="#d6ddd0"/>
 <circle x="1158" cy="72" r="5" fill="#78a98b"/>
 <text x="1172" y="78" font-size="14" fill="#38524a" font-weight="700" letter-spacing="1">ORDER # 0248</text>
 <g id="rightLabels"><text x="1160" y="485" font-size="15" fill="#9aa99c" font-weight="700" letter-spacing="2">01 — PACK</text><text x="1160" y="517" font-size="15" fill="#9aa99c" font-weight="700" letter-spacing="2">02 — SEAL</text><text x="1160" y="549" font-size="15" fill="#9aa99c" font-weight="700" letter-spacing="2">03 — SHIP</text></g>
 <g id="airPaths"><path d="M1051 304c62-101 165-100 215-58" stroke="#b9d6c6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="3 13"/><circle cx="1266" cy="246" r="7" stroke="#a4c8ad" stroke-width="3" fill="none"/></g>
 <g id="scene">
  <circle cx="814" cy="409" r="265" fill="#eaece0"/>
  <circle cx="814" cy="409" r="224" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="2"/>
  <path d="M578 413h470 M814 177v475" stroke="#e0e5db" stroke-width="1.5" stroke-dasharray="7 11"/>
  <circle cx="605" cy="237" r="15" fill="#d6eab3"/><circle cx="1048" cy="550" r="9" fill="#c3dccc"/>
  <g id="speedlines" opacity="0"><path d="M536 495h120 M540 519h79 M1050 434h90 M1050 458h60" stroke="#91b3a4" stroke-width="5" stroke-linecap="round"/></g>
  <ellipse id="groundShadow" cx="814" cy="615" rx="195" ry="26" fill="#5e624f" opacity=".13" filter="url(#blur)"/>
  <g id="parcel" opacity="0">
   <polygon id="floor" points="657,423 814,351 971,423 814,495" fill="#dfad75" stroke="#ac7648" stroke-width="2"/>
   <polygon id="rearLeft" points="657,423 814,351 814,352 657,424" fill="#c88d54"/>
   <polygon id="rearRight" points="814,351 971,423 971,424 814,352" fill="#d7a26b"/>
   <polygon id="wallLeft" points="657,423 814,495 814,496 657,424" fill="url(#cardL)" stroke="#bb8b5d" stroke-width="1.5"/>
   <polygon id="wallRight" points="814,495 971,423 971,424 814,496" fill="url(#cardR)" stroke="#aa703a" stroke-width="1.5"/>
   <path id="boxSideDetail" d="M681 459l87 40m145-41-83 39" fill="none" stroke="#b7804e" opacity="0" stroke-width="2"/>
   <polygon id="innerFlap" points="657,423 814,351 814,351 657,423" fill="#e6b47d" stroke="#bd8a55" opacity="0"/>
   <polygon id="flapLeft" points="657,423 814,351 814,351 657,423" fill="#eabe88" stroke="#af7c50" opacity="0" stroke-width="2"/>
   <polygon id="flapRight" points="814,351 971,423 971,423 814,351" fill="#dca36c" stroke="#af7c50" opacity="0" stroke-width="2"/>
   <path id="topSeam" d="M814 351V495" stroke="#ae784b" stroke-width="2" opacity="0" stroke-dasharray="5 7"/>
   <path id="tape" d="M813 355V491" stroke="#f6e9b9" stroke-width="24" fill="none" stroke-linecap="round" stroke-dasharray="140" stroke-dashoffset="140"/>
   <path id="tapeDash" d="M813 355V491" stroke="#d6bb7f" stroke-width="1.4" stroke-dasharray="4 7" stroke-dashoffset="140" opacity="0"/>
   <g id="shippingLabel" opacity="0">
    <polygon points="838,494 931,451 931,509 838,552" fill="#fcf8e9" stroke="#ceb899" stroke-width="1.5"/>
    <path d="M845 506l77-35 M845 517l49-22" stroke="#c8c4b3" stroke-width="2.5"/>
    <path d="M845 528l52-23" stroke="#59766c" stroke-width="4"/>
    <path d="M850 536v7m5-9v7m4-9v7m5-10v7m3-9v7m4-9v7m5-10v7m3-9v7m4-9v7m5-10v7m3-8v7" stroke="#384d46" stroke-width="2.2"/>
    <circle cx="914" cy="482" r="8" fill="#bddbbb"/><path d="M910 482l3 3 5-6" stroke="#3e6655" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
   </g>
  </g>
  <g id="product">
   <ellipse cx="0" cy="65" rx="62" ry="10" fill="#7eab96" opacity=".25"/>
   <rect x="-58" y="-43" width="116" height="108" rx="22" fill="url(#inkBottle)" stroke="#508a76" stroke-width="2.5"/>
   <path d="M-35-23h15 M-35-11h9" stroke="#deffec" stroke-width="4" stroke-linecap="round"/>
   <circle cx="3" cy="5" r="31" fill="#e1f7db" opacity=".65"/><path d="M-13 12q16-29 32 0 M-6 19q9-14 17 0" fill="none" stroke="#437e69" stroke-width="5" stroke-linecap="round"/><circle cx="3" cy="25" r="4.5" fill="#437e69"/>
   <rect x="-25" y="-52" width="50" height="11" rx="5" fill="#548c79"/>
  </g>
  <g id="burst" opacity="0"><path d="M700 290l-23-20 M915 302l25-18 M814 232v-30 M980 368l23-5 M644 355l-23-5" stroke="#b0c773" stroke-width="6" stroke-linecap="round"/><circle cx="694" cy="347" r="6" fill="#edc37f"/><circle cx="923" cy="340" r="5" fill="#9acdb2"/></g>
  <g id="drone" opacity="0">
   <path d="M-132 7L-54 24 M54 24L132 7" stroke="#395c55" stroke-width="12" stroke-linecap="round"/>
   <rect x="-66" y="6" width="132" height="43" rx="20" fill="#244f47" stroke="#173c35" stroke-width="3"/>
   <rect x="-39" y="14" width="79" height="12" rx="6" fill="#537970"/>
   <circle cx="-26" cy="28" r="5" fill="#cbe99d"/><circle cx="27" cy="28" r="5" fill="#cbe99d"/>
   <path d="M-139-4v27m278-27v27" stroke="#3c665d" stroke-width="7" stroke-linecap="round"/>
   <g id="rotorLeft"><ellipse cx="-139" cy="-5" rx="58" ry="8" fill="#7ea79d" opacity=".7"/><path d="M-179-5h80" stroke="#204f45" stroke-width="4" stroke-linecap="round"/></g>
   <g id="rotorRight"><ellipse cx="139" cy="-5" rx="58" ry="8" fill="#7ea79d" opacity=".7"/><path d="M99-5h80" stroke="#204f45" stroke-width="4" stroke-linecap="round"/></g>
   <rect x="-19" y="36" width="38" height="15" rx="6" fill="#173d36"/>
   <path id="tether" d="M0 48V48" stroke="#526f64" stroke-width="3.4" stroke-dasharray="5 4"/>
   <path id="claw" d="M-13 46l13 8 13-8" stroke="#456a5f" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <g id="finish" opacity="0">
   <circle cx="814" cy="398" r="123" fill="#d9ebc0"/>
   <circle cx="814" cy="398" r="90" fill="#edf6d9"/>
   <path id="tick" d="M770 394l31 32 58-67" fill="none" stroke="#2b5e4b" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
   <circle cx="681" cy="327" r="8" fill="#99c5a5"/><circle cx="954" cy="329" r="12" fill="#c1d87e"/><circle cx="701" cy="512" r="6" fill="#ebb979"/><path d="M927 504l22 12m-4-31 20-7" stroke="#92bda3" stroke-width="6" stroke-linecap="round"/>
   <text x="814" y="568" fill="#24493d" font-size="38" font-weight="700" text-anchor="middle" letter-spacing="-1.6">ORDER PLACED!</text>
   <text x="814" y="603" fill="#627e6b" font-size="17" text-anchor="middle" class="mini">A little joy is headed your way.</text>
  </g>
 </g>
 <g id="footer" aria-label="Animation phase and progress">
  <rect x="59" y="683" width="1320" height="1" fill="#cfdbce"/>
  <text x="61" y="726" font-size="14" fill="#65786a" letter-spacing="1.8" font-weight="700">THE JOURNEY</text>
  <text id="phase" x="61" y="760" font-size="25" fill="#25493c" font-weight="700" letter-spacing="-.7">01 / READY TO PACK</text>
  <rect x="1094" y="744" width="284" height="6" fill="#dce4d5" rx="3"/>
  <rect id="progress" x="1094" y="744" width="0" height="6" fill="#6f9e85" rx="3"/>
  <text id="countdown" x="1379" y="726" font-size="13" fill="#65786a" text-anchor="end" letter-spacing="1">00:00 / 00:10</text>
 </g>
</svg>`;

class OrderJourney extends HTMLElement {
  static get observedAttributes(){return ['autoplay'];}
  constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML=template;this._playing=false;this._time=0;this._loop=true;this._frame=0;this._last=0;this._speed=1;this.els={};for(const id of ['scene','underline','airPaths','parcel','floor','rearLeft','rearRight','wallLeft','wallRight','boxSideDetail','innerFlap','flapLeft','flapRight','topSeam','tape','tapeDash','shippingLabel','product','burst','drone','rotorLeft','rotorRight','tether','claw','finish','tick','groundShadow','speedlines','phase','countdown','progress','rightLabels'])this.els[id]=this.shadowRoot.getElementById(id);}
  connectedCallback(){this.renderAt(0);if(this.hasAttribute('autoplay')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.play();}
  disconnectedCallback(){this.pause();}
  get duration(){return DURATION;}
  get loop(){return this._loop;}
  set loop(x){this._loop=Boolean(x);}
  get playing(){return this._playing;}
  get speed(){return this._speed;}
  set speed(v){this._speed=Math.min(2,Math.max(.5,Number(v)||1));}
  setOpacity(id,v){this.els[id].setAttribute('opacity',fmt(clamp(v)));}
  polygon(id,points){this.els[id].setAttribute('points',points);}
  setTransform(id,value){this.els[id].setAttribute('transform',value);}
  renderAt(ms){
    const t=clamp(ms,0,DURATION)/1000;this._time=t*1000;
    const E=this.els;
    // General reveal and narrative stage.
    const inScene=span(t,.12,.5)*(1-span(t,9.72,10.17));
    this.setOpacity('scene',inScene);
    E.underline.setAttribute('stroke-dasharray',180);E.underline.setAttribute('stroke-dashoffset',fmt(180*(1-span(t,.12,.85,easeOut))));
    this.setOpacity('airPaths',.4+span(t,5.2,5.85)*.6);
    const status=t<1.1?'01 / READY TO PACK':t<3.25?'02 / PACKING WITH CARE':t<4.55?'03 / SEALED & SECURE':t<5.65?'04 / LABEL APPLIED':t<7.15?'05 / COURIER ARRIVING':t<8.45?'06 / ON ITS WAY':'07 / ORDER PLACED';
    E.phase.textContent=status;
    E.progress.setAttribute('width',fmt(284*t/(DURATION/1000)));
    E.countdown.textContent=`00:${String(Math.min(10,Math.floor(t))).padStart(2,'0')} / 00:10`;
    // Base card and box erect themselves from flat layout.
    const base=span(t,.44,1.03,easeOut), left=span(t,1.05,1.78,easeOut), right=span(t,1.37,2.07,easeOut), rear=span(t,1.6,2.18,easeOut);
    this.setOpacity('parcel',base);
    const scale=lerp(.66,1,base);
    const popY=(1-base)*42;
    // pickup is shared with the drone move, so the package stays attached to its cable.
    const flight=span(t,7.2,8.65,smooth);
    const airX=flight*330,airY=-flight*515;
    this.setTransform('parcel',`translate(${fmt(airX)} ${fmt(airY+popY)}) translate(814 430) scale(${fmt(scale)}) translate(-814 -430)`);
    // Floor slides subtly as the walls fold.
    E.floor.setAttribute('fill',t<2.35?'#e3b682':'#9e6e47');
    const initialLeft=[[657,423],[814,495],[814,495],[657,423]];
    const finalLeft=[[657,423],[814,495],[814,609],[657,537]];
    const initialRight=[[814,495],[971,423],[971,423],[814,495]];
    const finalRight=[[814,495],[971,423],[971,537],[814,609]];
    this.polygon('wallLeft',interpPoints(initialLeft,finalLeft,left));
    this.polygon('wallRight',interpPoints(initialRight,finalRight,right));
    this.polygon('rearLeft',interpPoints([[657,423],[814,351],[814,351],[657,423]],[[657,423],[814,351],[814,389],[657,462]],rear));
    this.polygon('rearRight',interpPoints([[814,351],[971,423],[971,423],[814,351]],[[814,351],[971,423],[971,462],[814,389]],rear));
    this.setOpacity('boxSideDetail',span(t,2,2.5)*.56);
    const closedInner=span(t,3.15,3.7,easeOut);
    this.setOpacity('innerFlap',closedInner);
    this.polygon('innerFlap',interpPoints([[657,423],[814,351],[814,320],[657,350]],[[657,423],[814,351],[814,485],[657,423]],closedInner));
    // A pair of independent lid surfaces fold inward, closing in sequence.
    const fl=span(t,3.58,4.05,easeOut),fr=span(t,3.85,4.37,easeOut);
    this.setOpacity('flapLeft',span(t,3.35,3.58));
    this.setOpacity('flapRight',span(t,3.62,3.85));
    this.polygon('flapLeft',interpPoints([[657,423],[814,351],[734,294],[601,355]],[[657,423],[814,351],[814,495],[657,423]],fl));
    this.polygon('flapRight',interpPoints([[814,351],[971,423],[1029,355],[895,294]],[[814,351],[971,423],[814,495],[814,351]],fr));
    this.setOpacity('topSeam',span(t,4.22,4.48));
    const tape=span(t,4.35,4.95,easeOut);E.tape.setAttribute('stroke-dashoffset',fmt(140*(1-tape)));E.tapeDash.setAttribute('stroke-dashoffset',fmt(140*(1-tape)));this.setOpacity('tapeDash',tape*.7);
    const lab=span(t,4.84,5.29,back);this.setOpacity('shippingLabel',win(t,4.85,5.1));
    this.setTransform('shippingLabel',`translate(${fmt((1-lab)*20)} ${fmt((1-lab)*-15)})`);
    // Small product lands into the center of the package, then is concealed.
    const fall=span(t,2.3,2.96,easeIn), bounce=span(t,2.96,3.19,easeOut);
    let productY=lerp(176,423,fall)-19*Math.sin(bounce*Math.PI)*(1-bounce);
    const productScale=lerp(.88,.45,fall);
    this.setTransform('product',`translate(814 ${fmt(productY)}) scale(${fmt(productScale)})`);
    this.setOpacity('product',span(t,1.92,2.25)*(1-span(t,3.13,3.44)));
    this.setOpacity('burst',fade(t,2.91,3.34)*.9);
    // Drone approaches, lowers cable, hooks package and carries it off.
    const arrive=span(t,5.33,6.4,easeOut);
    const pickup=span(t,7.1,8.63,smooth);
    const posX=lerp(1514,814,arrive)+pickup*330;
    const posY=lerp(228,232,arrive)-pickup*515+Math.sin(t*10)*4.8;
    this.setOpacity('drone',span(t,5.27,5.64)*(1-span(t,8.38,8.74)));
    this.setTransform('drone',`translate(${fmt(posX)} ${fmt(posY)}) rotate(${fmt(Math.sin(t*5)*2.1-pickup*11)})`);
    // Cable descends toward top of carton, and retracts on departure.
    const cable=span(t,6.34,6.98,easeOut)*(1-span(t,7.16,7.8));
    const ropeLen=lerp(48,145,cable);
    E.tether.setAttribute('d',`M0 48V${fmt(ropeLen)}`);
    E.claw.setAttribute('d',`M-13 ${fmt(ropeLen-2)}l13 8 13-8`);
    this.setTransform('rotorLeft',`translate(0 ${fmt(Math.sin(t*66)*1.1)}) scale(1 ${fmt(.7+Math.sin(t*65)*.08)})`);
    this.setTransform('rotorRight',`translate(0 ${fmt(Math.sin(t*66+1)*1.1)}) scale(1 ${fmt(.7+Math.sin(t*65+2)*.08)})`);
    this.setOpacity('speedlines',fade(t,7.43,8.62)*.85);
    // Physical contact shadow tracks the lift, naturally fading with altitude.
    E.groundShadow.setAttribute('rx',fmt(195+flight*55));E.groundShadow.setAttribute('opacity',fmt(.13*(1-flight*.92)));
    // A subtle elastic squash on impact, visible while the bottle lands.
    const impact=span(t,2.84,3.02)*(1-span(t,3.14,3.42));
    const squash=1+Math.sin(impact*Math.PI)*.085;
    if(impact>0) this.setTransform('product',`translate(814 ${fmt(productY)}) scale(${fmt(productScale/squash)} ${fmt(productScale*squash)})`);
    // Closing card uses scale + opacity rather than another asset.
    const done=span(t,8.45,9.07,back);
    this.setOpacity('finish',span(t,8.45,8.85)*(1-span(t,9.78,10.13)));
    this.setTransform('finish',`translate(814 411) scale(${fmt(.78+done*.22)}) translate(-814 -411)`);
    E.tick.setAttribute('stroke-dasharray','160');E.tick.setAttribute('stroke-dashoffset',fmt(160*(1-span(t,8.64,9.3,easeOut))));
    this.dispatchEvent(new CustomEvent('frame',{detail:{ms:this._time,playing:this._playing}}));
  }
  _tick=(stamp)=>{
    if(!this._playing)return;
    if(!this._last)this._last=stamp;
    const delta=Math.min(65,stamp-this._last);this._last=stamp;
    const next=this._time+delta*this._speed;
    if(next>=DURATION){if(this._loop)this.renderAt(next%DURATION);else{this.renderAt(DURATION);this.pause();return;}}
    else this.renderAt(next);
    this._frame=requestAnimationFrame(this._tick);
  }
  play(){if(this._playing)return;this._playing=true;this._last=0;this._frame=requestAnimationFrame(this._tick);}
  pause(){this._playing=false;if(this._frame)cancelAnimationFrame(this._frame);this._frame=0;this._last=0;this.renderAt(this._time);}
  restart(){this.renderAt(0);this.play();}
  toggle(){this._playing?this.pause():this.play();}
}
customElements.define('order-journey',OrderJourney);

})();