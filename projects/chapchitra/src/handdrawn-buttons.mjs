/**
 * CHAPCHITRA owner-supplied Buttons.png translated to actual scalable inline SVG.
 * The two separate irregular silhouettes, doubled outlines, sketch highlights and
 * offset ink shadow are part of the vector asset, not a PNG/background approximation.
 * Call sketchButton() for both anchors and native buttons.
 */
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact = {
  viewBox:'0 0 270 138',
  shadow:'M36 48C37 30 57 26 87 24C131 20 196 23 215 25C243 27 252 53 254 79C255 106 240 124 204 124L80 125C47 122 32 107 32 76C32 62 34 53 36 48Z',
  face:'M26 48C29 27 45 22 81 20C121 16 179 18 204 21C230 23 245 42 246 67C248 94 232 109 199 110L77 111C44 110 26 92 26 68C26 60 25 55 26 48Z',
  strokes:[
    'M39 33C65 12 164 11 211 23C232 29 246 47 251 67',
    'M27 70C25 93 36 109 61 119',
    'M236 48C247 68 249 84 241 96'
  ],
  lights:['M60 92C74 100 94 102 117 102','M196 43C207 37 221 38 232 46']
};
const long = {
  viewBox:'0 0 720 100',
  shadow:'M27 31C35 22 51 22 90 22L649 22C686 22 706 27 708 52C712 78 707 88 693 93C679 97 641 94 606 94L52 95C30 95 25 87 25 71Z',
  face:'M22 27C28 18 46 17 80 17L644 17C682 17 700 25 701 46C706 72 697 81 674 82L53 83C28 83 20 73 20 54C19 39 18 33 22 27Z',
  strokes:[
    'M210 18C320 11 525 12 653 20',
    'M23 60C22 78 30 84 52 86L143 87',
    'M681 28C692 32 699 40 701 53'
  ],
  lights:['M119 72C163 77 218 77 267 77','M589 29C615 26 642 27 662 30']
};
export const sketchTones = ['forest','terracotta','beige'];
export const sketchVariants = ['compact','long'];
export function sketchArt(variant='compact'){
  const a=variant==='long'?long:compact;
  return '<svg class="cc-sketch-art" viewBox="'+a.viewBox+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+
    '<path class="cc-sketch-shadow" d="'+a.shadow+'"/>'+
    '<path class="cc-sketch-face" d="'+a.face+'"/>'+
    '<path class="cc-sketch-face-ink" d="'+a.face+'"/>'+
    a.strokes.map(d=>'<path class="cc-sketch-outline" d="'+d+'"/>').join('')+
    a.lights.map(d=>'<path class="cc-sketch-highlight" d="'+d+'"/>').join('')+
    '</svg>';
}
export function sketchButton({label,variant='compact',tone='forest',href=null,attrs='',className='',type='button'}={}){
  if(!sketchVariants.includes(variant)||!sketchTones.includes(tone))throw new TypeError('Unsupported CHAPCHITRA sketch variant/tone');
  const tag=href===null?'button':'a';
  const linkAttr=href===null?' type="'+(type==='submit'?'submit':'button')+'"':' href="'+escapeHTML(href)+'"';
  // attrs are supplied by trusted application callsites only, never entered by users.
  const classes=['cc-sketch','cc-sketch--'+variant,'cc-sketch--'+tone,className].filter(Boolean).join(' ');
  const text=escapeHTML(label??'');
  return '<'+tag+linkAttr+' class="'+classes+'" '+attrs+'>'+
    sketchArt(variant)+
    '<span class="cc-sketch-copy"><span class="cc-sketch-label">'+text+'</span>'+
    '<span class="cc-sketch-label-ink" aria-hidden="true">'+text+'</span></span>'+
    '</'+tag+'>';
}
