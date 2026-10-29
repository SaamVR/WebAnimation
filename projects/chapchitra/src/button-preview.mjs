import {sketchButton} from './handdrawn-buttons.mjs';
const states=['default','hover','pressed','focus'];
const variants=[['compact','Compact Capsule'],['long','Long Cart Button']];
const tones=[['forest','Deep Forest Green'],['terracotta','Warm Terracotta'],['beige','Soft Beige']];
const container=document.getElementById('reviewButtons');
container.innerHTML=variants.map(([variant,name])=>'<section class="review-section"><h2>'+name+'</h2><p>Smooth solid capsules with true semicircular ends and a matching charcoal offset shadow at every screen size.</p>'+
 tones.map(([tone,label])=>'<div class="review-board"><h3>'+label+'</h3><p class="ref">'+(variant==='long'?'Slim elongated pill':'Compact full pill')+' · Default / Hover / Pressed / Focus</p><div class="review-columns">'+
 states.map(state=>'<div class="review-case"><span class="state">'+state+'</span>'+
 sketchButton({label:variant==='long'?'ADD TO BAG':'SHOP NOW',variant,tone,attrs:'data-preview-state="'+(state==='default'?'':state)+'" data-test-label="'+variant+' '+tone+' '+state+'" title="Click to test '+label+' '+state+'"'})+
 '<span class="helper">'+(state==='default'?'Interactive':'Pinned state')+'</span></div>').join('')+'</div></div>').join('')+'</section>').join('');
container.addEventListener('click',event=>{
 const el=event.target.closest('.cc-sketch');if(!el)return;
 document.getElementById('reviewStatus').textContent='Activated '+el.dataset.testLabel+' · Native button, no navigation or cart modification.';
});
