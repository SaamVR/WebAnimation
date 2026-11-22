/* CHAPCHITRA — hand-drawn SVG theme switch. Art source is immutable.
   The app's existing chapchitraTheme controller remains the ONLY state owner. */
const ASSET='/assets/theme-toggle/toggle-integrated.svg';
const PRESS=[41,61,45];
const CREAM=[244,235,228];
const TRAVEL=196;
const DURATION=300;
const lerpColor=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(', ')})`;
const easing=t=>0.5-0.5*Math.cos(Math.PI*t); // symmetric, monotonic, no overshoot
const ART_ROLES=['slider','inner-fill','inner-texture','inner-border','day','night','sun','moon'];
const clamp=t=>Math.max(0,Math.min(1,t));

function scopeIds(svg,which){
 const prefix=`cc-${which}-`;
 const ids=new Map();
 for(const element of [svg,...svg.querySelectorAll('[id]')]){
  if(element.id){ids.set(element.id,prefix+element.id);element.id=prefix+element.id;}
 }
 for(const element of svg.querySelectorAll('*')){
  for(const attr of [...element.attributes]){
   const val=attr.value;
   const rewritten=val.replace(/url\(#([\w-]+)\)/g,(m,key)=>ids.has(key)?`url(#${ids.get(key)})`:m)
    .replace(/^#([\w-]+)$/,(m,key)=>ids.has(key)?`#${ids.get(key)}`:m);
   if(rewritten!==val)element.setAttribute(attr.name,rewritten);
  }
 }
}

function createMotion(svg){
 const role=name=>svg.querySelector(`[data-toggle-role="${name}"]`);
 const ref=Object.fromEntries(ART_ROLES.map(name=>[name,role(name)]));
 if(Object.values(ref).some(v=>!v))throw Error('Owner toggle missing required SVG layer');
 const circle=svg.querySelector('[id$="sliding-circle-inside-fill"]');
 const sliderBase=circle?.querySelector('g > path');
 const sliderGrain=circle?.children?.[1];
 if(!sliderBase||!sliderGrain)throw Error('Owner slider color sublayers missing');
 let progress=0,target=0,raf=0,startedAt=0,from=0,duration=DURATION;
 const show=(v)=>{
  progress=clamp(v);
  const ink=lerpColor(PRESS,CREAM,progress);
  const paper=lerpColor(CREAM,PRESS,progress);
  ref['inner-fill'].style.fill=paper;
  ref['inner-texture'].style.fill=ink;
  ref['inner-border'].style.fill=ink;
  sliderBase.style.fill=lerpColor(PRESS,CREAM,progress);
  sliderGrain.style.fill=lerpColor(CREAM,PRESS,progress);
  ref.slider.setAttribute('transform',`translate(${(TRAVEL*progress).toFixed(3)} 0)`);
  ref.day.style.opacity=String(1-progress);
  ref.night.style.opacity=String(progress);
  ref.sun.style.opacity=String(1-progress);
  ref.moon.style.opacity=String(progress);
  svg.dataset.toggleProgress=progress.toFixed(4);
 };
 const tick=now=>{
  const t=clamp((now-startedAt)/duration);
  show(from+(target-from)*easing(t));
  if(t<1)raf=requestAnimationFrame(tick);else {raf=0;show(target);}
 };
 return {
  setTheme(dark,instant=false){
   const desired=dark?1:0;
   if(raf){cancelAnimationFrame(raf);raf=0;}
   if(instant||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    target=desired;show(desired);return;
   }
   if(Math.abs(desired-progress)<.00001){target=desired;show(desired);return;}
   from=progress;target=desired;
   // A reversal traverses only the remaining path at the same speed.
   duration=Math.max(1,DURATION*Math.abs(target-from));
   startedAt=performance.now();
   raf=requestAnimationFrame(tick);
  },
  getProgress:()=>progress,
  dispose(){if(raf)cancelAnimationFrame(raf);raf=0;}
 };
}

/** Integrate visuals only; do not install click handlers or replace the theme controller. */
export function mountOriginalThemeToggle(buttons){
 const views=[];
 let requestedDark=document.documentElement.dataset.theme==='dark';
 let disposed=false;
 const sync=(dark,instant=false)=>{
  requestedDark=Boolean(dark);
  for(const view of views)view.setTheme(requestedDark,instant);
 };
 const ready=(async()=>{
  try{
   const res=await fetch(ASSET,{credentials:'same-origin'});
   if(!res.ok)throw Error(`Owner toggle asset HTTP ${res.status}`);
   const xml=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
   if(xml.querySelector('parsererror'))throw Error('Invalid owner toggle SVG');
   const original=xml.documentElement;
   if(original.localName!=='svg'||original.getAttribute('viewBox')!=='0 0 320 128')
    throw Error('Wrong owner toggle artboard');
   for(const button of buttons){
    if(disposed)break;
    const svg=document.importNode(original,true);
    scopeIds(svg,button.id);
    svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    const view=createMotion(svg);
    button.querySelector('.cc-theme-toggle-art')?.replaceChildren(svg);
    views.push(view);
    // Always resolve initial state from the *existing* controller AFTER fetch.
    view.setTheme(document.documentElement.dataset.theme==='dark',true);
    button.dataset.artReady='true';
   }
  }catch(error){
   for(const button of buttons){button.dataset.artError='true';}
   console.warn('CHAPCHITRA owner SVG theme toggle unavailable',error);
  }
 })();
 return {sync,ready,dispose(){disposed=true;for(const view of views)view.dispose();}};
}
