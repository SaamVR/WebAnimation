/**
 * CHAPCHITRA clean pill button system.
 * Two responsive CSS capsule proportions are composed from a precisely matched
 * solid shadow block and face. No decorative paths, strokes, outlines or highlights.
 * The native button/anchor and label layers preserve existing storefront handlers.
 */
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Load the compact SVG controller only for routes that actually render C05
// buttons. Absolute root path also works with version-pinned Artist's Edit.
function ensureCompactRuntime(){
  if(typeof window==='undefined'||window.__chapchitraC05LoaderRequested)return;
  window.__chapchitraC05LoaderRequested=true;
  void import('/compact-button-runtime.mjs').catch(error=>{
    window.__chapchitraC05LoaderRequested=false;
    console.warn('C05 keeps its approved static SVG fallback:',error);
  });
}
// The C06 long controller is separate from the approved compact SVG player.
function ensureLongRuntime(){
  if(typeof window==='undefined'||window.__chapchitraC06LoaderRequested)return;
  window.__chapchitraC06LoaderRequested=true;
  void import('/long-button-runtime.mjs').catch(error=>{
    window.__chapchitraC06LoaderRequested=false;
    console.warn('C06 keeps its original, self-hosted long SVG poster:',error);
  });
}
export const sketchTones = ['forest','terracotta','beige'];
export const sketchVariants = ['compact','long'];
export function sketchArt(variant='compact',tone='forest',organic=variant==='compact'){
  if(variant==='long'){
    const color=tone==='beige'?'neutral':tone;
    return '<span class="cc-long-art" aria-hidden="true"><img class="cc-long-fallback" src="/assets/long/long-button-'+color+'.svg?c06=final-1" width="320" height="54" alt="" loading="eager" decoding="async"></span>';
  }
  if(variant==='compact'&&organic){
    const color=tone==='beige'?'neutral':tone;
    if(!['forest','terracotta','neutral'].includes(color))throw new TypeError('Unsupported compact SVG tone');
    return '<span class="cc-compact-art" aria-hidden="true"><img class="cc-compact-fallback" src="/assets/compact/compact-button-'+color+'.svg?c05=final-colors-ink-2" width="164" height="64" alt="" loading="eager" decoding="async"></span>';
  }
  if(!sketchVariants.includes(variant))throw new TypeError('Unsupported CHAPCHITRA pill variant');
  // Equal-sized shadow and face, offset by the same fixed x/y distance. CSS
  // border-radius:9999px gives genuine semicircular caps at ANY rendered width.
  return '<span class="cc-pill-art cc-pill-art--'+variant+'" aria-hidden="true">'+
    '<span class="cc-pill-shadow"></span>'+
    '<span class="cc-pill-face"><span class="cc-pill-wipe"></span></span>'+
    '</span>';
}
export function sketchButton({label,variant='compact',tone='forest',href=null,attrs='',className='',type='button'}={}){
  if(!sketchVariants.includes(variant)||!sketchTones.includes(tone))throw new TypeError('Unsupported CHAPCHITRA pill variant/tone');
  const tag=href===null?'button':'a';
  const linkAttr=href===null?' type="'+(type==='submit'?'submit':'button')+'"':' href="'+escapeHTML(href)+'"';
  // attrs are internal, trusted application markup, never raw visitor input.
  // Short inline form controls intentionally retain their existing CSS capsules.
  const organic=variant==='compact'&&!String(className).split(/\s+/).includes('cc-sketch--inline');
  if(organic)ensureCompactRuntime();
  if(variant==='long')ensureLongRuntime();
  const classes=['cc-sketch','cc-sketch--'+variant,'cc-sketch--'+tone,organic?'cc-compact-artwork':'',variant==='long'?'cc-long-artwork':'',className].filter(Boolean).join(' ');
  const text=escapeHTML(label??'');
  return '<'+tag+linkAttr+' class="'+classes+'" '+attrs+'>'+
    sketchArt(variant,tone,organic)+
    '<span class="cc-sketch-copy"><span class="cc-sketch-label">'+text+'</span>'+
    '<span class="cc-sketch-label-ink" aria-hidden="true">'+text+'</span></span>'+
    '</'+tag+'>';
}
