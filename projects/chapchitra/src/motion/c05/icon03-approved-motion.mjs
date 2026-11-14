/** CHAPCHITRA C05 Icon 03 website mounting bridge.
 * The two owner-supplied controllers are IMPORTED EXACTLY, never reconstructed.
 * The 4.25s closing file remains SHA-256 9ad4c7fd272cb498cd0de72bbdcf84b7434739362bca1b8a0d3426451b32ef45.
 * The original 512-unit SVG is loaded and its illustration groups/path geometry are untouched.
 */
let singleMount=false;
export async function mountC05Icon03({stage,win=window,doc=document}){
 if(!stage||singleMount)throw new Error('C05 Icon 03: expected one isolated homepage stage');
 singleMount=true;
 try{
  const response=await win.fetch('/assets/c05/icon03-final.svg',{cache:'force-cache'});
  if(!response.ok)throw new Error('C05 Icon 03 SVG missing: '+response.status);
  const bytes=await response.text();
  const parsed=new DOMParser().parseFromString(bytes,'image/svg+xml');
  if(parsed.querySelector('parsererror,script,foreignObject'))throw new Error('C05 Icon 03 SVG is invalid/unsafe');
  const svg=parsed.documentElement;
  if(svg.localName!=='svg'||!['Wood_block','Wood_x5F_Block_x5F_Flipped','Print_over_cloth','Cloth','Icon_Circle'].every(id=>svg.querySelector('#'+id)))
   throw new Error('C05 Icon 03 approved original groups absent');
  stage.id='c05-stage';
  stage.appendChild(doc.importNode(svg,true));
  // Original standalone controllers require these UI nodes. Keep them inert,
  // visually hidden and completely scoped to this animation stage.
  const controls=doc.createElement('div');controls.hidden=true;controls.setAttribute('aria-hidden','true');
  for(const id of ['play','pause','replay']){
   const button=doc.createElement('button');button.id=id;button.type='button';controls.append(button);
  }
  const scrub=doc.createElement('input');scrub.id='scrub';scrub.type='range';controls.append(scrub);
  for(const id of ['clock','engine-status','cycle-phase']){
   const label=doc.createElement('span');label.id=id;controls.append(label);
  }
  const speed=doc.createElement('select');speed.id='speed';speed.add(new Option('1×','1'));controls.append(speed);
  stage.append(controls);
  // IMPORTANT: imports execute original two IIFEs in original order. Their
  // motion data, easing and SVG transforms are unchanged, including the
  // print/lift/flip/return choreography and 90% inner-artwork fit.
  await import('./icon03-approved-closing.mjs');
  await import('./icon03-refined-opening.mjs');
  const original=win.C05Complete;
  if(!original||Math.abs(original.duration-6.43)>.0001||!original.getApprovedClosingController)
   throw new Error('C05 Icon 03 exact approved original cycle did not initialize');
  if(Math.abs(original.getApprovedClosingController().duration-4.25)>.0001)
   throw new Error('C05 Icon 03 closing choreography changed');
  const callbacks=new Set();let raf=0,complete=false,disposed=false;
  function stopMonitor(){if(raf){win.cancelAnimationFrame(raf);raf=0}}
  function monitor(){
   if(disposed)return;
   if(original.status().time>=original.duration-.0001){
    stopMonitor();if(!complete){complete=true;callbacks.forEach(fn=>fn())}return;
   }
   raf=win.requestAnimationFrame(monitor);
  }
  return {
   play(){if(disposed)return;original.play();stopMonitor();raf=win.requestAnimationFrame(monitor)},
   pause(){stopMonitor();original.pause()},
   toFinal(){stopMonitor();original.pause();original.seek(original.duration)},
   onComplete(callback){if(typeof callback==='function')callbacks.add(callback)},
   frame:()=>Math.round(original.status().time*30),
   duration:()=>original.duration,
   destroy(){if(disposed)return;disposed=true;stopMonitor();original.destroy();singleMount=false;stage.replaceChildren();stage.removeAttribute('id')},
   seekForQA:(seconds)=>{stopMonitor();original.pause();original.seek(seconds)},
   statusForQA:()=>original.status()
  };
 }catch(error){singleMount=false;throw error}
}
