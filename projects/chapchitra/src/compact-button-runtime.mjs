/**
 * CHAPCHITRA C05 — compact-only enhancement.
 *
 * The approved Illustrator SVG is self-hosted and remains the only geometry
 * source. Physical face depression and the original ink wipe are independent
 * CSS transforms. No handlers, DOM or CSS for long / inline buttons change.
 */
const SVG_NS='http://www.w3.org/2000/svg';
const urls=Object.freeze({
 forest:'/assets/compact/compact-button-forest.svg?c05=final-colors-ink-2',
 terracotta:'/assets/compact/compact-button-terracotta.svg?c05=final-colors-ink-2',
 beige:'/assets/compact/compact-button-neutral.svg?c05=final-colors-ink-2'
});
const cache=new Map();
const pending=new WeakSet();
let clipSequence=0;
const supported=p=>Object.prototype.hasOwnProperty.call(urls,p);
function toneOf(button){
 if(button.classList.contains('cc-sketch--terracotta'))return 'terracotta';
 if(button.classList.contains('cc-sketch--beige'))return 'beige';
 return 'forest';
}
async function template(tone){
 const url=urls[tone];
 if(!supported(tone))throw new Error('Invalid compact button palette '+tone);
 if(!cache.has(url)){
  cache.set(url,fetch(url,{cache:'force-cache'}).then(response=>{
    if(!response.ok)throw new Error('C05 SVG HTTP '+response.status);
    return response.text();
   }).then(xml=>{
    const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
    const svg=doc.documentElement;
    if(svg.localName!=='svg'||svg.getAttribute('viewBox')!=='0 0 164 64'||
      !svg.querySelector('[id="BUTTON_FACE"]')||
      !svg.querySelector('[id="BUTTON_SHADOW"]')||
      !svg.querySelector('[id="Button_Face_Inside_1_"] > path.st7')){
       throw new Error('C05 approved SVG layers or artboard do not match');
    }
    return svg;
   }).catch(error=>{cache.delete(url);throw error}));
 }
 return cache.get(url);
}
function addInkClip(svg){
 const face=svg.querySelector('[id="BUTTON_FACE"]');
 const inside=svg.querySelector('[id="Button_Face_Inside_1_"]');
 const base=inside.querySelector(':scope > path.st7');
 const clipId='c05-ink-clip-'+(++clipSequence);
 const defs=document.createElementNS(SVG_NS,'defs');
 const clip=document.createElementNS(SVG_NS,'clipPath');
 clip.setAttribute('id',clipId);
 clip.setAttribute('clipPathUnits','userSpaceOnUse');
 const boundary=document.createElementNS(SVG_NS,'path');
 boundary.setAttribute('d',base.getAttribute('d')); // exact approved face path
 clip.append(boundary);
 defs.append(clip);
 svg.insertBefore(defs,svg.firstChild);
 const shell=document.createElementNS(SVG_NS,'g');
 shell.setAttribute('class','cc-compact-ink-shell');
 // The clip is STATIC in BUTTON_FACE coordinates; only the ink inside it
 // animates. Clipping a transformed rect would let ink escape at its edges.
 shell.setAttribute('clip-path','url(#'+clipId+')');
 const ink=document.createElementNS(SVG_NS,'rect');
 ink.setAttribute('x','0');ink.setAttribute('y','0');
 ink.setAttribute('width','164');ink.setAttribute('height','64');
 ink.setAttribute('class','cc-compact-ink');
 shell.append(ink);
 // Original z-order: velvet path st7, 69 fully painted .st8 body shapes,
 // then the approved border st9 and handmade outline st10.
 // The old base.after(ink) was hidden BY those 69 opaque body shapes.
 // Put the ink ON TOP of the actual face but UNDER the unchanged borders.
 inside.append(shell);
 return {face,ink,clipId};
}
const pressables=new Set();
function release(button){button.classList.remove('cc-compact-pressed');pressables.delete(button)}
function wirePress(button){
 button.addEventListener('pointerdown',event=>{
   if(event.button!==0||button.disabled||button.getAttribute('aria-disabled')==='true')return;
   if(button.matches('a[href]'))button.dataset.c05PointerNavigation='1';
   pressables.add(button);button.classList.add('cc-compact-pressed');
 });
 // In Safari a pointer-focused anchor can be retained by the Back/Forward
 // Cache, causing :focus-visible to paint a rectangle after navigation.
 // Blur only after a POINTER click on a real link; keyboard Enter/Space
 // activates with detail=0 and keeps native keyboard-focus behavior.
 if(button.matches('a[href]')){
  button.addEventListener('click',event=>{
   if(event.detail>0 && button.dataset.c05PointerNavigation==='1'){
    button.blur();
    delete button.dataset.c05PointerNavigation;
   }
  });
  button.addEventListener('keydown',()=>{delete button.dataset.c05PointerNavigation});
 }
 for(const name of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])
   button.addEventListener(name,()=>release(button));
 button.addEventListener('keydown',event=>{
  if((event.key===' '||event.key==='Enter')&&!event.repeat&&!button.disabled){
   pressables.add(button);button.classList.add('cc-compact-pressed');
  }
 });
 button.addEventListener('keyup',event=>{
  if(event.key===' '||event.key==='Enter')release(button);
 });
}
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{
 for(const button of pressables)release(button);
},true);
window.addEventListener('blur',()=>{for(const button of pressables)release(button)});
// BFCache restoration retains DOM, focus, pressed and hover states. Never
// suppress actual keyboard focus; clear only links last activated by pointer.
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 for(const button of document.querySelectorAll('.cc-compact-artwork[data-c05-pointer-navigation]')){
  if(document.activeElement===button)button.blur();
  delete button.dataset.c05PointerNavigation;
  release(button);
 }
 for(const button of [...pressables])release(button);
});
async function hydrate(button){
 if(pending.has(button)||button.dataset.c05==='ready')return;
 const art=button.querySelector(':scope > .cc-compact-art');
 if(!art)return;
 pending.add(button);
 const tone=toneOf(button);
 try{
  const source=await template(tone);
  if(!button.isConnected)return;
  const svg=document.importNode(source,true);
  svg.classList.add('cc-compact-svg');
  // The supplied SVG uses global .stN CSS class names. When several variants
  // are inline, their original <style> elements would otherwise cascade
  // across each other's textures. Resolve their own exact source paint tokens
  // onto the corresponding SVG shapes, then remove only that global stylesheet.
  // This does NOT alter any path, polygon, group, transform or geometry.
  const sheet=svg.querySelector(':scope > style');
  const colors=new Map([...sheet.textContent.matchAll(/\.(st\d+)\{fill:(#[0-9A-Fa-f]{6});\}/g)]
    .map(([,klass,color])=>[klass,color]));
  if(colors.size<6)throw new Error('C05 variant paint classes missing');
  for(const element of svg.querySelectorAll('path,polygon')){
    const key=element.getAttribute('class');
    if(colors.has(key))element.style.fill=colors.get(key);
  }
  sheet.remove();
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  const {face,ink,clipId}=addInkClip(svg);
  // Preserve BUTTON_FACE and BUTTON_SHADOW groups and every original path.
  art.replaceChildren(svg);
  button.dataset.c05='ready';
  button.dataset.c05InkClip=clipId;
  wirePress(button);
 }catch(error){
  button.dataset.c05='fallback';
  console.warn('C05 retains its original SVG poster:',error);
 }finally{pending.delete(button)}
}
function scan(root=document){
 const nodes=root instanceof Element && root.matches('.cc-sketch--compact.cc-compact-artwork')
   ?[root]:[...root.querySelectorAll?.('.cc-sketch--compact.cc-compact-artwork')||[]];
 for(const el of nodes)void hydrate(el);
}
const observer=new MutationObserver(changes=>{
 for(const record of changes)for(const node of record.addedNodes){
  if(node.nodeType===1)scan(node);
 }
});
function run(){
 scan();
 observer.observe(document.documentElement,{subtree:true,childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
else run();
window.__chapchitraC05={
 sourceSHA:'d3a84e9f49ff2355261914d91c7607f402e0d958305102ad9b7512d5d4d8384f',
 get counts(){return {
  total:document.querySelectorAll('.cc-compact-artwork').length,
  ready:document.querySelectorAll('.cc-compact-artwork[data-c05="ready"]').length,
  fallback:document.querySelectorAll('.cc-compact-artwork[data-c05="fallback"]').length
 }},
 setPreviewState(el,state){if(el?.matches?.('.cc-compact-artwork'))el.dataset.previewState=state}
};
