/**
 * THREADS standalone layout demo.
 * No T01/T02/T03/T04 animation implementations in this phase.
 * No commerce API, account system, persistent orders or payment processing.
 */

import { refreshReferenceCrops } from './art-crops.mjs';

const productCatalog = [
  { id:'f1', group:'featured', asset:'./assets/featured-olive-sneaker-card.webp', name:'Asics Gel-NYC', subtitle:'At once / Everyday Runner', category:'Sneakers', price:75, swatches:['#78836a','#a5ae95','#e6e3d6'], image:'feat-1', fallback:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=550&q=80' },
  { id:'f2', group:'featured', asset:'./assets/featured-silver-sneaker-card.webp', name:'Asics Gel-NYC Silver', subtitle:'At once / Sport Collection', category:'Sneakers', price:89, swatches:['#d8d5ce','#858982','#bdbeb9'], image:'feat-2', fallback:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=550&q=80' },
  { id:'f3', group:'featured', asset:'./assets/featured-red-backpack-card.webp', name:'Fjällräven Travel Backpack', subtitle:'Adventure Ready', category:'Bags', price:119, swatches:['#b94238','#bd9079','#656d54'], image:'feat-3', fallback:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=550&q=80' },
  { id:'f4', group:'featured', asset:'./assets/featured-black-headphones-card.webp', name:'Sony WH-1000XM5', subtitle:'Over-Ear Headphones', category:'Accessories', price:129, swatches:['#282929','#a7a29a','#dcd7c9'], image:'feat-4', fallback:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=550&q=80' },
  { id:'n1', group:'arrival', name:'New Balance 550', subtitle:'Men’s Lifestyle Sneakers', category:'Sneakers', price:134.99, swatches:['#21394b','#ddddcf','#82909b'], image:'arrival-1', fallback:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=550&q=80' },
  { id:'n2', group:'arrival', name:'The Daily Duffel', subtitle:'Everyday Carry Bag', category:'Bags', price:89.99, swatches:['#ec6c36','#233f40','#d3b693'], image:'arrival-2', fallback:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=550&q=80' },
  { id:'n3', group:'arrival', name:'New Balance 550', subtitle:'Men’s Lifestyle Sneakers', category:'Sneakers', price:134.99, swatches:['#bda38c','#444a43','#eee5d8'], image:'arrival-3', fallback:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=550&q=80' },
  { id:'n4', group:'arrival', name:'Classic Backpack', subtitle:'Everyday Essentials', category:'Bags', price:79.99, swatches:['#143b32','#cdbd9f','#40443a'], image:'arrival-4', fallback:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=550&q=80' },
  { id:'n5', group:'arrival', name:'Asics Gel-Kayano 14', subtitle:'Men’s Lifestyle Sneakers', category:'Sneakers', price:129.99, swatches:['#d55e54','#252c32','#ded7c9'], image:'arrival-5', fallback:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=550&q=80' },
  { id:'n6', group:'arrival', name:'Classic Logo Cap', subtitle:'Everyday Essential', category:'Accessories', price:34.99, swatches:['#d69b2d','#274f60','#e9dcc5'], image:'arrival-6', fallback:'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=550&q=80' }
];
const state = { cart:new Map(), favorites:new Set(), filter:'All', search:'' };
const byId = (id) => document.getElementById(id);
const money = (num) => '$' + num.toFixed(2);
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
      '<img ' + (product.group === 'arrival' ? 'data-ref-img="'+product.image+'" ' : '') + 'src="' + (product.asset || product.fallback) + '" alt="' + safeName + '" loading="lazy">' +
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
