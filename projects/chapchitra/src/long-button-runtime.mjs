/**
 * LONG — original 320×54 long Illustrator artwork. Deliberately independent
 * from the approved Compact renderer and all existing cart handlers.
 */
const SVG='http://www.w3.org/2000/svg';
const URLs=Object.freeze({
 forest:'/assets/long/long-button-forest.svg?long=final-1',
 terracotta:'/assets/long/long-button-terracotta.svg?long=final-1',
 beige:'/assets/long/long-button-neutral.svg?long=final-1'
});
const cache=new Map(),pending=new WeakSet(),held=new Set();
let serial=0;
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const svgNode=(tag,attributes={})=>{
 const node=document.createElementNS(SVG,tag);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));
 return node;
};
function toneOf(button){
 return button.classList.contains('cc-sketch--terracotta')?'terracotta':
   button.classList.contains('cc-sketch--beige')?'beige':'forest';
}
async function sourceFor(tone){
 const url=URLs[tone];if(!url)throw Error('LONG unsupported long SVG tone');
 if(!cache.has(url))cache.set(url,fetch(url,{cache:'force-cache'}).then(async response=>{
  if(!response.ok)throw Error('LONG SVG HTTP '+response.status);
  const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  const svg=doc.documentElement;
  if(svg.localName!=='svg'||svg.getAttribute('viewBox')!=='0 0 320 54'||
   !svg.querySelector('[id="BUTTON_FACE"]')||!svg.querySelector('[id="BUTTON_SHADOW"]'))
   throw Error('LONG artwork viewBox or face/shadow grouping changed');
  if(svg.querySelectorAll('#BUTTON_FACE .st2').length!==431)
   throw Error('LONG handmade face vectors changed');
  return svg;
 }).catch(e=>{cache.delete(url);throw e}));
 return cache.get(url);
}
function installLayers(svg){
 const face=svg.querySelector('#BUTTON_FACE');
 const groups=[...face.children].filter(x=>x.localName==='g');
 if(groups.length!==3)throw Error('LONG artwork z-order differs from source');
 const body=groups[1],outer=groups[2];
 if(body.querySelectorAll('.st2').length!==431||
   outer.querySelectorAll('.st3').length!==25)throw Error('LONG vector layers changed');
 // The largest exact original painted-face path includes its authored
 // irregular contour and paper cutouts. No rounded rectangle approximation.
 const main=[...body.querySelectorAll('path.st2')]
  .reduce((a,b)=>(b.getAttribute('d')?.length??0)>(a?.getAttribute('d')?.length??0)?b:a,null);
 const d=main?.getAttribute('d');
 if(!d||d.length<100000)throw Error('LONG exact organic ink clip unavailable');
 const clipId='long-face-ink-'+(++serial);
 const clip=svgNode('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'});
 clip.append(svgNode('path',{d}));
 const defs=svgNode('defs');defs.append(clip);svg.insertBefore(defs,svg.firstChild);
 const shell=svgNode('g',{'class':'cc-long-ink-shell','clip-path':'url(#'+clipId+')'});
 const graphite=svgNode('rect',{'class':'cc-long-ink-graphite',x:0,y:0,width:320,height:54});
 const returning=svgNode('rect',{'class':'cc-long-ink-green',x:0,y:0,width:320,height:54});
 shell.append(graphite,returning);
 // Paint ABOVE 431 original body paths, but BELOW 25 unchanged outline marks.
 body.after(shell);
 return {face,shell,graphite,returning,clipId};
}
function fixScopedPaint(svg){
 const style=svg.querySelector(':scope > style');
 if(!style)throw Error('LONG four original SVG paint tokens absent');
 const tokens=new Map([...style.textContent.matchAll(/\.(st\d+)\s*\{\s*fill:\s*(#[0-9A-Fa-f]{6})\s*;\s*\}/g)]
  .map(([,cls,value])=>[cls,value]));
 if(tokens.size!==4)throw Error('LONG expected four original Illustrator paint classes');
 // An inline SVG <style>.st2 would overwrite neighboring compact SVG classes.
 // Move only original paint values onto their original shapes, without editing
 // any original geometry, grouping, texture or path data.
 for(const node of svg.querySelectorAll('path,polygon')){
  const color=tokens.get(node.getAttribute('class'));
  if(color)node.style.fill=color;
 }
 style.remove();
}
function release(button){
 button.classList.remove('cc-long-pressed');held.delete(button);
}
function resetInk(button){
 button.classList.add('long-ink-reset');
 button.classList.remove('long-confirm-pending','long-returning');
 // Avoid an invisible reverse Graphite→Green; the returning green mask has
 // already painted the entire original face before these overlays reset.
 button.getBoundingClientRect();
 requestAnimationFrame(()=>button.classList.remove('long-ink-reset'));
}
function wireConfirmation(button){
 let previous=button.classList.contains('added');
 let generation=0;
 const observer=new MutationObserver(()=>{
  const now=button.classList.contains('added');
  if(now===previous)return;
  previous=now;
  const token=++generation;
  if(now){
   button.classList.add('long-ink-reset');
   button.classList.remove('long-confirm-pending','long-returning');
   button.getBoundingClientRect();
   requestAnimationFrame(()=>button.classList.remove('long-ink-reset'));
  }else{
   // The original cart action independently restores the label after 950ms.
   // Hold the Graphite ink in place while a separate Press Green wipe
   // advances LEFT→RIGHT, otherwise the exit is a reverse Graphite wipe.
   button.classList.add('long-confirm-pending');
   requestAnimationFrame(()=>{
    if(token!==generation||!button.isConnected||button.classList.contains('added'))return;
    button.classList.add('long-returning');
    window.setTimeout(()=>{
     if(token===generation&&!button.classList.contains('added'))resetInk(button);
    },reduced()?0:320);
   });
  }
 });
 observer.observe(button,{attributes:true,attributeFilter:['class']});
 if(previous)button.classList.add('long-confirm-pending');
}
function wireInteraction(button){
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0||button.disabled||button.getAttribute('aria-disabled')==='true')return;
  if(button.matches('a[href]'))button.dataset.longPointerNavigation='1';
  held.add(button);button.classList.add('cc-long-pressed');
 });
 for(const type of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])
  button.addEventListener(type,()=>release(button));
 button.addEventListener('keydown',event=>{
  if(button.matches('a[href]'))delete button.dataset.longPointerNavigation;
  if((event.key===' '||event.key==='Enter')&&!event.repeat&&!button.disabled){
   held.add(button);button.classList.add('cc-long-pressed');
  }
 });
 button.addEventListener('keyup',event=>{
  if(event.key===' '||event.key==='Enter')release(button);
 });
 if(button.matches('a[href]'))button.addEventListener('click',event=>{
  if(event.detail>0&&button.dataset.longPointerNavigation==='1'){
   button.blur();delete button.dataset.longPointerNavigation;
  }
 });
 if(button.matches('[data-add-to-bag]'))wireConfirmation(button);
}
for(const type of ['pointerup','pointercancel'])
 document.addEventListener(type,()=>{for(const button of [...held])release(button)},true);
window.addEventListener('blur',()=>{for(const button of [...held])release(button)});
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 for(const button of document.querySelectorAll('.cc-long-artwork[data-long-pointer-navigation]')){
  if(document.activeElement===button)button.blur();
  delete button.dataset.longPointerNavigation;release(button);
 }
 for(const button of [...held])release(button);
});
async function hydrate(button){
 if(pending.has(button)||button.dataset.long==='ready')return;
 const art=button.querySelector(':scope > .cc-long-art');
 if(!art)return;
 pending.add(button);
 try{
  const source=await sourceFor(toneOf(button));
  if(!button.isConnected)return;
  const svg=document.importNode(source,true);
  fixScopedPaint(svg);
  svg.classList.add('cc-long-svg');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('focusable','false');svg.setAttribute('aria-hidden','true');
  const parts=installLayers(svg);
  art.replaceChildren(svg);
  button.dataset.long='ready';button.dataset.longInkClip=parts.clipId;
  wireInteraction(button);
 }catch(error){
  button.dataset.long='fallback';
  console.warn('LONG original long-button SVG fallback remains visible:',error);
 }finally{pending.delete(button)}
}
function scan(root=document){
 const nodes=root instanceof Element&&root.matches('.cc-sketch--long.cc-long-artwork')
  ?[root]:[...root.querySelectorAll?.('.cc-sketch--long.cc-long-artwork')??[]];
 for(const node of nodes)void hydrate(node);
}
const observer=new MutationObserver(records=>{
 for(const record of records)for(const node of record.addedNodes)
  if(node.nodeType===1)scan(node);
});
function init(){scan();observer.observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
window.__chapchitraLongButtons={
 get counts(){return {
  total:document.querySelectorAll('.cc-long-artwork').length,
  ready:document.querySelectorAll('.cc-long-artwork[data-long="ready"]').length,
  fallback:document.querySelectorAll('.cc-long-artwork[data-long="fallback"]').length
 }},
 setPreviewState(button,state){
  if(button?.matches?.('.cc-long-artwork'))button.dataset.previewState=state;
 }
};
