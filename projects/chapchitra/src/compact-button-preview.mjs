import {sketchButton} from '/handdrawn-buttons.mjs';
const specs=[
 {tone:'forest',title:'A — Press Green',caption:'Original lighter-green velvet texture · Warm Beige border · Graphite outline · Deep Forest shadow',label:'Shop Now'},
 {tone:'terracotta',title:'B — Terracotta',caption:'Walnut velvet texture · Warm Beige border · Graphite outline · Dark Olive shadow',label:'Explore'},
 {tone:'beige',title:'C — Mushroom Gray',caption:'Cream inner border · Graphite outline · Terracotta shadow',label:'Discover'}
];
const states=['rest','hover','pressed','interactive'];
const wrap=document.getElementById('compactSpecimens');
wrap.innerHTML=specs.map(({tone,title,caption,label})=>
 '<section class="compact-panel" data-tone="'+tone+'" aria-label="'+title+'"><h3>'+title+'</h3><p>'+caption+'</p><div class="compact-grid">'+
 states.map(state=>'<div class="compact-case"><span class="compact-caption">'+state+'</span>'+
 sketchButton({label,variant:'compact',tone,
  attrs:'data-compact-sample="'+tone+' '+state+'" '+(state==='interactive'?'':'data-preview-state="'+(state==='rest'?'':state)+'"')})+
 '</div>').join('')+'</div></section>').join('');
document.getElementById('compactLongComparison').innerHTML=
 '<div><span class="compact-value">Approved 164 × 64 SVG compact</span>'+
 sketchButton({label:'Shop Now',variant:'compact',tone:'forest',attrs:'data-compact-sample="compare compact"'})+
 '</div><div><span class="compact-value">Original long CSS pill — unchanged</span>'+
 sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',attrs:'data-compact-sample="compare long"'})+
 '</div>';
document.querySelector('main').addEventListener('click',event=>{
 const button=event.target.closest('[data-compact-sample]');
 if(button)document.getElementById('compactResponse').textContent='Activated '+button.dataset.compactSample+' — native button action retained.';
});