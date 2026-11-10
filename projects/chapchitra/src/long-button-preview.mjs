import {sketchButton} from '/handdrawn-buttons.mjs';
const variants=[
 {tone:'forest',title:'A — Press Green',subtitle:'Warm Beige inner border · Graphite outline · Deep Forest shadow'},
 {tone:'terracotta',title:'B — Terracotta',subtitle:'Warm Beige border · Graphite outline · Dark Olive shadow'},
 {tone:'beige',title:'C — Mushroom Gray',subtitle:'Cream border · Graphite outline · Terracotta shadow'}
];
const states=['rest','hover','pressed','interactive'];
document.querySelector('#longSpecs').innerHTML=variants.map(({tone,title,subtitle})=>
 '<section class="long-panel" data-tone="'+tone+'"><h3>'+title+'</h3><p>'+subtitle+'</p><div class="long-grid">'+
 states.map(state=>'<div class="long-specimen"><span class="long-label">'+state+'</span>'+
 sketchButton({label:tone==='terracotta'?'Explore hand-dye studies':tone==='beige'?"Visit Artist's Edit":'ADD TO BAG',
  variant:'long',tone,attrs:'data-long-sample="'+tone+' '+state+'"'+(state==='interactive'?'':' data-preview-state="'+(state==='rest'?'':state)+'"')})+
 '</div>').join('')+'</div></section>').join('');
document.querySelector('#longAddDemo').innerHTML=sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',className:'product-add-button',attrs:'data-add-to-bag="long-demo" aria-label="Add one sample to isolated review bag"'});
document.querySelector('#longCompactContrast').innerHTML=sketchButton({label:'Discover',variant:'compact',tone:'beige',attrs:'data-long-compact-control="1"'});
const status=document.querySelector('#longStatus');
const demo=document.querySelector('#longAddDemo [data-add-to-bag]');
let count=0,reset=null;
demo.addEventListener('click',()=>{
 if(count>=99)return;
 count++;
 document.querySelector('#longBagCount').textContent=count+' demo item'+(count===1?'':'s')+' added in this preview';
 if(reset)clearTimeout(reset);
 for(const label of demo.querySelectorAll('.cc-sketch-label,.cc-sketch-label-ink'))label.textContent='ADDED';
 demo.classList.add('added');
 reset=setTimeout(()=>{
  for(const label of demo.querySelectorAll('.cc-sketch-label,.cc-sketch-label-ink'))label.textContent='ADD TO BAG';
  demo.classList.remove('added');
 },950);
});
document.querySelector('main').addEventListener('click',event=>{
 const pressed=event.target.closest('[data-long-sample]');
 if(pressed)status.textContent='Activated '+pressed.dataset.longSample+' (native button event)';
});
