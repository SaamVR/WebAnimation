/* CHAPCHITRA C05 Icon03 — CYCLE OPENING / COMPOSITE CONTROLLER
   APPROVED CLOSING IS INTACT. No edits to closing GSAP timeline or SVG.
   This controller owns only the opening and composes it by seeking the baseline.
*/
(() => {
  'use strict';
  const approved=window.C05GateB;
  if(!approved) throw new Error('Approved closing controller missing');
  const root=document.querySelector('#c05-stage svg');
  const floral=root.querySelector('#Wood_block');
  const reverse=root.querySelector('#Wood_x5F_Block_x5F_Flipped');
  const print=root.querySelector('#Print_over_cloth');
  const bgCloth=root.querySelector('#Cloth');
  // The pre-refinement rendered frames exceeded the 243.2-unit circle radius.
  // Scale ALL original artwork uniformly to 90% about the circle center (256,256).
  // Icon_Circle remains untouched. This is outside both animation controllers.
  const fit=document.createElementNS('http://www.w3.org/2000/svg','g');
  fit.setAttribute('id','C05_ARTWORK_90PCT');
  fit.setAttribute('transform','translate(25.6 25.6) scale(0.9)');
  [bgCloth,print,floral,reverse].forEach(group=>fit.appendChild(group));
  root.appendChild(fit);
  const BLOCK_REST={cx:202.6719,cy:210.8468};
  const REVERSE_NATIVE={cx:299.7462,cy:307.0716};
  const OFFSET={dx:-10.366430,dy:-14.715201};
  const AIRBORNE={cx:REVERSE_NATIVE.cx-13,cy:REVERSE_NATIVE.cy-176};
  const OPEN=2.18;
  const CLOSE=approved.duration;
  const DURATION=OPEN+CLOSE;
  const contactOffset=approved.status().contactOffset;
  const CONTACT={cx:REVERSE_NATIVE.cx+contactOffset.x,cy:REVERSE_NATIVE.cy+contactOffset.y};
  const openingState={cx:BLOCK_REST.cx,cy:BLOCK_REST.cy,roll:0,flip:1};
  const floralBounds=floral.getBBox(),reverseBounds=reverse.getBBox();
  const commonWidth=(floralBounds.width+reverseBounds.width)/2;
  const gsapOn=!!(window.gsap&&typeof window.gsap.timeline==='function');
  const reduce=!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)};
  const easeInterp=(keys,t)=>{
    if(t<=keys[0][0]) return keys[0][1];
    for(let i=1;i<keys.length;i++) if(t<=keys[i][0]){
      const [tt,b]=keys[i],[ts,a]=keys[i-1];
      return a+(b-a)*smooth((t-ts)/(tt-ts));
    }
    return keys[keys.length-1][1];
  };
  // The opening deliberately has its own easing. Flip source geometry (0..1 face switch)
  // and pivot math are shared with the UNCHANGED approved return flip.
  const segments={
    cx:[[0,BLOCK_REST.cx],[.08,BLOCK_REST.cx],[.67,267],[1.11,275],[1.45,AIRBORNE.cx],[2.09,CONTACT.cx],[OPEN,CONTACT.cx]],
    cy:[[0,BLOCK_REST.cy],[.08,BLOCK_REST.cy],[.67,118],[1.11,108],[1.45,AIRBORNE.cy],[2.09,CONTACT.cy],[OPEN,CONTACT.cy]],
    flip:[[0,1],[.67,1],[1.11,.5],[1.45,0],[OPEN,0]],
    roll:[[0,0],[.67,2],[1.11,-4],[1.45,0],[OPEN,0]]
  };
  const opener=gsapOn?gsap.timeline({paused:true}):null;
  if(opener){
    opener.to(openingState,{cx:267,cy:118,roll:2,duration:.59,ease:'power2.inOut'},.08)
      .to(openingState,{cx:275,cy:108,flip:.5,roll:-4,duration:.44,ease:'sine.inOut'},.67)
      .to(openingState,{cx:AIRBORNE.cx,cy:AIRBORNE.cy,flip:0,roll:0,duration:.34,ease:'sine.inOut'},1.11)
      .to(openingState,{cx:CONTACT.cx,cy:CONTACT.cy,duration:.64,ease:'power2.inOut'},1.45)
      .to(openingState,{cx:CONTACT.cx,duration:.09,ease:'none'},2.09);
    opener.pause(0);
  }
  function renderOpening(t){
    if(opener){opener.pause().time(t,false)}
    else for(const k of Object.keys(segments)) openingState[k]=easeInterp(segments[k],t);
    // Print is always fully hidden throughout the new opening. Never fade at replay.
    print.style.visibility='hidden';
    print.style.opacity='1';
    const floralOn=openingState.flip>=.5;
    const active=floralOn?floral:reverse;
    const inactive=floralOn?reverse:floral;
    inactive.style.display='none';active.style.display='inline';
    const native=floralOn?BLOCK_REST:REVERSE_NATIVE;
    if(!floralOn && openingState.flip<=.00001){
      // At the join this is THE EXACT transform from the approved frame 0.
      const dx=openingState.cx-REVERSE_NATIVE.cx,dy=openingState.cy-REVERSE_NATIVE.cy;
      active.setAttribute('transform',`translate(${dx.toFixed(3)} ${dy.toFixed(3)}) rotate(${openingState.roll.toFixed(3)} 422 410)`);
    } else {
      // For the first 0.59s of lifting, gently remove the floral REST placement offset
      // so that both authored orientations share one world-space pivot during turnover.
      // Without this, the face switch at exactly 90 degrees jumps ~18 SVG units.
      const homeBlend=t<=.08?1:(t>=.67?0:1-smooth((t-.08)/.59));
      const restDx=floralOn?OFFSET.dx*homeBlend:0;
      const restDy=floralOn?OFFSET.dy*homeBlend:0;
      // Preserve the block's actual width across the edge-on handoff and permit a thin
      // wood-slab silhouette; never fade, overlap, or scale the two complete blocks together.
      const sy=Math.max(.105,Math.abs(Math.cos(Math.PI*openingState.flip)));
      const edge=smooth(Math.max(0,1-Math.abs(openingState.flip-.5)/.20));
      const width=floralOn?floralBounds.width:reverseBounds.width;
      const sx=1+edge*(commonWidth/width-1);
      active.setAttribute('transform',`translate(${restDx.toFixed(4)} ${restDy.toFixed(4)}) translate(${openingState.cx.toFixed(3)} ${openingState.cy.toFixed(3)}) rotate(${openingState.roll.toFixed(3)}) scale(${sx.toFixed(5)} ${sy.toFixed(5)}) translate(${-native.cx.toFixed(3)} ${-native.cy.toFixed(3)})`);
    }
  }
  // Cloning controls strips the original closing-only listeners from the visible UI.
  // The original baseline controller and its timeline remain unmodified and paused.
  const byId=id=>document.getElementById(id);
  for(const id of ['play','pause','replay','scrub']){
    const el=byId(id);if(!el)throw new Error('Missing control '+id);
    el.replaceWith(el.cloneNode(true));
  }
  const playButton=byId('play'),pauseButton=byId('pause'),replayButton=byId('replay');
  const scrub=byId('scrub'),clock=byId('clock'),statusText=byId('engine-status');
  scrub.max=String(DURATION);scrub.step='0.001';
  const caption=document.getElementById('cycle-phase');
  const speedControl=byId('speed');
  let time=0,playing=false,raf=0,last=null,rate=1;
  function clockUpdate(){
    scrub.value=String(time);clock.textContent=`${time.toFixed(2)} / ${DURATION.toFixed(2)} s`;
    const phase=time<OPEN?'Opening · lift / reverse flip / press':'Approved closing · lift / print / flip / return';
    if(caption)caption.textContent=phase;
    if(statusText)statusText.textContent=`${gsapOn?'GSAP 3.15.1':'Offline SVG fallback'} · ${phase}`;
  }
  function seek(raw){
    time=Math.max(0,Math.min(DURATION,Number(raw)||0));
    if(time<OPEN){
      // Baseline exists untouched. Its 0s snap resets dormant transforms, then the opening overrides only the blocks.
      approved.seek(0);
      renderOpening(time);
    }else{
      // The approved closing is played by the exact original functions at its original time.
      approved.seek(time-OPEN);
    }
    clockUpdate();
  }
  function pause(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;last=null;}
  function tick(now){
    if(!playing)return;
    if(last!==null)seek(Math.min(DURATION,time+Math.min(.09,(now-last)/1000)*rate));
    last=now;
    if(time>=DURATION){pause();return;}
    raf=requestAnimationFrame(tick);
  }
  function play(){
    if(reduce){seek(DURATION);return;}
    if(time>=DURATION)seek(0);
    if(playing)return;
    playing=true;last=null;raf=requestAnimationFrame(tick);
  }
  playButton.addEventListener('click',play);
  pauseButton.addEventListener('click',pause);
  replayButton.addEventListener('click',()=>{pause();seek(0);play()});
  scrub.addEventListener('input',()=>{pause();seek(scrub.value)});
  speedControl?.addEventListener('change',()=>{rate=Number(speedControl.value)||1});
  if(reduce)seek(DURATION);else seek(0);
  window.C05Complete={
    seek,play,pause,duration:DURATION,openingDuration:OPEN,closingDuration:CLOSE,
    status:()=>({time,gsap:gsapOn,reduced:reduce,phase:time<OPEN?'opening':'approved-closing',
       printVisible:print.style.visibility==='visible',visibleFace:floral.style.display!=='none'?'floral':'reverse',
       floralTransform:floral.getAttribute('transform'),reverseTransform:reverse.getAttribute('transform'),
       printedTransform:print.getAttribute('transform'),clothTransform:bgCloth.getAttribute('transform'),
       closing:approved.status()}),
    getApprovedClosingController:()=>approved,
    destroy:()=>{pause();opener?.kill();approved.destroy();window.C05Complete=null}
  };
})();
