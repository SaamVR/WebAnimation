import { BLENDS,chooseBlend } from './identity-core.mjs';
const mount=document.getElementById('living-brand-root');
if(mount){
 mount.innerHTML=[
 '<div class="identity-showcase">',
 '<div class="identity-art"><iframe title="Generative botanical artwork from the Living Ink study" src="/projects/02-living-ink/?preview=1" loading="eager"></iframe>',
 '<div class="identity-art-caption">01 / AN IDENTITY GROWS</div></div>',
 '<div class="identity-packstage"><div class="identity-top"><span>02 / THE BRAND APPLIED</span><span>FICTIONAL TEA COLLECTION</span></div>',
 '<div class="identity-pack"><div class="identity-pack-lid"></div><div class="identity-pack-side"></div><div class="identity-pack-front">',
 '<div class="identity-pack-kicker">B O T A N I C A L &nbsp; T E A</div><div class="identity-leaf">✺</div>',
 '<div class="identity-brandname">verdant<span class="identity-mark">.</span></div><div id="identity-product" class="identity-product">Morning Mint</div>',
 '<div class="identity-pack-rule"></div><div class="identity-pack-foot">LOOSE LEAF TEA &nbsp; / &nbsp; CONCEPT PACKAGING</div>',
 '</div></div><div class="identity-variant-panel"><div class="identity-desc"><h2 id="identity-title">A brighter beginning.</h2>',
 '<p id="identity-desc">Cooling spearmint leaves and the clarity of a quiet morning ritual.</p></div>',
 '<div class="identity-variant" aria-label="Choose illustrated product blend" role="group">',
 BLENDS.map(b=>'<button type="button" class="identity-choice" data-blend="'+b.id+'" aria-pressed="false"><i style="background:'+b.color+'"></i>'+b.name+'</button>').join(''),
 '</div></div>',
 '<div class="identity-foot">IDENTITY SYSTEM → PRODUCT PACKAGE → CUSTOMER CHOICE</div>',
 '</div></div>'
 ].join('');
 const pack=mount.querySelector('.identity-packstage');
 const product=mount.querySelector('#identity-product');
 const heading=mount.querySelector('#identity-title');
 const desc=mount.querySelector('#identity-desc');
 function renderBlend(id){
  const blend=chooseBlend(id);
  pack.style.setProperty('--tea-color',blend.color);
  pack.style.setProperty('--tea-surface',blend.surface);
  product.textContent=blend.name;
  heading.textContent=blend.title;
  desc.textContent=blend.description;
  mount.querySelectorAll('.identity-choice').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.blend===blend.id)));
  mount.dataset.blend=blend.id;
 }
 mount.addEventListener('click',e=>{
   const b=e.target.closest('button[data-blend]');
   if(b)renderBlend(b.dataset.blend);
 });
 renderBlend('mint');mount.dataset.ready='true';
}
