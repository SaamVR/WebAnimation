/* CHAPCHITRA C05 Icon03 — Gate A: physical contact / peel / lift proof.
   GSAP 3.15 controls one state object. Original SVG paths remain untouched.
   Visual fallback only if GSAP library cannot load in an offline reviewer. */
(() => {
  'use strict';
  const root = document.querySelector('#c05-stage svg');
  if (!root) throw new Error('C05 inline source SVG missing');
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', 'Wooden printing block lifting from cloth and exposing floral print');
  const floral = root.querySelector('#Wood_block');
  const reverse = root.querySelector('#Wood_x5F_Block_x5F_Flipped');
  const flower = root.querySelector('#Print_over_cloth');
  const cloth = root.querySelector('#Cloth');
  const circle = root.querySelector('#Icon_Circle');
  if (![floral, reverse, flower, cloth, circle].every(Boolean)) throw new Error('Missing a required source SVG group');

  // Browser-measured source coordinates; source flipped pose already rests on the print.
  // The right-hand contact edge stays planted while the left side lifts.
  const CONTACT_X = 422.0, CONTACT_Y = 410.0;
  const PRINT_X = 196.0, PRINT_Y = 241.0, PRINT_W = 217.0, PRINT_H = 155.0;
  const state = { tx: 0, ty: 0, angle: 0, reveal: 0 };

  floral.setAttribute('display','none');
  reverse.setAttribute('display','inline');
  // Set the print to full opacity permanently. Only its spatial reveal mask moves.
  flower.style.opacity = '1';
  flower.style.visibility = 'visible';
  const NS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(NS,'defs');
  const clip = document.createElementNS(NS,'clipPath');
  clip.id = 'c05-gate-a-ink-clip'; clip.setAttribute('clipPathUnits','userSpaceOnUse');
  const revealRect = document.createElementNS(NS,'rect');
  revealRect.setAttribute('x',String(PRINT_X));
  revealRect.setAttribute('y',String(PRINT_Y));
  revealRect.setAttribute('width','0');
  revealRect.setAttribute('height',String(PRINT_H));
  clip.appendChild(revealRect); defs.appendChild(clip);
  root.insertBefore(defs, root.firstChild);
  flower.setAttribute('clip-path','url(#c05-gate-a-ink-clip)');
  // Group order is exactly as in the source; moving plain-backed block is above the print.
  root.appendChild(reverse);

  const DURATION = 2.35;
  const linearSmooth = x => { const t=Math.max(0,Math.min(1,x)); return t*t*(3-2*t); };
  function interpolate(keys,t){
    if(t <= keys[0][0]) return keys[0][1];
    for(let i=1; i<keys.length;i++){
      if(t<=keys[i][0]){
        const [b,vb]=keys[i]; const [a,va]=keys[i-1];
        return va+(vb-va)*linearSmooth((t-a)/(b-a));
      }
    }
    return keys[keys.length-1][1];
  }
  function render(){
    reverse.setAttribute('transform',`translate(${state.tx.toFixed(3)} ${state.ty.toFixed(3)}) rotate(${state.angle.toFixed(3)} ${CONTACT_X} ${CONTACT_Y})`);
    revealRect.setAttribute('width',(PRINT_W*Math.max(0,Math.min(1,state.reveal))).toFixed(3));
  }
  function referenceAt(t){
    state.tx=interpolate([[0,0],[.34,0],[.80,0],[1.55,-8],[2.06,-13],[2.35,-13]],t);
    state.ty=interpolate([[0,0],[.14,1.2],[.34,1.2],[.80,-3],[1.55,-133],[2.06,-176],[2.35,-176]],t);
    state.angle=interpolate([[0,0],[.34,0],[.80,11.5],[1.55,3],[2.06,0],[2.35,0]],t);
    state.reveal=interpolate([[0,0],[.50,0],[.80,.22],[1.25,.62],[1.68,1],[2.35,1]],t);
    render();
  }
  let timeline;
  const usingGSAP=Boolean(window.gsap && typeof window.gsap.timeline==='function');
  const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(usingGSAP){
    timeline=gsap.timeline({paused:true,defaults:{overwrite:'auto'},onUpdate:render});
    timeline
      .to(state,{ty:1.2,duration:.14,ease:'sine.inOut'},0.00)
      .to(state,{angle:11.5,ty:-3,duration:.46,ease:'power2.inOut'},0.34)
      .to(state,{tx:-8,angle:3,ty:-133,duration:.75,ease:'power2.inOut'},0.80)
      .to(state,{tx:-13,angle:0,ty:-176,duration:.51,ease:'power2.out'},1.55)
      .to(state,{reveal:.22,duration:.30,ease:'sine.inOut'},0.50)
      .to(state,{reveal:.62,duration:.45,ease:'sine.inOut'},0.80)
      .to(state,{reveal:1,duration:.43,ease:'sine.out'},1.25)
      .to(state,{tx:-13,duration:.29,ease:'none'},2.06);
    timeline.pause(0);
  } else { referenceAt(0); }

  const play = document.querySelector('#play');
  const pause = document.querySelector('#pause');
  const replay = document.querySelector('#replay');
  const scrub = document.querySelector('#scrub');
  const clock = document.querySelector('#clock');
  const engine = document.querySelector('#engine-status');
  if(engine) engine.textContent=usingGSAP?'GSAP timeline active · 3.15.1': 'Offline SVG reference mode (GSAP unavailable)';
  let fallbackTime=0, fallbackRAF=0, fallbackLast=0;
  function updateClock(t){
    if(clock)clock.textContent=`${t.toFixed(2)} / ${DURATION.toFixed(2)} s`;
    if(scrub)scrub.value=String(t);
  }
  function seek(t){
    const v=Math.max(0,Math.min(DURATION,Number(t)||0));
    if(usingGSAP){timeline.pause().time(v,false);render();}
    else {fallbackTime=v;referenceAt(v);}
    updateClock(v);
  }
  function pausePlayback(){
    if(usingGSAP)timeline.pause();
    else {cancelAnimationFrame(fallbackRAF);fallbackRAF=0;}
  }
  function fallbackRun(now){
    if(!fallbackLast)fallbackLast=now;
    const dt=Math.min(.07,(now-fallbackLast)/1000);fallbackLast=now;
    const t=Math.min(DURATION,fallbackTime+dt);
    fallbackTime=t;referenceAt(t);updateClock(t);
    fallbackRAF=t<DURATION?requestAnimationFrame(fallbackRun):0;
  }
  function playPlayback(){
    if(reduced){seek(DURATION);return;}
    if(usingGSAP){if(timeline.time()>=DURATION)timeline.time(0);timeline.play();}
    else {if(fallbackTime>=DURATION)fallbackTime=0;fallbackLast=0;cancelAnimationFrame(fallbackRAF);fallbackRAF=requestAnimationFrame(fallbackRun);}
  }
  if(play)play.addEventListener('click',playPlayback);
  if(pause)pause.addEventListener('click',pausePlayback);
  if(replay)replay.addEventListener('click',()=>{pausePlayback();seek(0);playPlayback();});
  if(scrub)scrub.addEventListener('input',()=>{pausePlayback();seek(scrub.value);});
  if(usingGSAP)timeline.eventCallback('onUpdate',()=>{render();updateClock(timeline.time());});
  if(reduced)seek(DURATION);else {seek(0);}
  // Public browser QA interface; exposed only for review and deterministic scrubbing.
  window.C05GateA={seek,play:playPlayback,pause:pausePlayback,duration:DURATION,
    status:()=>({usingGSAP,reduced,time:usingGSAP?timeline.time():fallbackTime,position:{...state},source:'original-named-SVG',gate:'A'}),
    destroy:()=>{pausePlayback();if(timeline)timeline.kill();window.C05GateA=null;}};
})();
