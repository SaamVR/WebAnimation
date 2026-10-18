/**
 * THREADS standalone layout demo.
 * No T01/T02/T03/T04 animation implementations in this phase.
 * No commerce API, account system, persistent orders or payment processing.
 */

import { refreshReferenceCrops } from './art-crops.mjs';

const productCatalog = [
  { id:'f1', group:'featured', asset:'./assets/featured-emerald-runner-20261018.webp', name:'Emerald Track Runner', subtitle:'Fresh Green / Everyday Sneakers', category:'Sneakers', price:5990, swatches:['#62bf24','#e6edcb','#42533f'], image:'feat-1' },
  { id:'f2', group:'featured', asset:'./assets/featured-blue-threads-cap-20261018.webp', name:'THREADS Sky Cap', subtitle:'Blue / Everyday Cap', category:'Accessories', price:1390, swatches:['#19a9d5','#143a2e','#eef2ee'], image:'feat-2' },
  { id:'f3', group:'featured', asset:'./assets/featured-red-backpack-20261018.webp', name:'THREADS Travel Backpack', subtitle:'Red / Everyday Carry', category:'Bags', price:5990, swatches:['#c42c32','#532c29','#e6dfd5'], image:'feat-3' },
  { id:'f4', group:'featured', asset:'./assets/featured-black-headphones-20261018.webp', name:'Studio Wireless Headphones', subtitle:'Black / Over-Ear Audio', category:'Accessories', price:8990, swatches:['#282929','#523922','#dcd7c9'], image:'feat-4' },
  { id:'n1', group:'arrival', asset:'./assets/arrival-aqua-runner.webp', name:'Aqua Motion Runner', subtitle:'Aqua / Coral Everyday Sneaker', category:'Sneakers', price:5490, swatches:['#b4d4d3','#ef565c','#b9da52'], image:'arrival-1' },
  { id:'n2', group:'arrival', asset:'./assets/arrival-crimson-runner.webp', name:'Crimson Track Runner', subtitle:'Crimson / Black Athletic Sneaker', category:'Sneakers', price:4690, swatches:['#c71937','#161718','#e2e0d9'], image:'arrival-2' },
  { id:'n3', group:'arrival', asset:'./assets/arrival-amber-runner.webp', name:'Amber Street Runner', subtitle:'Mustard / Black Everyday Sneaker', category:'Sneakers', price:4990, swatches:['#f5b820','#1a1b1b','#e5e4de'], image:'arrival-3' },
  { id:'n4', group:'arrival', asset:'./assets/arrival-bottom-orange-cream-20261018.webp', name:'Orange Velocity Runner', subtitle:'Orange / Cream Sport Sneaker', category:'Sneakers', price:6490, swatches:['#f06a20','#171817','#e8e3d5'], image:'arrival-4' },
  { id:'n5', group:'arrival', asset:'./assets/arrival-bottom-lime-20261018.webp', name:'Lime Motion Runner', subtitle:'Lime Green / Lightweight Sneaker', category:'Sneakers', price:4690, swatches:['#a2de3b','#1c2820','#e3e6dd'], image:'arrival-5' },
  { id:'n6', group:'arrival', asset:'./assets/arrival-bottom-black-teal-20261018.webp', name:'Teal Night Runner', subtitle:'Black / Turquoise Sport Sneaker', category:'Sneakers', price:6290, swatches:['#171b1d','#24c7c5','#555b55'], image:'arrival-6' },
];
const state = { cart:new Map(), favorites:new Set(), filter:'All', search:'' };
const byId = (id) => document.getElementById(id);
const money = (num) => 'Tk ' + Math.round(num).toLocaleString('en-BD');
const escapeText = (s) => s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimeout;

function showToast(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove('is-visible'), 2200);
}

function productMarkup(product) {
  const safeName = escapeText(product.name);
  const saved = state.favorites.has(product.id);
  return '<article class="product-card" data-product-id="' + product.id + '">' +
    '<div class="product-media">' +
      '<img ' + (product.group === 'arrival' && !product.asset ? 'data-ref-img="'+product.image+'" ' : '') + 'src="' + (product.asset || product.fallback) + '" alt="' + safeName + '" loading="' + (product.group === 'featured' ? 'eager' : 'lazy') + '">' +
      '<button type="button" class="heart-button" data-save="' + product.id + '" aria-label="' + (saved?'Remove ':'Save ') + safeName + (saved?' from':' to') + ' favorites" aria-pressed="' + saved + '">' + (saved?'♥':'♡') + '</button>' +
    '</div><div class="product-info"><h3>' + safeName + '</h3><p>' + escapeText(product.subtitle) + '</p>' +
    '<div class="swatches" aria-label="Available color palette">' + product.swatches.map((color) => '<span style="background:' + color + '" aria-hidden="true"></span>').join('') + '</div>' +
    '<div class="product-rating" aria-label="Sample rating 4.7 out of 5"><span class="star">★</span> 4.7 (Demo)</div>' +
    '<div class="product-buy"><strong>' + money(product.price) + '</strong><button type="button" data-add="' + product.id + '" aria-label="Add ' + safeName + ' to bag">Add to Cart</button></div>' +
    '</div></article>';
}

function renderProducts() {
  const matches = (p) => (state.filter==='All'||(state.filter==='Favorites'?state.favorites.has(p.id):p.category===state.filter)) &&
    (p.name+' '+p.subtitle+' '+p.category).toLowerCase().includes(state.search.toLowerCase());
  const renderGroup = (group, target) => {
    const matchesInGroup = productCatalog.filter((p) => p.group===group && matches(p));
    byId(target).innerHTML = matchesInGroup.length ? matchesInGroup.map(productMarkup).join('') :
      '<p class="empty-products">No matching products in this collection.</p>';
  };
  renderGroup('featured','featured-products');
  renderGroup('arrival','arrival-products');
  void refreshReferenceCrops();
}

function renderBag() {
  const count = [...state.cart.values()].reduce((a,b) => a+b,0);
  const total = [...state.cart.entries()].reduce((a,[id,q]) => a+productCatalog.find((p)=>p.id===id).price*q,0);
  byId('bag-count').textContent = String(count);
  byId('bag-button').setAttribute('aria-label','Open shopping cart, '+count+' items');
  byId('bag-total').textContent = money(total);
  byId('bag-lines').innerHTML = count ?
    [...state.cart.entries()].map(([id,quantity]) => {
      const item = productCatalog.find((p) => p.id===id);
      const image = document.querySelector('[data-product-id="'+id+'"] img');
      const imgSrc = image?.src || item.asset || item.fallback;
      return '<div class="bag-line"><img src="'+imgSrc+'" alt=""><div><h3>'+escapeText(item.name)+'</h3><p>Qty '+quantity+' · '+money(item.price*quantity)+'</p></div><button type="button" data-remove="'+id+'">Remove</button></div>';
    }).join('') : '<p>Your bag is empty. Explore the sample collection to add an item.</p>';
}

function setBagOpen(open) {
  byId('bag-drawer').hidden = !open;
  byId('drawer-scrim').hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {renderBag();byId('bag-close').focus();}
  else byId('bag-button').focus();
}
function setSearchOpen(open) {
  byId('search-area').hidden = !open;
  byId('search-button').setAttribute('aria-expanded',String(open));
  if(open) byId('search-input').focus();
  else byId('search-button').focus();
}
function filterTo(category) {
  state.filter = category;
  renderProducts();
  showToast(category==='All'?'Showing all products':'Showing '+category.toLowerCase());
}

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add]');
  if(add){
    const id=add.dataset.add;
    state.cart.set(id,(state.cart.get(id)||0)+1);
    renderBag();
    showToast('Added to your demo cart');
    return;
  }
  const save=event.target.closest('[data-save]');
  if(save){
    const id=save.dataset.save;
    if(state.favorites.has(id))state.favorites.delete(id);
    else state.favorites.add(id);
    renderProducts();
    showToast(state.favorites.has(id)?'Saved to favorites':'Removed from favorites');
    return;
  }
  const remove=event.target.closest('[data-remove]');
  if(remove){
    state.cart.delete(remove.dataset.remove);renderBag();showToast('Item removed');return;
  }
  const category=event.target.closest('[data-filter-link]');
  if(category){filterTo(category.dataset.filterLink);}
});

byId('bag-button').addEventListener('click',()=>setBagOpen(true));
byId('bag-close').addEventListener('click',()=>setBagOpen(false));
byId('drawer-scrim').addEventListener('click',()=>setBagOpen(false));
byId('search-button').addEventListener('click',()=>setSearchOpen(byId('search-area').hidden));
byId('search-close').addEventListener('click',()=>{state.search='';byId('search-input').value='';renderProducts();setSearchOpen(false);});
byId('search-input').addEventListener('input',(event)=>{
  state.search=event.target.value.trim();
  renderProducts();
  const visible=productCatalog.filter(p=>(p.name+' '+p.subtitle+' '+p.category).toLowerCase().includes(state.search.toLowerCase())).length;
  byId('search-feedback').textContent=state.search?visible+' matching sample products':'Search the demo catalog.';
});
byId('favorites-button').addEventListener('click',()=>{
  filterTo(state.filter==='Favorites'?'All':'Favorites');
  byId('shop').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
});
byId('newsletter-form').addEventListener('submit',(event)=>{
  event.preventDefault();
  byId('newsletter-status').textContent='Thanks for exploring! This is a visual-only demo; your email has not been saved.';
  event.target.reset();
});
document.addEventListener('keydown',(event)=>{
  if(event.key!=='Escape')return;
  if(!byId('bag-drawer').hidden)setBagOpen(false);
  else if(!byId('search-area').hidden)setSearchOpen(false);
});
renderProducts();
renderBag();
