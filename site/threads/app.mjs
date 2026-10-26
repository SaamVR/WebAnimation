/** THREADS standalone homepage. Static presentation and connected demo state only.
 * T01 spotlight and T02 symbolic fly-to-cart are isolated approved interactions.
 * T03 backpack reveal and T04 payment cinematics remain unimplemented. */
import {refreshReferenceCrops} from './art-crops.mjs';
import {favoriteButton,installNavbarHeart,syncNavbarFavorites,syncFavoriteButtons} from './favorite-icon.mjs';
import {dealDisplay,countdownParts,offerCycleEnd} from './deals.mjs';
import {catalog,productMeta,imageUrl,priceTk,safeHTML,curateShopProducts,merchandisingCategory} from './catalog.mjs';
import {CART_KEY,FAVORITES_KEY,addCartItem,cartSummary,cartCount,getFavorites,toggleFavorite} from './store-core.mjs';
import {initInlineSearch} from './search-header.mjs';
import {playT02,installArticulatedHeaderCart,prepareCartBadge,syncCartVisual,settleCartBadge} from './t02-fly-cart.mjs';
const state={filter:'All'};
const byId=id=>document.getElementById(id);
let toastTimeout;
function showToast(message){const n=byId('toast');n.textContent=message;n.classList.add('is-visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>n.classList.remove('is-visible'),2200)}
function productMarkup(p){
 const name=safeHTML(p.name),saved=getFavorites().has(p.id);
 return '<article class="product-card" data-product-id="'+p.id+'" data-t01-card>'+
   '<div class="product-media" data-t02-image>'+
   '<a class="product-media-link" href="/product/?id='+encodeURIComponent(p.id)+'" aria-label="View '+name+' details"><img src="'+imageUrl(p)+'" alt="'+name+'" loading="'+(p.group==='featured'?'eager':'lazy')+'"></a>'+
   favoriteButton(p,saved)+'</div>'+
   '<div class="product-info"><h3><a href="/product/?id='+encodeURIComponent(p.id)+'">'+name+'</a></h3><p>'+safeHTML(p.subtitle)+'</p>'+
   '<div class="swatches" aria-label="Illustrative color options">'+p.swatches.map(c=>'<span style="background:'+c+'" aria-hidden="true"></span>').join('')+'</div>'+
   '<div class="product-rating" aria-label="Sample rating 4.7 out of 5"><span class="star">★</span> 4.7 (Demo)</div>'+
   '<div class="product-buy"><span class="home-product-price">'+dealDisplay(p)+'</span><button type="button" data-add="'+p.id+'" data-t02-add aria-label="Add '+name+' to cart">Add to Cart</button></div></div></article>';
}
function renderProducts(){
 for(const [group,target] of [['featured','featured-products'],['arrival','arrival-products']]){
  const candidates=group==='featured'
    ? catalog.filter(p=>p.id==='sho-08'||p.group==='featured')
    : catalog.filter(p=>p.group===group);
  const list=curateShopProducts(candidates.filter(p=>state.filter==='All'||
    (state.filter==='Favorites'?getFavorites().has(p.id):merchandisingCategory(p)===state.filter)));
  byId(target).innerHTML=list.length?list.map(productMarkup).join(''):'<p class="empty-products">No products in this collection.</p>';
 }
 syncNavbarFavorites(getFavorites().size);
 void refreshReferenceCrops();
}
/** Preserve existing card DOM on favorites changes, even in Favorites-filtered mode. */
function reconcileFavoriteMembership(saved){
 if(state.filter!=='Favorites')return;
 for(const [group,target] of [['featured','featured-products'],['arrival','arrival-products']]){
  const source=catalog.filter(p=>group==='featured'?(p.id==='sho-08'||p.group==='featured'):p.group==='arrival');
  const desired=curateShopProducts(source.filter(p=>saved.has(p.id)));
  const grid=byId(target),ids=new Set(desired.map(p=>p.id));
  let membershipChanged=false;
  for(const card of grid.querySelectorAll('[data-product-id]')){
   if(!ids.has(card.dataset.productId)){card.remove();membershipChanged=true;}
  }
  for(const [index,p] of desired.entries()){
   let card=[...grid.querySelectorAll('[data-product-id]')].find(el=>el.dataset.productId===p.id);
   if(!card){
    const template=document.createElement('template');template.innerHTML=productMarkup(p);
    card=template.content.firstElementChild;membershipChanged=true;
   }
   const at=grid.querySelectorAll('[data-product-id]')[index]||null;
   if(card!==at)grid.insertBefore(card,at);
  }
  const empty=grid.querySelector('.empty-products');
  if(desired.length){empty?.remove()}
  else if(!empty){const message=document.createElement('p');message.className='empty-products';message.textContent='No products in this collection.';grid.append(message)}
  if(membershipChanged)void refreshReferenceCrops();
 }
}
function syncFavorites(){
 const saved=getFavorites();
 syncFavoriteButtons(document,saved);
 syncNavbarFavorites(saved.size);
 reconcileFavoriteMembership(saved);
}
function syncCart(){const bag=cartSummary();syncCartVisual(bag.count);byId('bag-total').textContent=priceTk(bag.total)}
function filterTo(category){state.filter=category;renderProducts();showToast(category==='All'?'Showing all products':'Showing '+category.toLowerCase())}
document.addEventListener('click',e=>{
 const add=e.target.closest('[data-add]');
 if(add){try{const p=catalog.find(x=>x.id===add.dataset.add);if(!p)return;const meta=productMeta(p);prepareCartBadge();const receipt=addCartItem({id:p.id,color:meta.colors[0].id,size:p.category==='Sneakers'?'40':meta.sizes[0],quantity:1});syncCart();void playT02({button:add,quantity:receipt.count}).catch(()=>settleCartBadge());showToast('Added to cart. Choose other variants on the product page.')}catch(err){settleCartBadge();showToast(err.message)}return}
 const save=e.target.closest('[data-save]');if(save){const yes=toggleFavorite(save.dataset.save);showToast(yes?'Saved to favorites':'Removed from favorites');return}
 const category=e.target.closest('[data-filter-link]');if(category)filterTo(category.dataset.filterLink);
});
installNavbarHeart();
byId('favorites-button').addEventListener('click',e=>{e.preventDefault();filterTo(state.filter==='Favorites'?'All':'Favorites');byId('shop').scrollIntoView({behavior:'auto'})});
byId('newsletter-form').addEventListener('submit',e=>{e.preventDefault();byId('newsletter-status').textContent='Thanks for exploring! This is a visual-only demo; your email has not been saved.';e.target.reset()});
installArticulatedHeaderCart();
initInlineSearch();
window.addEventListener('threads:cartchange',syncCart);
window.addEventListener('threads:favoriteschange',syncFavorites);
window.addEventListener('storage',event=>{
 if(event.key===FAVORITES_KEY||event.key===null)syncFavorites();
 if(event.key===CART_KEY||event.key===null)syncCart();
});
function tickOffer(){
 const clock=byId('offer-countdown'),status=byId('offer-status');
 if(!clock)return;
 const now=Date.now(),parts=countdownParts(now);
 clock.querySelectorAll('[data-countdown]').forEach((node,i)=>{node.textContent=String(parts[i]).padStart(2,'0')});
 status.textContent='15% off selected demo products · Recurring 21-day cycle ends '+new Date(offerCycleEnd(now)).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})+' UTC · Demo offers continue';
}
tickOffer();setInterval(tickOffer,1000);window.addEventListener('focus',tickOffer);
renderProducts();syncCart();