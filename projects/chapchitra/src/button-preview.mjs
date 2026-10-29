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

// Reusable context classes are the same selectors used by the live storefront.
// These examples actively sample computed shadow color on each background.
const surfaces=[
 ['light','Gallery White','#F6F7F5'],
 ['cream','Soft Cream','#E4E3DE'],
 ['gray','Warm Gray','#DDDAD3'],
 ['forest','Forest Green','#293D2D'],
 ['olive','Dark Olive','#1F2216']
];
container.insertAdjacentHTML('beforeend','<section class="review-section surface-review" aria-labelledby="surfaceReviewTitle">'+
 '<h2 id="surfaceReviewTitle">Shadow contrast by surface</h2>'+
 '<p>Each shadow is a solid pill in a reusable surface theme. Colored faces, typography and the progressive wipe remain unchanged.</p>'+
 surfaces.map(([surface,label,bg])=>'<div class="review-board surface-preview cc-shadow-context--'+surface+'" data-surface="'+surface+'" style="--sample-surface:'+bg+'">'+
 '<h3>'+label+'</h3><div class="surface-buttons">'+tones.map(([tone,toneLabel])=>
 sketchButton({label:toneLabel==='Warm Terracotta'?'Explore':'Shop Now',variant:'compact',tone,
 attrs:'data-test-label="'+surface+' '+tone+' contrast" title="'+toneLabel+' on '+label+'"'})
 ).join('')+'</div></div>').join('')+'</section>');

container.addEventListener('click',event=>{
 const el=event.target.closest('.cc-sketch');if(!el)return;
 document.getElementById('reviewStatus').textContent='Activated '+el.dataset.testLabel+' · Native button, no navigation or cart modification.';
});
