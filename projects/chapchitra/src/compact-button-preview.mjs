import {sketchButton} from '/handdrawn-buttons.mjs';
const specs=[
 {tone:'forest',title:'A — Press Green',caption:'Original lighter-green velvet texture · Warm Beige border · Graphite outline · Deep Forest shadow',label:'Shop Now'},
 {tone:'terracotta',title:'B — Terracotta',caption:'Walnut velvet texture · Warm Beige border · Graphite outline · Dark Olive shadow',label:'Explore'},
 {tone:'beige',title:'C — Mushroom Gray',caption:'Cream inner border · Graphite outline · Terracotta shadow',label:'Discover'}
];
const states=['rest','hover','pressed','interactive'];
const wrap=document.getElementById('c05Specimens');
wrap.innerHTML=specs.map(({tone,title,caption,label})=>
 '<section class="c05-panel" data-tone="'+tone+'" aria-label="'+title+'"><h3>'+title+'</h3><p>'+caption+'</p><div class="c05-grid">'+
 states.map(state=>'<div class="c05-case"><span class="c05-caption">'+state+'</span>'+
 sketchButton({label,variant:'compact',tone,
  attrs:'data-c05-sample="'+tone+' '+state+'" '+(state==='interactive'?'':'data-preview-state="'+(state==='rest'?'':state)+'"')})+
 '</div>').join('')+'</div></section>').join('');
document.getElementById('c05LongComparison').innerHTML=
 '<div><span class="c05-value">Approved 164 × 64 SVG compact</span>'+
 sketchButton({label:'Shop Now',variant:'compact',tone:'forest',attrs:'data-c05-sample="compare compact"'})+
 '</div><div><span class="c05-value">Original long CSS pill — unchanged</span>'+
 sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',attrs:'data-c05-sample="compare long"'})+
 '</div>';
document.querySelector('main').addEventListener('click',event=>{
 const button=event.target.closest('[data-c05-sample]');
 if(button)document.getElementById('c05Response').textContent='Activated '+button.dataset.c05Sample+' — native button action retained.';
});