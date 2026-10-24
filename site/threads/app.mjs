/** THREADS standalone homepage. Static presentation and connected demo state only.
 * T01 spotlight and T02 symbolic fly-to-cart are isolated approved interactions.
 * T03 backpack reveal and T04 payment cinematics remain unimplemented. */
import {refreshReferenceCrops} from './art-crops.mjs';
import {catalog,productMeta,imageUrl,priceTk,safeHTML,curateShopProducts,merchandisingCategory} from './catalog.mjs';
import {addCartItem,cartSummary,cartCount,getFavorites,toggleFavorite} from './store-core.mjs';
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
   '<button class="heart-button" type="button" data-save="'+p.id+'" aria-label="'+(saved?'Remove '+name+' from':'Save '+name+' to')+' favorites" aria-pressed="'+saved+'">'+(saved?'♥':'♡')+'</button></div>'+
   '<div class="product-info"><h3><a href="/product/?id='+encodeURIComponent(p.id)+'">'+name+'</a></h3><p>'+safeHTML(p.subtitle)+'</p>'+
   '<div class="swatches" aria-label="Illustrative color options">'+p.swatches.map(c=>'<span style="background:'+c+'" aria-hidden="true"></span>').join('')+'</div>'+
   '<div class="product-rating" aria-label="Sample rating 4.7 out of 5"><span class="star">★</span> 4.7 (Demo)</div>'+
   '<div class="product-buy"><strong>'+priceTk(p.price)+'</strong><button type="button" data-add="'+p.id+'" data-t02-add aria-label="Add '+name+' to cart">Add to Cart</button></div></div></article>';
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
 void refreshReferenceCrops();
}
function syncCart(){const bag=cartSummary();syncCartVisual(bag.count);byId('bag-total').textContent=priceTk(bag.total)}
function filterTo(category){state.filter=category;renderProducts();showToast(category==='All'?'Showing all products':'Showing '+category.toLowerCase())}
document.addEventListener('click',e=>{
 const add=e.target.closest('[data-add]');
 if(add){try{const p=catalog.find(x=>x.id===add.dataset.add);if(!p)return;const meta=productMeta(p);prepareCartBadge();const receipt=addCartItem({id:p.id,color:meta.colors[0].id,size:p.category==='Sneakers'?'40':meta.sizes[0],quantity:1});syncCart();void playT02({button:add,quantity:receipt.count}).catch(()=>settleCartBadge());showToast('Added to cart. Choose other variants on the product page.')}catch(err){settleCartBadge();showToast(err.message)}return}
 const save=e.target.closest('[data-save]');if(save){const yes=toggleFavorite(save.dataset.save);renderProducts();showToast(yes?'Saved to favorites':'Removed from favorites');return}
 const category=e.target.closest('[data-filter-link]');if(category)filterTo(category.dataset.filterLink);
});
byId('favorites-button').addEventListener('click',e=>{e.preventDefault();filterTo(state.filter==='Favorites'?'All':'Favorites');byId('shop').scrollIntoView({behavior:'auto'})});
byId('newsletter-form').addEventListener('submit',e=>{e.preventDefault();byId('newsletter-status').textContent='Thanks for exploring! This is a visual-only demo; your email has not been saved.';e.target.reset()});
installArticulatedHeaderCart();
initInlineSearch();
window.addEventListener('threads:cartchange',syncCart);
window.addEventListener('storage',()=>{syncCart();renderProducts()});
renderProducts();syncCart();