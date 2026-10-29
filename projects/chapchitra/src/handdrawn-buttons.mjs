/**
 * CHAPCHITRA clean pill button system.
 * Two responsive CSS capsule proportions are composed from a precisely matched
 * solid shadow block and face. No decorative paths, strokes, outlines or highlights.
 * The native button/anchor and label layers preserve existing storefront handlers.
 */
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const sketchTones = ['forest','terracotta','beige'];
export const sketchVariants = ['compact','long'];
export function sketchArt(variant='compact'){
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
  const classes=['cc-sketch','cc-sketch--'+variant,'cc-sketch--'+tone,className].filter(Boolean).join(' ');
  const text=escapeHTML(label??'');
  return '<'+tag+linkAttr+' class="'+classes+'" '+attrs+'>'+
    sketchArt(variant)+
    '<span class="cc-sketch-copy"><span class="cc-sketch-label">'+text+'</span>'+
    '<span class="cc-sketch-label-ink" aria-hidden="true">'+text+'</span></span>'+
    '</'+tag+'>';
}
